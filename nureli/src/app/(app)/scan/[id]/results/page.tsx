'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageLoading } from '@/components/loading-states';
import { MOCK_SCAN_RESULT } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/constants';
import { NUTRIENT_CONFIG } from '@/lib/constants';
import { getScan } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { ScanResult, NutrientKey, NutrientScore } from '@/types/scores';

/* ── Helpers ── */

function getColor(s: number): string {
  if (s >= 75) return '#059669';
  if (s >= 50) return '#D97706';
  if (s >= 30) return '#EA580C';
  return '#DC2626';
}

function getStatus(s: number): string {
  if (s >= 75) return 'Strong';
  if (s >= 50) return 'Moderate';
  if (s >= 30) return 'Low';
  return 'Deficient';
}

/* ── SVG Score Ring ── */

function ScoreRing({ score }: { score: number }) {
  const r = 50, sw = 6;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const col = getColor(score);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#F1F5F9" strokeWidth={sw} />
        <circle cx="60" cy="60" r={r} fill="none" stroke={col} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 60 60)" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-bold text-neutral-900 tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>{score}</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] mt-1" style={{ color: col }}>{getStatus(score)}</span>
      </div>
    </div>
  );
}

/* ── Pure SVG Radar Chart (no recharts dependency) ── */

function RadarChart({ entries }: { entries: [NutrientKey, NutrientScore][] }) {
  const cx = 150, cy = 150, maxR = 110;
  const n = entries.length;
  const levels = [20, 40, 60, 80, 100];

  // Calculate points for each level ring
  function polyPoints(radius: number): string {
    return entries.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(' ');
  }

  // Data polygon
  const dataPoints = entries.map(([, d], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (d.score / 100) * maxR;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');

  // Label positions
  const labels = entries.map(([key], i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const labelR = maxR + 22;
    return {
      x: cx + labelR * Math.cos(angle),
      y: cy + labelR * Math.sin(angle),
      text: NUTRIENT_CONFIG[key]?.label.replace(' Support', '') ?? key,
      anchor: Math.abs(Math.cos(angle)) < 0.1 ? 'middle' as const :
              Math.cos(angle) > 0 ? 'start' as const : 'end' as const,
    };
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[340px] mx-auto" style={{ height: 'auto', aspectRatio: '1' }}>
      {/* Grid levels */}
      {levels.map((level) => (
        <polygon key={level} points={polyPoints((level / 100) * maxR)}
          fill="none" stroke="#E5E7EB" strokeWidth={0.6} />
      ))}

      {/* Axis lines */}
      {entries.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line key={i} x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)}
            stroke="#E5E7EB" strokeWidth={0.4} />
        );
      })}

      {/* Data polygon */}
      <polygon points={dataPoints} fill="rgba(5,150,105,0.08)" stroke="#059669" strokeWidth={1.5} />

      {/* Data dots */}
      {entries.map(([, d], i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const r = (d.score / 100) * maxR;
        return <circle key={i} cx={cx + r * Math.cos(angle)} cy={cy + r * Math.sin(angle)} r={2.5} fill="#059669" />;
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor={l.anchor} dominantBaseline="central"
          fontSize={8} fontWeight={600} fill="#6B7280">{l.text}</text>
      ))}
    </svg>
  );
}

/* ── Main Results Page ── */

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;
  const [result, setResult] = useState<ScanResult | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = sessionStorage.getItem(`scan-${scanId}`);
        if (stored) {
          const p = JSON.parse(stored);
          setResult({
            overallBalanceScore: p.overallBalanceScore ?? 0,
            nutrientScores: p.nutrientScores,
            focusAreas: p.focusAreas ?? [],
            recommendations: p.recommendations ?? [],
            confidenceNote: p.confidenceNote ?? '',
          });
          setDate(formatDate(p.createdAt ?? new Date().toISOString()));
          setLoading(false);
          return;
        }
        if (isDemoMode()) {
          setResult(MOCK_SCAN_RESULT);
          setDate(formatDate(new Date().toISOString()));
          setLoading(false);
          return;
        }
        const scan = await getScan(scanId);
        if (scan?.nutrientScores) {
          setResult({
            overallBalanceScore: scan.overallBalanceScore ?? 0,
            nutrientScores: scan.nutrientScores,
            focusAreas: scan.focusAreas ?? [],
            recommendations: scan.recommendations ?? [],
            confidenceNote: scan.confidenceNote ?? '',
          });
          setDate(formatDate(scan.createdAt));
        }
      } catch (e) {
        console.error('Failed to load results', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scanId]);

  if (loading) return <PageLoading />;
  if (!result) return (
    <div className="flex min-h-[50vh] items-center justify-center px-5">
      <p className="text-[14px] text-neutral-400 font-medium">No results found.</p>
    </div>
  );

  const entries = Object.entries(result.nutrientScores) as [NutrientKey, NutrientScore][];
  const sorted = [...entries].sort((a, b) => b[1].score - a[1].score);
  const avg = Math.round(entries.reduce((s, [, d]) => s + d.score, 0) / entries.length);

  return (
    <div className="max-w-lg mx-auto bg-white min-h-screen pb-28">

      {/* ─── Top Bar ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg px-5 h-12 flex items-center justify-between"
        style={{ borderBottom: '1px solid #F1F5F9' }}>
        <button onClick={() => router.back()}
          className="text-[13px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
          ← Back
        </button>
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.12em]">
          Nutrition Report
        </span>
        <div className="w-10" />
      </div>

      <div className="px-5 pt-8">

        {/* ─── Score ─── */}
        <div className="text-center mb-10">
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.14em] mb-5">
            Overall Balance Score
          </p>
          <ScoreRing score={result.overallBalanceScore} />
          <p className="text-[12px] text-neutral-400 mt-4">{date}</p>
        </div>

        <hr className="border-neutral-100 mb-10" />

        {/* ─── Radar Chart ─── */}
        <div className="mb-10">
          <h2 className="text-[15px] font-bold text-neutral-900 mb-0.5"
            style={{ fontFamily: 'var(--font-display)' }}>
            Nutrient Overview
          </h2>
          <p className="text-[11px] text-neutral-400 mb-6">
            Predicted balance across all assessed nutrients
          </p>
          <RadarChart entries={entries} />
        </div>

        <hr className="border-neutral-100 mb-10" />

        {/* ─── Nutrition Table ─── */}
        <div className="mb-10">
          <h2 className="text-[15px] font-bold text-neutral-900 mb-0.5"
            style={{ fontFamily: 'var(--font-display)' }}>
            Detailed Breakdown
          </h2>
          <p className="text-[11px] text-neutral-400 mb-5">
            Individual nutrient scores and status
          </p>

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #EAECF0' }}>
            {/* Header */}
            <div className="grid grid-cols-[1fr_60px_72px] px-4 py-2 bg-[#F9FAFB]
              text-[9px] font-bold uppercase tracking-[0.1em] text-neutral-400">
              <span>Nutrient</span>
              <span className="text-right">Score</span>
              <span className="text-right">Status</span>
            </div>

            {/* Rows */}
            {sorted.map(([key, data]) => {
              const col = getColor(data.score);
              return (
                <div key={key} className="grid grid-cols-[1fr_60px_72px] px-4 py-3 items-center"
                  style={{ borderTop: '1px solid #F3F4F6' }}>
                  <span className="text-[13px] text-neutral-800">
                    {NUTRIENT_CONFIG[key]?.label || key}
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-right" style={{ color: col }}>
                    {data.score}%
                  </span>
                  <span className="text-[10px] font-semibold text-right" style={{ color: col }}>
                    {getStatus(data.score)}
                  </span>
                </div>
              );
            })}

            {/* Footer */}
            <div className="grid grid-cols-[1fr_60px_72px] px-4 py-3 bg-[#F9FAFB] items-center"
              style={{ borderTop: '1px solid #EAECF0' }}>
              <span className="text-[12px] font-semibold text-neutral-700">Average</span>
              <span className="text-[13px] font-bold tabular-nums text-right" style={{ color: getColor(avg) }}>
                {avg}%
              </span>
              <span className="text-[10px] font-semibold text-right" style={{ color: getColor(avg) }}>
                {getStatus(avg)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Focus Areas ─── */}
        {result.focusAreas.length > 0 && (
          <>
            <hr className="border-neutral-100 mb-10" />
            <div className="mb-10">
              <h2 className="text-[15px] font-bold text-neutral-900 mb-0.5"
                style={{ fontFamily: 'var(--font-display)' }}>
                Areas of Attention
              </h2>
              <p className="text-[11px] text-neutral-400 mb-5">
                Nutrients that may benefit from dietary focus
              </p>
              <div className="space-y-3">
                {result.focusAreas.map((area) => {
                  const pCol = area.priority === 'high' ? '#DC2626' : area.priority === 'medium' ? '#D97706' : '#059669';
                  return (
                    <div key={area.nutrient} className="py-4 px-4 rounded-xl bg-[#FAFAFA]"
                      style={{ border: '1px solid #F1F5F9' }}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[13px] font-semibold text-neutral-900">{area.title}</span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: pCol }}>
                          {area.priority}
                        </span>
                      </div>
                      <p className="text-[12px] text-neutral-500 leading-[1.65]">{area.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ─── Suggestions ─── */}
        {result.recommendations.length > 0 && (
          <>
            <hr className="border-neutral-100 mb-10" />
            <div className="mb-10">
              <h2 className="text-[15px] font-bold text-neutral-900 mb-0.5"
                style={{ fontFamily: 'var(--font-display)' }}>
                Suggestions
              </h2>
              <p className="text-[11px] text-neutral-400 mb-5">
                Actionable steps to improve your nutrition balance
              </p>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={rec.id} className="py-4 px-4 rounded-xl" style={{ border: '1px solid #F1F5F9' }}>
                    <div className="flex gap-3">
                      <span className="text-[11px] font-bold text-neutral-300 tabular-nums leading-[1.7] shrink-0 mt-px">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 mb-1">{rec.title}</p>
                        <p className="text-[12px] text-neutral-500 leading-[1.65]">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── Disclaimer ─── */}
        <div className="pt-6 mb-8" style={{ borderTop: '1px solid #F1F5F9' }}>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.12em] mb-2">Disclaimer</p>
          <p className="text-[11px] text-neutral-400 leading-[1.7]">
            {result.confidenceNote || 'This report provides AI-predicted nutritional insight scores based on visual analysis and lifestyle questionnaire responses. Results are not clinical diagnoses and should not replace professional medical advice or laboratory testing.'}
          </p>
        </div>

        {/* ─── Actions ─── */}
        <div className="space-y-2.5 pb-4">
          <Link href="/scan/new" className="block">
            <button className="w-full h-12 rounded-xl bg-neutral-900 text-white text-[13px] font-semibold
              hover:bg-neutral-800 active:scale-[0.99] transition-all">
              New Scan
            </button>
          </Link>
          <Link href="/dashboard" className="block">
            <button className="w-full h-12 rounded-xl bg-white text-neutral-600 text-[13px] font-medium
              hover:bg-neutral-50 transition-all" style={{ border: '1px solid #E5E7EB' }}>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

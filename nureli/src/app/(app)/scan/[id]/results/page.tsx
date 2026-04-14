'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from '@/lib/motion';
import { InsightSummaryHeader } from '@/components/results/insight-summary-header';
import { ResultRingCard } from '@/components/results/result-ring-card';
import { NutrientScoreCard } from '@/components/results/nutrient-score-card';
import { RadarInsightsChart } from '@/components/results/radar-insights-chart';
import { PriorityFocusCard } from '@/components/results/priority-focus-card';
import { RecommendationCard } from '@/components/results/recommendation-card';
import { ConfidenceNoteCard } from '@/components/confidence-note-card';
import { SectionHeader } from '@/components/section-header';
import { PageLoading } from '@/components/loading-states';
import { MOCK_SCAN_RESULT } from '@/lib/mock-data';
import { isDemoMode } from '@/lib/constants';
import { getScan } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import type { ScanResult, NutrientKey } from '@/types/scores';

export default function ResultsPage() {
  const params = useParams();
  const scanId = params.id as string;
  const [result, setResult] = useState<ScanResult | null>(null);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Try sessionStorage first (set by scan/new page after analysis)
        const stored = sessionStorage.getItem(`scan-${scanId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setResult({
            overallBalanceScore: parsed.overallBalanceScore ?? 0,
            nutrientScores: parsed.nutrientScores,
            focusAreas: parsed.focusAreas ?? [],
            recommendations: parsed.recommendations ?? [],
            confidenceNote: parsed.confidenceNote ?? '',
          });
          setDate(formatDate(parsed.createdAt ?? new Date().toISOString()));
          setLoading(false);
          return;
        }

        // Demo mode fallback
        if (isDemoMode()) {
          setResult(MOCK_SCAN_RESULT);
          setDate(formatDate(new Date().toISOString()));
          setLoading(false);
          return;
        }

        // Production: fetch from database
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
      <p className="text-[14px] text-neutral-400 font-medium">No results found for this scan.</p>
    </div>
  );

  const nutrientEntries = Object.entries(result.nutrientScores) as [NutrientKey, typeof result.nutrientScores[NutrientKey]][];

  return (
    <div className="px-5 py-6 space-y-7 max-w-lg mx-auto">
      <InsightSummaryHeader score={result.overallBalanceScore} date={date} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex justify-center py-3">
        <ResultRingCard score={result.overallBalanceScore} />
      </motion.div>

      <RadarInsightsChart scores={result.nutrientScores} />

      <div>
        <SectionHeader title="Support Scores" subtitle="Predicted levels for key nutrients" />
        <div className="space-y-2.5">
          {nutrientEntries.map(([key, data], i) => (
            <NutrientScoreCard key={key} nutrientKey={key} data={data} index={i} />
          ))}
        </div>
      </div>

      {result.focusAreas.length > 0 && (
        <div>
          <SectionHeader title="Priority Focus" subtitle="Areas that may benefit from attention" />
          <div className="space-y-2.5">
            {result.focusAreas.map((area, i) => (
              <PriorityFocusCard key={area.nutrient} area={area} index={i} />
            ))}
          </div>
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div>
          <SectionHeader title="Suggestions" subtitle="Steps to support your nutrition" />
          <div className="space-y-2.5">
            {result.recommendations.map((rec, i) => (
              <RecommendationCard key={rec.id} rec={rec} index={i} />
            ))}
          </div>
        </div>
      )}

      {result.confidenceNote && <ConfidenceNoteCard note={result.confidenceNote} />}
    </div>
  );
}

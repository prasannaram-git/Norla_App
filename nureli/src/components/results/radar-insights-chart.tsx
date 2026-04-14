'use client';

import { motion } from '@/lib/motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { NUTRIENT_CONFIG } from '@/lib/constants';
import type { NutrientScores } from '@/types/scores';

interface RadarInsightsChartProps {
  scores: NutrientScores;
}

export function RadarInsightsChart({ scores }: RadarInsightsChartProps) {
  const data = Object.entries(scores).map(([key, val]) => ({
    subject: NUTRIENT_CONFIG[key as keyof typeof NUTRIENT_CONFIG].label.replace(' Support', ''),
    score: val.score,
    fullMark: 100,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl bg-white p-6 shadow-card"
      style={{ border: '1px solid rgba(0,0,0,0.04)' }}
    >
      <h3
        className="mb-5 text-[15px] font-bold text-neutral-900 text-center"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Nutrient Overview
      </h3>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#EBEEF2" strokeWidth={0.8} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#636E7A', fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#8D96A0', fontSize: 9 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.08}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

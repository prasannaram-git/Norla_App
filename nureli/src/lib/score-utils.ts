import type { ScoreStatus } from '@/types/scores';
import { SCORE_THRESHOLDS } from './constants';

export function getStatusFromScore(score: number): ScoreStatus {
  for (const threshold of SCORE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.status;
    }
  }
  return 'Unclear';
}

export function getStatusColor(status: ScoreStatus): string {
  const colors: Record<ScoreStatus, string> = {
    'Strong Support': '#059669',
    Balanced: '#10B981',
    Moderate: '#D97706',
    'Needs Attention': '#DC2626',
    'Low Support': '#991B1B',
    Unclear: '#8D96A0',
  };
  return colors[status];
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return '#059669';
  if (score >= 65) return '#10B981';
  if (score >= 50) return '#D97706';
  if (score >= 35) return '#DC2626';
  return '#991B1B';
}

export function getScoreGradient(score: number): [string, string] {
  if (score >= 80) return ['#059669', '#10B981'];
  if (score >= 65) return ['#10B981', '#34D399'];
  if (score >= 50) return ['#D97706', '#F59E0B'];
  if (score >= 35) return ['#DC2626', '#EF4444'];
  return ['#991B1B', '#DC2626'];
}

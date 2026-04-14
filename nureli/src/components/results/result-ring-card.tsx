'use client';

import { motion } from '@/lib/motion';
import { getStatusFromScore, getScoreGradient } from '@/lib/score-utils';

interface ResultRingCardProps {
  score: number;
}

export function ResultRingCard({ score }: ResultRingCardProps) {
  const status = getStatusFromScore(score);
  const [color1, color2] = getScoreGradient(score);
  const size = 168;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const gradientId = `score-gradient-${score}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="flex flex-col items-center"
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer glow */}
        <div
          className="absolute inset-2 rounded-full"
          style={{ boxShadow: `0 0 32px ${color1}18, 0 0 16px ${color1}10` }}
        />
        <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color1} />
              <stop offset="100%" stopColor={color2} />
            </linearGradient>
          </defs>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#EBEEF2" strokeWidth="9" />
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={`url(#${gradientId})`} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-[40px] font-bold text-neutral-900 tabular-nums tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
          >
            {score}
          </motion.span>
          <motion.span
            className="text-[12px] text-neutral-400 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            out of 100
          </motion.span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mt-4"
      >
        <span
          className="rounded-full px-4 py-1.5 text-[12px] font-bold tracking-wide"
          style={{ backgroundColor: `${color1}0D`, color: color1 }}
        >
          {status}
        </span>
      </motion.div>
    </motion.div>
  );
}

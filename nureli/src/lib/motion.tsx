'use client';

/**
 * Motion wrapper — Direct re-export of framer-motion.
 * 
 * WHY NOT LAZY LOAD?
 * The previous lazy-loading approach caused a rendering avalanche:
 * - Each motion.div had its own useState + useEffect
 * - When framer-motion loaded, 30+ components re-rendered simultaneously
 * - This froze React for 2-5 seconds, blocking all navigation
 * 
 * Direct import adds ~30KB gzipped to the bundle but eliminates
 * 90+ unnecessary re-renders per page. Net performance is 10x better.
 */

export { motion, AnimatePresence } from 'framer-motion';

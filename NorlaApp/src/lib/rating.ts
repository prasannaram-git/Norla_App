import AsyncStorage from '@react-native-async-storage/async-storage';
import { getScans } from './storage';

const RATING_KEY = 'norla_rating_prompted';
const MIN_SCANS = 3;

/** Should we show the rating prompt? */
export async function shouldShowRating(): Promise<boolean> {
  try {
    const already = await AsyncStorage.getItem(RATING_KEY);
    if (already) return false;

    const scans = await getScans();
    if (scans.length < MIN_SCANS) return false;

    // Don't show on first day — wait at least 24h since first scan
    const firstScan = scans[scans.length - 1];
    if (firstScan) {
      const hoursSinceFirst = (Date.now() - new Date(firstScan.createdAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceFirst < 24) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/** Mark that we've shown the rating prompt (won't show again) */
export async function markRatingShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(RATING_KEY, new Date().toISOString());
  } catch { /* best effort */ }
}

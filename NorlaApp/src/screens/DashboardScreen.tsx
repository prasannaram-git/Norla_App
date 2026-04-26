import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../lib/theme';
import { getProfile, getScans, canScanToday, type ScanCache } from '../lib/storage';
import { shouldShowRating } from '../lib/rating';
import { RatingModal } from '../components/RatingModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function DashboardScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [scans, setScans] = useState<ScanCache[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [hasPlan, setHasPlan] = useState(false);

  const load = async () => {
    const p = await getProfile();
    if (p?.name) setName(p.name.split(' ')[0]);
    setScans(await getScans());
    const cached = await AsyncStorage.getItem('norla_nutrition_plan');
    setHasPlan(!!cached);
  };

  useFocusEffect(useCallback(() => {
    load();
    shouldShowRating().then(show => { if (show) setShowRating(true); });
  }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  const latest = scans[0]?.overallBalanceScore ?? null;
  const scoreColor = (s: number) => s >= 75 ? colors.scoreHigh : s >= 50 ? colors.scoreMedium : s >= 30 ? colors.scoreLow : colors.scoreCritical;
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textQuaternary} />}>

        <Text style={s.greeting}>{greeting},</Text>
        <Text style={s.name}>{name || 'there'}</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBlock}>
            <Text style={s.statValue}>{scans.length}</Text>
            <Text style={s.statLabel}>Scans</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={[s.statValue, latest !== null && { color: scoreColor(latest) }]}>{latest ?? '--'}</Text>
            <Text style={s.statLabel}>Score</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBlock}>
            <Text style={s.statValue}>{scans.length > 0 ? 'Active' : 'New'}</Text>
            <Text style={s.statLabel}>Status</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.cta} activeOpacity={0.8} onPress={async () => {
          const allowed = await canScanToday();
          if (!allowed) {
            Alert.alert('Daily Limit', 'You have already completed a scan today. Come back tomorrow for your next analysis.');
            return;
          }
          nav.navigate('Scan');
        }}>
          <Text style={s.ctaTitle}>New Scan</Text>
          <Text style={s.ctaSub}>AI-powered nutrition analysis</Text>
        </TouchableOpacity>

        {/* Plan Card */}
        {scans.length > 0 && (
          <TouchableOpacity style={s.planCard} activeOpacity={0.7} onPress={() => nav.navigate('NutritionPlan' as any)}>
            <View style={{ flex: 1 }}>
              <Text style={s.planTitle}>{hasPlan ? 'Your Nutrition Plan' : 'Get Your Nutrition Plan'}</Text>
              <Text style={s.planSub}>{hasPlan ? 'View your personalized daily meal plan' : 'AI-powered daily meal plan based on your scan'}</Text>
            </View>
            <Text style={s.planArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={s.separator} />
        <Text style={s.sectionTitle}>Recent</Text>

        {scans.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No scans yet</Text>
            <Text style={s.emptyText}>Complete your first nutrition scan to see results here.</Text>
          </View>
        ) : (
          scans.slice(0, 5).map(scan => (
            <TouchableOpacity key={scan.id} style={s.scanRow} activeOpacity={0.6} onPress={() => nav.navigate('Results', { scanData: scan })}>
              <View style={[s.scanScoreCircle, { borderColor: scoreColor(scan.overallBalanceScore) }]}>
                <Text style={[s.scanScoreNum, { color: scoreColor(scan.overallBalanceScore) }]}>{scan.overallBalanceScore}</Text>
              </View>
              <View style={s.scanInfo}>
                <Text style={s.scanTitle}>Nutrition Scan</Text>
                <Text style={s.scanDate}>{new Date(scan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <RatingModal visible={showRating} onClose={() => setShowRating(false)} />
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 40 },
  greeting: { fontSize: 15, color: c.textTertiary },
  name: { fontSize: 32, fontWeight: '700', color: c.text, letterSpacing: -0.8, marginBottom: 32 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.hairline, marginBottom: 28 },
  statBlock: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  statLabel: { fontSize: 12, color: c.textTertiary, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: c.hairline },
  cta: { backgroundColor: c.invertedBg, borderRadius: RADIUS.md, paddingHorizontal: 20, paddingVertical: 18, marginBottom: 14 },
  ctaTitle: { fontSize: 17, fontWeight: '600', color: c.invertedText },
  ctaSub: { fontSize: 13, color: c.textTertiary, marginTop: 2 },
  planCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.cardBg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 18, paddingVertical: 18, marginBottom: 28,
  },
  planTitle: { fontSize: 15, fontWeight: '600', color: c.text },
  planSub: { fontSize: 12, color: c.textTertiary, marginTop: 3 },
  planArrow: { fontSize: 18, color: c.brand, fontWeight: '500', marginLeft: 12 },
  separator: { height: 1, backgroundColor: c.hairline, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16 },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
  emptyText: { fontSize: 14, color: c.textTertiary, marginTop: 4, textAlign: 'center', lineHeight: 20 },
  scanRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.hairline },
  scanScoreCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  scanScoreNum: { fontSize: 16, fontWeight: '700' },
  scanInfo: { flex: 1, marginLeft: 14 },
  scanTitle: { fontSize: 15, fontWeight: '500', color: c.text },
  scanDate: { fontSize: 13, color: c.textTertiary, marginTop: 2 },
});

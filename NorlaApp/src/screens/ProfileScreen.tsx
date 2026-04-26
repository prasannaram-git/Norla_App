import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../lib/theme';
import { getProfile, clearSession, getScans, type UserProfile, type ScanCache } from '../lib/storage';
import { deleteAccount } from '../lib/api';
import { APP_VERSION } from '../lib/constants';

function formatDob(dob: string): string {
  if (!dob) return '--';
  const d = new Date(dob);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${age} years`;
}

const NUTRIENT_NAMES: Record<string, string> = {
  iron: 'Iron', b12: 'Vitamin B12', vitD: 'Vitamin D', vitA: 'Vitamin A',
  folate: 'Folate', zinc: 'Zinc', protein: 'Protein', hydration: 'Hydration',
  vitC: 'Vitamin C', omega3: 'Omega-3',
};

export function ProfileScreen() {
  const nav = useNavigation<any>();
  const { colors, isDark, toggle, mode } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<ScanCache[]>([]);

  useFocusEffect(useCallback(() => {
    getProfile().then(setProfile);
    getScans().then(setScans);
  }, []));

  const latestScan = scans[0];
  const latestScore = latestScan?.overallBalanceScore ?? null;
  const scoreColor = (s: number) => s >= 75 ? colors.scoreHigh : s >= 50 ? colors.scoreMedium : s >= 30 ? colors.scoreLow : colors.scoreCritical;
  const statusLabel = (s: number) => s >= 75 ? 'Good' : s >= 50 ? 'Fair' : s >= 30 ? 'Low' : 'Critical';

  const getNutrientInsights = () => {
    if (!latestScan?.nutrientScores) return { strengths: [], focus: [] };
    const entries = Object.entries(latestScan.nutrientScores)
      .filter(([k]) => NUTRIENT_NAMES[k])
      .map(([k, v]) => ({ key: k, score: typeof v === 'object' ? (v as any).score ?? v : v as number }))
      .filter(e => typeof e.score === 'number')
      .sort((a, b) => b.score - a.score);
    return { strengths: entries.slice(0, 3), focus: entries.slice(-3).reverse() };
  };
  const { strengths, focus } = getNutrientInsights();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await clearSession();
        nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Account', 'This permanently deletes all your data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteAccount(); } catch {}
        await clearSession();
        nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      }},
    ]);
  };

  const daysSinceLastScan = latestScan ? Math.floor((Date.now() - new Date(latestScan.createdAt).getTime()) / 86400000) : null;
  const lastScanText = daysSinceLastScan === 0 ? 'Today' : daysSinceLastScan === 1 ? 'Yesterday' : `${daysSinceLastScan}d ago`;

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.pageTitle}>Profile</Text>

        {/* ── Avatar + Name ── */}
        <View style={s.heroSection}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.heroName}>{profile?.name || 'User'}</Text>
          <Text style={s.heroPhone}>{profile?.phone || ''}</Text>
        </View>

        {/* ── Health Overview ── */}
        {latestScore !== null && (
          <View style={s.card}>
            <Text style={s.cardLabel}>HEALTH OVERVIEW</Text>
            <View style={s.healthRow}>
              <View style={s.scoreBlock}>
                <View style={[s.scoreRing, { borderColor: scoreColor(latestScore) }]}>
                  <Text style={[s.scoreValue, { color: scoreColor(latestScore) }]}>{latestScore}</Text>
                </View>
                <Text style={[s.statusText, { color: scoreColor(latestScore) }]}>{statusLabel(latestScore)}</Text>
              </View>
              <View style={s.healthStats}>
                <View style={s.healthStatRow}>
                  <Text style={s.healthStatNum}>{scans.length}</Text>
                  <Text style={s.healthStatLabel}>Total Scans</Text>
                </View>
                <View style={[s.healthStatRow, { marginTop: 14 }]}>
                  <Text style={s.healthStatNum}>{lastScanText}</Text>
                  <Text style={s.healthStatLabel}>Last Scan</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Nutrition Insights ── */}
        {strengths.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardLabel}>NUTRITION INSIGHTS</Text>
            <Text style={s.insightHeading}>Strengths</Text>
            {strengths.map(n => (
              <View key={n.key} style={s.nutrientRow}>
                <Text style={s.nutrientName}>{NUTRIENT_NAMES[n.key]}</Text>
                <View style={s.nutrientBarBg}>
                  <View style={[s.nutrientBarFill, { width: `${n.score}%`, backgroundColor: colors.brand }]} />
                </View>
                <Text style={[s.nutrientScore, { color: colors.brand }]}>{n.score}</Text>
              </View>
            ))}
            <Text style={[s.insightHeading, { marginTop: 20 }]}>Focus Areas</Text>
            {focus.map(n => {
              const col = n.score < 50 ? colors.error : colors.scoreLow;
              return (
                <View key={n.key} style={s.nutrientRow}>
                  <Text style={s.nutrientName}>{NUTRIENT_NAMES[n.key]}</Text>
                  <View style={s.nutrientBarBg}>
                    <View style={[s.nutrientBarFill, { width: `${n.score}%`, backgroundColor: col }]} />
                  </View>
                  <Text style={[s.nutrientScore, { color: col }]}>{n.score}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Appearance ── */}
        <View style={s.card}>
          <Text style={s.cardLabel}>APPEARANCE</Text>
          <View style={s.themeRow}>
            <View>
              <Text style={s.themeTitle}>Dark Mode</Text>
              <Text style={s.themeSub}>{isDark ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.hairline, true: colors.brand }}
              thumbColor={colors.bg}
              ios_backgroundColor={colors.hairline}
            />
          </View>
        </View>

        {/* ── Personal Info ── */}
        <View style={s.card}>
          <Text style={s.cardLabel}>PERSONAL INFORMATION</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Phone</Text>
            <Text style={s.infoValue}>{profile?.phone || '--'}</Text>
          </View>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Text style={s.infoLabel}>Date of Birth</Text>
            <Text style={s.infoValue}>{formatDob(profile?.dob || '')}</Text>
          </View>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Text style={s.infoLabel}>Sex</Text>
            <Text style={s.infoValue}>{profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '--'}</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={s.card}>
          <TouchableOpacity style={s.actionRow} onPress={handleLogout} activeOpacity={0.6}>
            <Text style={s.actionText}>Sign Out</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.actionRow} onPress={() => nav.navigate('PrivacyPolicy' as any)} activeOpacity={0.6}>
            <Text style={[s.actionText, { color: colors.textSecondary }]}>Privacy Policy</Text>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.actionRow} onPress={handleDelete} activeOpacity={0.6}>
            <Text style={[s.actionText, { color: colors.error }]}>Delete Account</Text>
            <Text style={[s.chevron, { color: colors.error }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Image source={require('../../assets/norla-full-logo.png')} style={s.footerLogo} resizeMode="contain" />
          <Text style={s.footerText}>Norla provides AI-generated predictions for{'\n'}wellness awareness only. Not a medical device.</Text>
          <Text style={s.version}>Version {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 40 },
  pageTitle: { fontSize: 32, fontWeight: '700', color: c.text, letterSpacing: -0.8, marginTop: 8, marginBottom: 28 },
  heroSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.brand, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  heroName: { fontSize: 22, fontWeight: '700', color: c.text, letterSpacing: -0.4 },
  heroPhone: { fontSize: 14, color: c.textTertiary, marginTop: 4 },
  card: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 20, marginBottom: 12 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: c.textQuaternary, letterSpacing: 1.2, marginBottom: 16 },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  scoreBlock: { alignItems: 'center', marginRight: 28 },
  scoreRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 6, textTransform: 'uppercase' as const },
  healthStats: { flex: 1 },
  healthStatRow: {},
  healthStatNum: { fontSize: 18, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  healthStatLabel: { fontSize: 12, color: c.textTertiary, marginTop: 1 },
  insightHeading: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 12 },
  nutrientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  nutrientName: { width: 90, fontSize: 13, fontWeight: '500', color: c.textSecondary },
  nutrientBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.hairline, marginHorizontal: 10 },
  nutrientBarFill: { height: 6, borderRadius: 3 },
  nutrientScore: { width: 28, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeTitle: { fontSize: 15, fontWeight: '600', color: c.text },
  themeSub: { fontSize: 12, color: c.textTertiary, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: c.hairline },
  infoLabel: { fontSize: 14, color: c.textTertiary },
  infoValue: { fontSize: 14, fontWeight: '600', color: c.text },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  actionText: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text },
  chevron: { fontSize: 20, color: c.textQuaternary, fontWeight: '300' },
  divider: { height: 1, backgroundColor: c.hairline },
  footer: { alignItems: 'center', marginTop: 32 },
  footerLogo: { width: 100, height: 28, marginBottom: 12, opacity: 0.4 },
  footerText: { fontSize: 11, color: c.textQuaternary, textAlign: 'center', lineHeight: 16 },
  version: { fontSize: 11, color: c.textQuaternary, marginTop: 6 },
});

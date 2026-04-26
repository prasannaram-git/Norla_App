import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { getProfile, clearSession, getScans, type UserProfile, type ScanCache } from '../lib/storage';
import { deleteAccount } from '../lib/api';
import { APP_VERSION } from '../lib/constants';

const { width: SW } = Dimensions.get('window');

function formatDob(dob: string): string {
  if (!dob) return '--';
  const d = new Date(dob);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} (${age} yrs)`;
}

function scoreColor(s: number) {
  if (s >= 75) return '#22C55E';
  if (s >= 50) return '#EAB308';
  if (s >= 30) return '#F97316';
  return '#EF4444';
}

function statusLabel(s: number) {
  if (s >= 75) return { text: 'Good', color: '#22C55E', bg: '#F0FDF4' };
  if (s >= 50) return { text: 'Fair', color: '#EAB308', bg: '#FEFCE8' };
  if (s >= 30) return { text: 'Low', color: '#F97316', bg: '#FFF7ED' };
  return { text: 'Critical', color: '#EF4444', bg: '#FEF2F2' };
}

const NUTRIENT_LABELS: Record<string, { name: string; emoji: string }> = {
  iron: { name: 'Iron', emoji: '🩸' },
  b12: { name: 'Vitamin B12', emoji: '🧬' },
  vitD: { name: 'Vitamin D', emoji: '☀️' },
  vitA: { name: 'Vitamin A', emoji: '👁️' },
  folate: { name: 'Folate', emoji: '🥬' },
  zinc: { name: 'Zinc', emoji: '⚡' },
  protein: { name: 'Protein', emoji: '💪' },
  hydration: { name: 'Hydration', emoji: '💧' },
  vitC: { name: 'Vitamin C', emoji: '🍊' },
  omega3: { name: 'Omega-3', emoji: '🐟' },
};

export function ProfileScreen() {
  const nav = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<ScanCache[]>([]);

  useFocusEffect(useCallback(() => {
    getProfile().then(setProfile);
    getScans().then(setScans);
  }, []));

  const latestScan = scans[0];
  const latestScore = latestScan?.overallBalanceScore ?? null;

  // Get top strengths and focus areas from latest scan
  const getNutrientInsights = () => {
    if (!latestScan?.nutrientScores) return { strengths: [], focus: [] };
    const entries = Object.entries(latestScan.nutrientScores)
      .filter(([k]) => NUTRIENT_LABELS[k])
      .map(([k, v]) => ({ key: k, score: typeof v === 'object' ? (v as any).score ?? v : v as number }))
      .filter(e => typeof e.score === 'number')
      .sort((a, b) => b.score - a.score);
    return {
      strengths: entries.slice(0, 3),
      focus: entries.slice(-3).reverse(),
    };
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
      { text: 'Delete Forever', style: 'destructive', onPress: async () => {
        try { await deleteAccount(); } catch {}
        await clearSession();
        nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      }},
    ]);
  };

  const daysSinceLastScan = latestScan
    ? Math.floor((Date.now() - new Date(latestScan.createdAt).getTime()) / 86400000)
    : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Section ── */}
        <View style={s.hero}>
          <View style={s.avatarRing}>
            <View style={s.avatar}>
              <Text style={s.avatarLetter}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          </View>
          <Text style={s.heroName}>{profile?.name || 'User'}</Text>
          <View style={s.verifiedRow}>
            <Text style={s.verifiedBadge}>✓ Verified</Text>
          </View>
        </View>

        {/* ── Health Overview Card ── */}
        {latestScore !== null && (
          <View style={s.healthCard}>
            <Text style={s.cardTitle}>Health Overview</Text>
            <View style={s.healthRow}>
              {/* Score Circle */}
              <View style={s.scoreSection}>
                <View style={[s.scoreRing, { borderColor: scoreColor(latestScore) }]}>
                  <Text style={[s.scoreNum, { color: scoreColor(latestScore) }]}>{latestScore}</Text>
                </View>
                <View style={[s.statusPill, { backgroundColor: statusLabel(latestScore).bg }]}>
                  <Text style={[s.statusText, { color: statusLabel(latestScore).color }]}>
                    {statusLabel(latestScore).text}
                  </Text>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={s.statsGrid}>
                <View style={s.statItem}>
                  <Text style={s.statNum}>{scans.length}</Text>
                  <Text style={s.statLabel}>Total Scans</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={s.statNum}>{daysSinceLastScan === 0 ? 'Today' : daysSinceLastScan === 1 ? '1d ago' : `${daysSinceLastScan}d ago`}</Text>
                  <Text style={s.statLabel}>Last Scan</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Nutrition Insights ── */}
        {strengths.length > 0 && (
          <View style={s.insightsCard}>
            <Text style={s.cardTitle}>Nutrition Insights</Text>

            <Text style={s.insightSectionTitle}>💪 Strengths</Text>
            <View style={s.badgeRow}>
              {strengths.map(n => (
                <View key={n.key} style={[s.badge, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={s.badgeEmoji}>{NUTRIENT_LABELS[n.key]?.emoji}</Text>
                  <Text style={[s.badgeName, { color: '#15803D' }]}>{NUTRIENT_LABELS[n.key]?.name}</Text>
                  <Text style={[s.badgeScore, { color: '#22C55E' }]}>{n.score}</Text>
                </View>
              ))}
            </View>

            <Text style={[s.insightSectionTitle, { marginTop: 16 }]}>🎯 Focus Areas</Text>
            <View style={s.badgeRow}>
              {focus.map(n => {
                const c = n.score < 50 ? { bg: '#FEF2F2', text: '#B91C1C', score: '#EF4444' } : { bg: '#FFF7ED', text: '#9A3412', score: '#F97316' };
                return (
                  <View key={n.key} style={[s.badge, { backgroundColor: c.bg }]}>
                    <Text style={s.badgeEmoji}>{NUTRIENT_LABELS[n.key]?.emoji}</Text>
                    <Text style={[s.badgeName, { color: c.text }]}>{NUTRIENT_LABELS[n.key]?.name}</Text>
                    <Text style={[s.badgeScore, { color: c.score }]}>{n.score}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Personal Info ── */}
        <View style={s.infoCard}>
          <Text style={s.cardTitle}>Personal Information</Text>
          <InfoRow icon="📱" label="Phone" value={profile?.phone || '--'} />
          <InfoRow icon="🎂" label="Date of Birth" value={formatDob(profile?.dob || '')} showBorder />
          <InfoRow icon={profile?.sex?.toLowerCase() === 'female' ? '♀️' : '♂️'} label="Sex" value={profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '--'} showBorder />
        </View>

        {/* ── Actions ── */}
        <View style={s.actionsCard}>
          <TouchableOpacity style={s.actionRow} onPress={handleLogout} activeOpacity={0.6}>
            <Text style={s.actionIcon}>🚪</Text>
            <Text style={s.actionText}>Sign Out</Text>
            <Text style={s.actionChevron}>›</Text>
          </TouchableOpacity>
          <View style={s.actionDivider} />
          <TouchableOpacity style={s.actionRow} onPress={() => nav.navigate('PrivacyPolicy' as any)} activeOpacity={0.6}>
            <Text style={s.actionIcon}>🔒</Text>
            <Text style={[s.actionText, { color: COLORS.textSecondary }]}>Privacy Policy</Text>
            <Text style={s.actionChevron}>›</Text>
          </TouchableOpacity>
          <View style={s.actionDivider} />
          <TouchableOpacity style={s.actionRow} onPress={handleDelete} activeOpacity={0.6}>
            <Text style={s.actionIcon}>⚠️</Text>
            <Text style={[s.actionText, { color: '#EF4444' }]}>Delete Account</Text>
            <Text style={[s.actionChevron, { color: '#EF4444' }]}>›</Text>
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

function InfoRow({ icon, label, value, showBorder }: { icon: string; label: string; value: string; showBorder?: boolean }) {
  return (
    <View style={[s.infoRow, showBorder && s.infoRowBorder]}>
      <Text style={s.infoIcon}>{icon}</Text>
      <View style={s.infoContent}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { paddingBottom: 40 },

  // ── Hero ──
  hero: { alignItems: 'center', paddingTop: 20, paddingBottom: 28, backgroundColor: '#FFFFFF' },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: '#10B981',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatar: {
    width: 78, height: 78, borderRadius: 39,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  heroName: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.5 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  verifiedBadge: {
    fontSize: 12, fontWeight: '600', color: '#10B981',
    backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 12, overflow: 'hidden',
  },

  // ── Cards shared ──
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#999', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16 },

  // ── Health Overview ──
  healthCard: {
    marginHorizontal: 20, marginTop: 20, padding: 20,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  healthRow: { flexDirection: 'row', alignItems: 'center' },
  scoreSection: { alignItems: 'center', marginRight: 24 },
  scoreRing: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  scoreNum: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statusPill: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  statsGrid: { flex: 1 },
  statItem: { marginBottom: 12 },
  statNum: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },

  // ── Insights ──
  insightsCard: {
    marginHorizontal: 20, marginTop: 12, padding: 20,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  insightSectionTitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 10 },
  badgeRow: { gap: 8 },
  badge: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 6,
  },
  badgeEmoji: { fontSize: 16, marginRight: 10 },
  badgeName: { flex: 1, fontSize: 14, fontWeight: '600' },
  badgeScore: { fontSize: 16, fontWeight: '800' },

  // ── Personal Info ──
  infoCard: {
    marginHorizontal: 20, marginTop: 12, padding: 20,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  infoIcon: { fontSize: 20, marginRight: 14, width: 28, textAlign: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

  // ── Actions ──
  actionsCard: {
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  actionIcon: { fontSize: 18, marginRight: 14, width: 28, textAlign: 'center' },
  actionText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  actionChevron: { fontSize: 20, color: '#CCC', fontWeight: '300' },
  actionDivider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 62 },

  // ── Footer ──
  footer: { alignItems: 'center', marginTop: 36, paddingHorizontal: 20 },
  footerLogo: { width: 100, height: 28, marginBottom: 12, opacity: 0.4 },
  footerText: { fontSize: 11, color: '#BBB', textAlign: 'center', lineHeight: 16 },
  version: { fontSize: 11, color: '#CCC', marginTop: 6 },
});

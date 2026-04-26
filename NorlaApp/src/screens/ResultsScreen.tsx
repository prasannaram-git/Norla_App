import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../lib/theme';
import { NUTRIENT_CONFIG } from '../lib/constants';
import { useNavigation, CommonActions } from '@react-navigation/native';

function ScoreRing({ score, size = 120, colors }: { score: number; size?: number; colors: ColorPalette }) {
  const strokeW = 6;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const scoreColor = (s: number) => s >= 75 ? colors.scoreHigh : s >= 50 ? colors.scoreMedium : s >= 30 ? colors.scoreLow : colors.scoreCritical;
  const color = scoreColor(score);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.hairline} strokeWidth={strokeW} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeW} fill="none"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference / 4} strokeLinecap="round" />
      </Svg>
      <Text style={{ fontSize: 36, fontWeight: '700', color, letterSpacing: -1 }}>{score}</Text>
    </View>
  );
}

export function ResultsScreen({ route }: any) {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const { scanData } = route.params;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const scoreColor = (s: number) => s >= 75 ? colors.scoreHigh : s >= 50 ? colors.scoreMedium : s >= 30 ? colors.scoreLow : colors.scoreCritical;
  const statusText = (s: number) => s >= 75 ? 'Good' : s >= 50 ? 'Fair' : s >= 30 ? 'Low' : 'Critical';

  const resetNav = (tabIndex: number) => nav.dispatch(CommonActions.reset({
    index: 0,
    routes: [{
      name: 'Main',
      state: {
        routes: [{ name: 'Dashboard' }, { name: 'Scan', state: { routes: [{ name: 'GuidedCamera' }], index: 0 } }, { name: 'Stats' }, { name: 'Profile' }],
        index: tabIndex,
      },
    }],
  }));

  const done = () => resetNav(0);
  const newScan = () => resetNav(1);

  const nutrients = scanData.nutrientScores
    ? Object.entries(scanData.nutrientScores)
        .map(([key, val]: [string, any]) => ({
          key,
          label: NUTRIENT_CONFIG[key]?.label || key.replace('Support', '').replace(/([A-Z])/g, ' $1').trim(),
          score: typeof val === 'object' ? val.score : val,
          explanation: typeof val === 'object' ? val.explanation : '',
        }))
    : [];

  const sortedNutrients = [...nutrients].sort((a, b) => a.score - b.score);
  const focusAreas = scanData.focusAreas || [];
  const recommendations = scanData.recommendations || [];
  const aiUsed = scanData.aiUsed ?? false;

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <View>
            <Text style={s.heading}>Your Results</Text>
            <Text style={s.date}>{new Date(scanData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={s.methodBadge}>
            <Text style={s.methodText}>{aiUsed ? 'AI Analysis' : 'Questionnaire'}</Text>
          </View>
        </View>

        <View style={s.scoreSection}>
          <ScoreRing score={scanData.overallBalanceScore} colors={colors} />
          <Text style={s.scoreLabel}>Overall Balance</Text>
          <Text style={[s.scoreStatus, { color: scoreColor(scanData.overallBalanceScore) }]}>{statusText(scanData.overallBalanceScore)}</Text>
        </View>

        {sortedNutrients.length > 0 && (
          <>
            <View style={s.separator} />
            <Text style={s.sectionTitle}>Nutrient Analysis</Text>
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 1 }]}>Nutrient</Text>
              <Text style={[s.th, s.thCenter, { width: 56 }]}>Score</Text>
              <Text style={[s.th, s.thRight, { width: 56 }]}>Status</Text>
            </View>
            <View style={s.tableDivider} />
            {sortedNutrients.map((n, i) => (
              <TouchableOpacity key={n.key} activeOpacity={0.7} onPress={() => setExpandedKey(expandedKey === n.key ? null : n.key)}>
                <View style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                  <View style={{ flex: 1 }}><Text style={s.tdName}>{n.label}</Text></View>
                  <View style={{ width: 56, alignItems: 'center' }}>
                    <Text style={[s.tdScore, { color: scoreColor(n.score) }]}>{n.score}</Text>
                    <View style={s.miniBar}><View style={[s.miniBarFill, { width: `${n.score}%`, backgroundColor: scoreColor(n.score) }]} /></View>
                  </View>
                  <View style={{ width: 56, alignItems: 'flex-end' }}>
                    <Text style={[s.tdStatus, { color: scoreColor(n.score) }]}>{statusText(n.score)}</Text>
                  </View>
                </View>
                {expandedKey === n.key && n.explanation ? (
                  <View style={s.expandedRow}><Text style={s.expandedText}>{n.explanation}</Text></View>
                ) : null}
              </TouchableOpacity>
            ))}
          </>
        )}

        {scanData.confidenceNote && <Text style={s.confidence}>{scanData.confidenceNote}</Text>}

        {focusAreas.length > 0 && (
          <>
            <View style={s.separator} />
            <Text style={s.sectionTitle}>Priority Areas</Text>
            {focusAreas.map((area: any, i: number) => (
              <View key={i} style={s.focusRow}>
                <View style={[s.focusDot, { backgroundColor: area.priority === 'high' ? colors.error : area.priority === 'medium' ? colors.warning : colors.brand }]} />
                <View style={s.focusContent}>
                  <Text style={s.focusTitle}>{area.title || area.nutrient}</Text>
                  <Text style={s.focusText}>{area.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {recommendations.length > 0 && (
          <>
            <View style={s.separator} />
            <Text style={s.sectionTitle}>Recommendations</Text>
            {recommendations.map((rec: any, i: number) => (
              <View key={i} style={[s.recRow, i < recommendations.length - 1 && s.recBorder]}>
                <Text style={s.recNum}>{i + 1}.</Text>
                <View style={s.recContent}>
                  <Text style={s.recTitle}>{rec.title || `Recommendation ${i + 1}`}</Text>
                  <Text style={s.recText}>{rec.description || rec.text || rec.recommendation || (typeof rec === 'string' ? rec : '')}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={s.disclaimer}>AI-generated predictions for wellness awareness only. Not a medical device. Consult a healthcare professional for diagnosis.</Text>
      </ScrollView>

      <View style={s.bottomBar}>
        <TouchableOpacity style={s.outlineBtn} onPress={newScan} activeOpacity={0.7}>
          <Text style={s.outlineBtnText}>New Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.primaryBtn} onPress={done} activeOpacity={0.8}>
          <Text style={s.primaryBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, marginBottom: 8 },
  heading: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.6 },
  date: { fontSize: 13, color: c.textTertiary, marginTop: 4 },
  methodBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: c.border, marginTop: 4 },
  methodText: { fontSize: 11, fontWeight: '600', color: c.textSecondary },
  scoreSection: { alignItems: 'center', paddingVertical: 24 },
  scoreLabel: { fontSize: 14, fontWeight: '600', color: c.textSecondary, marginTop: 14 },
  scoreStatus: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  separator: { height: 1, backgroundColor: c.hairline, marginVertical: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 14 },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  th: { fontSize: 11, fontWeight: '700', color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  thCenter: { textAlign: 'center' },
  thRight: { textAlign: 'right' },
  tableDivider: { height: 2, backgroundColor: c.text, marginBottom: 2 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: c.bgSecondary },
  tdName: { fontSize: 14, fontWeight: '500', color: c.text },
  tdScore: { fontSize: 16, fontWeight: '700' },
  miniBar: { width: 40, height: 2, backgroundColor: c.hairline, borderRadius: 1, marginTop: 4, overflow: 'hidden' },
  miniBarFill: { height: 2, borderRadius: 1 },
  tdStatus: { fontSize: 11, fontWeight: '600' },
  expandedRow: { paddingHorizontal: 4, paddingBottom: 12, paddingTop: 4 },
  expandedText: { fontSize: 12, color: c.textTertiary, lineHeight: 17 },
  confidence: { fontSize: 12, color: c.textTertiary, fontStyle: 'italic', lineHeight: 18, marginTop: 16 },
  focusRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.hairline },
  focusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 12 },
  focusContent: { flex: 1 },
  focusTitle: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 4 },
  focusText: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
  recRow: { flexDirection: 'row', paddingVertical: 12, gap: 8 },
  recBorder: { borderBottomWidth: 1, borderBottomColor: c.hairline },
  recNum: { fontSize: 14, fontWeight: '700', color: c.textTertiary, width: 20, paddingTop: 1 },
  recContent: { flex: 1 },
  recTitle: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 3 },
  recText: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },
  disclaimer: { fontSize: 11, color: c.textQuaternary, textAlign: 'center', lineHeight: 16, marginTop: 28, paddingHorizontal: 16 },
  bottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: SPACING.xxl, paddingTop: 12, paddingBottom: 8, borderTopWidth: 1, borderTopColor: c.hairline, backgroundColor: c.bg },
  outlineBtn: { flex: 1, height: 50, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: c.text, justifyContent: 'center', alignItems: 'center' },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: c.text },
  primaryBtn: { flex: 1, height: 50, borderRadius: RADIUS.md, backgroundColor: c.invertedBg, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: c.invertedText },
});

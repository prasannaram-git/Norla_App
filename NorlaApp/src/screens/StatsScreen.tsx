import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../lib/theme';
import { getScans, type ScanCache } from '../lib/storage';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - 48;
const CHART_H = 160;
const PAD = { top: 20, right: 16, bottom: 28, left: 36 };
const PLOT_W = CHART_W - PAD.left - PAD.right;
const PLOT_H = CHART_H - PAD.top - PAD.bottom;

function ScoreTrendChart({ scans, colors }: { scans: ScanCache[]; colors: ColorPalette }) {
  const scoreColor = (s: number) => s >= 75 ? colors.scoreHigh : s >= 50 ? colors.scoreMedium : s >= 30 ? colors.scoreLow : colors.scoreCritical;

  if (scans.length === 0) {
    return (
      <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: colors.textTertiary }}>Complete your first scan to see trends</Text>
      </View>
    );
  }

  const data = [...scans].reverse().slice(-14);
  const minScore = Math.max(0, Math.min(...data.map(d => d.overallBalanceScore)) - 10);
  const maxScore = Math.min(100, Math.max(...data.map(d => d.overallBalanceScore)) + 10);
  const range = maxScore - minScore || 1;

  const getX = (i: number) => PAD.left + (data.length === 1 ? PLOT_W / 2 : (i / (data.length - 1)) * PLOT_W);
  const getY = (score: number) => PAD.top + PLOT_H - ((score - minScore) / range) * PLOT_H;

  const points = data.map((d, i) => ({ x: getX(i), y: getY(d.overallBalanceScore) }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const yTicks = [minScore, Math.round((minScore + maxScore) / 2), maxScore];

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {yTicks.map((tick, i) => (
        <React.Fragment key={i}>
          <Line x1={PAD.left} y1={getY(tick)} x2={CHART_W - PAD.right} y2={getY(tick)} stroke={colors.hairline} strokeWidth={1} />
          <SvgText x={PAD.left - 6} y={getY(tick) + 4} textAnchor="end" fontSize={10} fontWeight="500" fill={colors.textQuaternary}>{tick}</SvgText>
        </React.Fragment>
      ))}
      <Path d={pathD} fill="none" stroke={colors.brand} strokeWidth={2} strokeLinecap="round" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={scoreColor(data[i].overallBalanceScore)} stroke={colors.bg} strokeWidth={1.5} />
      ))}
      {data.length > 1 && [...new Set([0, Math.floor(data.length / 2), data.length - 1])].map(idx => {
        const d = new Date(data[idx].createdAt);
        return (
          <SvgText key={`xlabel-${idx}`} x={getX(idx)} y={CHART_H - 4} textAnchor="middle" fontSize={10} fontWeight="500" fill={colors.textQuaternary}>
            {`${d.getDate()}/${d.getMonth() + 1}`}
          </SvgText>
        );
      })}
      {data.length === 1 && (
        <SvgText x={getX(0)} y={CHART_H - 4} textAnchor="middle" fontSize={10} fontWeight="500" fill={colors.textQuaternary}>
          {new Date(data[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </SvgText>
      )}
    </Svg>
  );
}

export function StatsScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const [scans, setScans] = useState<ScanCache[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { setScans(await getScans()); };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const scoreColor = (s: number) => s >= 75 ? colors.scoreHigh : s >= 50 ? colors.scoreMedium : s >= 30 ? colors.scoreLow : colors.scoreCritical;
  const statusText = (s: number) => s >= 75 ? 'Good' : s >= 50 ? 'Fair' : s >= 30 ? 'Low' : 'Critical';

  const latestScore = scans[0]?.overallBalanceScore;
  const prevScore = scans[1]?.overallBalanceScore;
  const scoreDiff = latestScore != null && prevScore != null ? latestScore - prevScore : null;

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.fixedTop}>
        <View style={s.header}>
          <View>
            <Text style={s.heading}>Stats</Text>
            <Text style={s.count}>{scans.length} scan{scans.length !== 1 ? 's' : ''}</Text>
          </View>
          {latestScore != null && (
            <View style={s.latestWrap}>
              <Text style={[s.latestScore, { color: scoreColor(latestScore) }]}>{latestScore}</Text>
              {scoreDiff !== null && (
                <Text style={[s.scoreDiff, { color: scoreDiff >= 0 ? colors.scoreHigh : colors.scoreLow }]}>
                  {scoreDiff >= 0 ? '+' : ''}{scoreDiff}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={s.chartWrap}>
          <Text style={s.chartTitle}>Score Trend</Text>
          <ScoreTrendChart scans={scans} colors={colors} />
        </View>
        <View style={s.divider} />
      </View>

      <FlatList
        data={scans}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textQuaternary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>No scans yet</Text>
            <Text style={s.emptyText}>Results will appear here after your first scan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.row} activeOpacity={0.6} onPress={() => nav.navigate('Results', { scanData: item })}>
            <View style={[s.scoreCircle, { borderColor: scoreColor(item.overallBalanceScore) }]}>
              <Text style={[s.scoreNum, { color: scoreColor(item.overallBalanceScore) }]}>{item.overallBalanceScore}</Text>
            </View>
            <View style={s.rowCenter}>
              <Text style={s.rowTitle}>Nutrition Scan</Text>
              <Text style={s.rowDate}>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
            <Text style={[s.statusLabel, { color: scoreColor(item.overallBalanceScore) }]}>{statusText(item.overallBalanceScore)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  fixedTop: { backgroundColor: c.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SPACING.xxl, paddingTop: 8 },
  heading: { fontSize: 32, fontWeight: '700', color: c.text, letterSpacing: -0.8 },
  count: { fontSize: 13, color: c.textTertiary, marginTop: 4 },
  latestWrap: { alignItems: 'flex-end', paddingTop: 4 },
  latestScore: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  scoreDiff: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  chartWrap: { paddingHorizontal: SPACING.xxl, paddingTop: 16, paddingBottom: 8 },
  chartTitle: { fontSize: 12, fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 },
  divider: { height: 1, backgroundColor: c.hairline },
  list: { paddingHorizontal: SPACING.xxl, paddingBottom: 32 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: c.hairline },
  scoreCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 18, fontWeight: '700' },
  rowCenter: { flex: 1, marginLeft: 14 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: c.text },
  rowDate: { fontSize: 13, color: c.textTertiary, marginTop: 2 },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
  emptyText: { fontSize: 14, color: c.textTertiary, marginTop: 4 },
});

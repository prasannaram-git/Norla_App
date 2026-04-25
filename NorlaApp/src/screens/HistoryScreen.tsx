import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { getScans, type ScanCache } from '../lib/storage';

const scoreColor = (s: number) => s >= 75 ? COLORS.scoreHigh : s >= 50 ? COLORS.scoreMedium : s >= 30 ? COLORS.scoreLow : COLORS.scoreCritical;
const statusText = (s: number) => s >= 75 ? 'Good' : s >= 50 ? 'Fair' : s >= 30 ? 'Low' : 'Critical';

export function HistoryScreen() {
  const nav = useNavigation<any>();
  const [scans, setScans] = useState<ScanCache[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { setScans(await getScans()); };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.heading}>History</Text>
        <Text style={s.count}>{scans.length} scan{scans.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={scans}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.textQuaternary} />}
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: SPACING.xxl, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  heading: { fontSize: 32, fontWeight: '700', color: COLORS.text, letterSpacing: -0.8 },
  count: { fontSize: 13, color: COLORS.textTertiary, marginTop: 4 },
  list: { paddingHorizontal: SPACING.xxl, paddingBottom: 32 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  scoreCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 18, fontWeight: '700' },
  rowCenter: { flex: 1, marginLeft: 14 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  rowDate: { fontSize: 13, color: COLORS.textTertiary, marginTop: 2 },
  statusLabel: { fontSize: 12, fontWeight: '600' },

  empty: { paddingTop: 80, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  emptyText: { fontSize: 14, color: COLORS.textTertiary, marginTop: 4 },
});

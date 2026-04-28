import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';
import { RADIUS, type ColorPalette } from '../lib/theme';
import { generateNutritionPlan } from '../lib/api';
import { getProfile, getScans } from '../lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_CACHE_KEY = 'norla_nutrition_plan';
const CHECK_CACHE_KEY = 'norla_nutrition_checks';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  midMorning: 'Mid-Morning',
  lunch: 'Lunch',
  evening: 'Evening Snack',
  dinner: 'Dinner',
};
const MEAL_ORDER = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

interface FoodItem { food: string; kcal: number; price: number; }
interface MealData { time: string; items: FoodItem[]; }
interface PlanData {
  planDate: string;
  currency: string;
  meals: Record<string, MealData>;
}

export function NutritionPlanScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasScans, setHasScans] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const spinAnim = useState(() => new Animated.Value(0))[0];

  useFocusEffect(useCallback(() => {
    (async () => {
      const [cachedPlan, cachedChecks] = await Promise.all([
        AsyncStorage.getItem(PLAN_CACHE_KEY),
        AsyncStorage.getItem(CHECK_CACHE_KEY),
      ]);
      if (cachedChecks) { try { setChecked(JSON.parse(cachedChecks)); } catch {} }
      if (cachedPlan) { try { setPlan(JSON.parse(cachedPlan)); return; } catch {} }
      const scans = await getScans();
      if (scans.length === 0) { setHasScans(false); return; }
      setHasScans(true);
      generatePlan();
    })();
  }, []));

  useEffect(() => {
    if (loading) {
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start();
    } else { spinAnim.setValue(0); }
  }, [loading]);

  async function generatePlan() {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const scans = await getScans();
      if (scans.length === 0) { setError('Complete a scan first.'); setLoading(false); return; }
      const latest = scans[0];
      const profile = await getProfile();
      let userAge: number | undefined, userSex: string | undefined, userPhone: string | undefined;
      if (profile) {
        userSex = profile.sex;
        userPhone = profile.phone;
        if (profile.dob) {
          const bd = new Date(profile.dob), now = new Date();
          userAge = now.getFullYear() - bd.getFullYear();
          if (now.getMonth() - bd.getMonth() < 0 || (now.getMonth() === bd.getMonth() && now.getDate() < bd.getDate())) userAge--;
        }
      }
      const scores: Record<string, number> = {};
      if (latest.nutrientScores) {
        for (const [k, v] of Object.entries(latest.nutrientScores)) {
          scores[k] = typeof v === 'object' ? ((v as any).score ?? v) : v as number;
        }
      }
      const result = await generateNutritionPlan({ nutrientScores: scores, userAge, userSex, userPhone });
      if (result.plan) {
        setPlan(result.plan);
        setChecked({});
        await AsyncStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(result.plan));
        await AsyncStorage.setItem(CHECK_CACHE_KEY, '{}');
        setRetryCount(0);
      }
    } catch (e: any) {
      if (retryCount === 0) { setRetryCount(1); setLoading(false); setTimeout(() => generatePlan(), 2000); return; }
      setError(e.message || 'Failed to generate plan.');
    }
    setLoading(false);
  }

  function toggleCheck(key: string) {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(CHECK_CACHE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const s = makeStyles(colors);
  const cur = plan?.currency || '₹';

  // Compute totals
  let totalKcal = 0, totalPrice = 0, checkedKcal = 0, checkedPrice = 0;
  if (plan) {
    MEAL_ORDER.forEach(mealKey => {
      const meal = plan.meals?.[mealKey];
      meal?.items?.forEach((item, idx) => {
        const k = `${mealKey}-${idx}`;
        totalKcal += item.kcal || 0;
        totalPrice += item.price || 0;
        if (checked[k]) {
          checkedKcal += item.kcal || 0;
          checkedPrice += item.price || 0;
        }
      });
    });
  }

  // ── No Scans ──
  if (!hasScans && !plan && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}><TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.back}>‹ Back</Text></TouchableOpacity></View>
        <View style={s.center}>
          <Text style={s.centerTitle}>Nutrition Plan</Text>
          <Text style={s.centerSub}>Complete your first scan to get a personalized meal plan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (loading && !plan) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}><TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.back}>‹ Back</Text></TouchableOpacity></View>
        <View style={s.center}>
          <Animated.View style={[s.spinner, { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
          <Text style={s.centerTitle}>Preparing Your Plan</Text>
          <Text style={s.centerSub}>Analyzing nutrients & building meals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error && !plan) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}><TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.back}>‹ Back</Text></TouchableOpacity></View>
        <View style={s.center}>
          <Text style={s.centerTitle}>Something Went Wrong</Text>
          <Text style={s.centerSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setRetryCount(0); generatePlan(); }} activeOpacity={0.8}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) return null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Daily Plan</Text>
        <TouchableOpacity onPress={() => { setRetryCount(0); generatePlan(); }} activeOpacity={0.6} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.refresh}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.date}>{plan.planDate}</Text>

        {/* 5 Meal Tables */}
        {MEAL_ORDER.map(mealKey => {
          const meal = plan.meals?.[mealKey];
          if (!meal?.items?.length) return null;
          const mealKcal = meal.items.reduce((sum, i) => sum + (i.kcal || 0), 0);
          const mealPrice = meal.items.reduce((sum, i) => sum + (i.price || 0), 0);

          return (
            <View key={mealKey} style={s.table}>
              {/* Brand accent strip */}
              <View style={s.accentStrip} />

              {/* Meal header */}
              <View style={s.tableHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.tableName}>{MEAL_LABELS[mealKey]}</Text>
                  <Text style={s.tableTime}>{meal.time}</Text>
                </View>
                <View style={s.mealTotals}>
                  <Text style={s.mealTotalKcal}>{mealKcal} kcal</Text>
                  <Text style={s.mealTotalPrice}>{cur}{mealPrice}</Text>
                </View>
              </View>

              {/* Column header */}
              <View style={s.colHead}>
                <Text style={[s.colLabel, { flex: 1 }]}>FOOD</Text>
                <Text style={[s.colLabel, { width: 50, textAlign: 'right' }]}>KCAL</Text>
                <Text style={[s.colLabel, { width: 54, textAlign: 'right' }]}>PRICE</Text>
                <View style={{ width: 36 }} />
              </View>

              {/* Food rows */}
              {meal.items.map((item, idx) => {
                const key = `${mealKey}-${idx}`;
                const isChecked = !!checked[key];
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[s.foodRow, idx > 0 && s.foodBorder]}
                    onPress={() => toggleCheck(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.foodName, isChecked && s.checkedText]} numberOfLines={2}>{item.food}</Text>
                    <Text style={[s.foodKcal, isChecked && s.checkedText]}>{item.kcal || '-'}</Text>
                    <Text style={[s.foodPrice, isChecked && s.checkedText]}>{cur}{item.price || 0}</Text>
                    <View style={[s.checkbox, isChecked && s.checkboxOn]}>
                      {isChecked && <Text style={s.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Totals */}
        <View style={s.totalsCard}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Calories</Text>
            <View style={s.totalRight}>
              {checkedKcal > 0 && <Text style={s.totalDone}>{checkedKcal} / </Text>}
              <Text style={s.totalValue}>{totalKcal} kcal</Text>
            </View>
          </View>
          <View style={s.totalDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Estimated Cost</Text>
            <View style={s.totalRight}>
              {checkedPrice > 0 && <Text style={s.totalDone}>{cur}{checkedPrice} / </Text>}
              <Text style={s.totalValue}>{cur}{totalPrice}</Text>
            </View>
          </View>
        </View>

        <Text style={s.disclaimer}>AI-generated plan · Prices are estimated · Not medical advice</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 60 },
  topBar: { paddingHorizontal: 20, paddingVertical: 12 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.hairline },
  headerTitle: { fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  back: { fontSize: 16, fontWeight: '500', color: c.textTertiary },
  refresh: { fontSize: 13, fontWeight: '600', color: c.brand },
  date: { fontSize: 12, color: c.textQuaternary, marginTop: 16, marginBottom: 16, letterSpacing: 0.3 },

  // Table
  table: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, marginBottom: 14, overflow: 'hidden', position: 'relative' as const },
  accentStrip: { position: 'absolute' as const, left: 0, top: 0, bottom: 0, width: 3, backgroundColor: c.brand, borderTopLeftRadius: RADIUS.md, borderBottomLeftRadius: RADIUS.md },

  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingLeft: 20, paddingTop: 16, paddingBottom: 12 },
  tableName: { fontSize: 16, fontWeight: '700', color: c.text, letterSpacing: -0.2 },
  tableTime: { fontSize: 11, color: c.textQuaternary, marginTop: 2 },
  mealTotals: { alignItems: 'flex-end' },
  mealTotalKcal: { fontSize: 14, fontWeight: '700', color: c.text },
  mealTotalPrice: { fontSize: 12, color: c.brand, fontWeight: '600', marginTop: 1 },

  // Column headers
  colHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.hairline, borderBottomWidth: 1, borderBottomColor: c.hairline },
  colLabel: { fontSize: 10, fontWeight: '700', color: c.textQuaternary, letterSpacing: 0.8 },

  // Food rows
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13 },
  foodBorder: { borderTopWidth: 1, borderTopColor: c.hairline },
  foodName: { flex: 1, fontSize: 14, fontWeight: '500', color: c.text, paddingRight: 8 },
  foodKcal: { width: 50, fontSize: 13, fontWeight: '600', color: c.textSecondary, textAlign: 'right' },
  foodPrice: { width: 54, fontSize: 13, fontWeight: '600', color: c.brand, textAlign: 'right' },
  checkedText: { opacity: 0.3, textDecorationLine: 'line-through' as const },

  // Checkbox
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: c.border, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  checkboxOn: { backgroundColor: c.brand, borderColor: c.brand },
  checkmark: { fontSize: 12, fontWeight: '800', color: '#fff', marginTop: -1 },

  // Totals
  totalsCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: c.brand + '25' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRight: { flexDirection: 'row', alignItems: 'baseline' },
  totalLabel: { fontSize: 13, fontWeight: '600', color: c.textTertiary },
  totalValue: { fontSize: 16, fontWeight: '700', color: c.text },
  totalDone: { fontSize: 13, fontWeight: '600', color: c.brand },
  totalDivider: { height: 1, backgroundColor: c.hairline, marginVertical: 12 },

  // Disclaimer
  disclaimer: { fontSize: 11, color: c.textQuaternary, textAlign: 'center', marginTop: 12, marginBottom: 20 },

  // Center states
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  centerTitle: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 8 },
  centerSub: { fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 21 },
  spinner: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: c.hairline, borderTopColor: c.brand, marginBottom: 24 },
  retryBtn: { marginTop: 20, backgroundColor: c.brand, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 36 },
  retryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

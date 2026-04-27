import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../lib/theme';
import { generateNutritionPlan } from '../lib/api';
import { getProfile, getScans } from '../lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_CACHE_KEY = 'norla_nutrition_plan';

const MEAL_ACCENTS: Record<string, string> = {
  breakfast: '#10B981',
  midMorning: '#8B5CF6',
  lunch: '#3B82F6',
  evening: '#F59E0B',
  dinner: '#EF4444',
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  midMorning: 'Mid-Morning Snack',
  lunch: 'Lunch',
  evening: 'Evening Snack',
  dinner: 'Dinner',
};
const MEAL_ORDER = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

interface Deficiency { nutrient: string; score: number; priority: string; action: string; }
interface FoodItem { food: string; quantity: string; nutrient: string; benefit: string; }
interface MealData { time: string; calories?: number; protein?: number; carbs?: number; fat?: number; items: FoodItem[]; }
interface PlanData {
  planDate: string;
  summary: string;
  dailyCalories?: number;
  targetNutrients: string[];
  deficiencies?: Deficiency[];
  meals: Record<string, MealData>;
  hydration: string;
  tips: string[];
}

export function NutritionPlanScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasScans, setHasScans] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const spinAnim = useState(() => new Animated.Value(0))[0];

  // Auto-generate on mount
  useFocusEffect(useCallback(() => {
    (async () => {
      const cached = await AsyncStorage.getItem(PLAN_CACHE_KEY);
      if (cached) {
        try { setPlan(JSON.parse(cached)); return; } catch {}
      }
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
      let userAge: number | undefined, userSex: string | undefined;
      if (profile) {
        userSex = profile.sex;
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
      const result = await generateNutritionPlan({ nutrientScores: scores, userAge, userSex });
      if (result.plan) {
        setPlan(result.plan);
        await AsyncStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(result.plan));
        setRetryCount(0);
      }
    } catch (e: any) {
      const msg = e.message || 'Failed to generate plan.';
      if (retryCount === 0) {
        setRetryCount(1);
        setLoading(false);
        setTimeout(() => generatePlan(), 2000);
        return;
      }
      setError(msg);
    }
    setLoading(false);
  }

  const s = makeStyles(colors);

  // ── No Scans ──
  if (!hasScans && !plan && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.backText}>‹ Back</Text></TouchableOpacity>
        </View>
        <View style={s.centerMsg}>
          <Text style={s.centerTitle}>Nutrition Plan</Text>
          <Text style={s.centerDesc}>Complete your first scan to get a personalized clinical nutrition plan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (loading && !plan) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.backText}>‹ Back</Text></TouchableOpacity>
        </View>
        <View style={s.centerMsg}>
          <Animated.View style={[s.spinner, { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
          <Text style={s.centerTitle}>Preparing Your Plan</Text>
          <Text style={s.centerDesc}>Our AI nutritionist is analyzing your scan results and designing a personalized meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error (no cached plan) ──
  if (error && !plan) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.backText}>‹ Back</Text></TouchableOpacity>
        </View>
        <View style={s.centerMsg}>
          <Text style={s.centerTitle}>Could Not Generate Plan</Text>
          <Text style={s.centerDesc}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setRetryCount(0); generatePlan(); }} activeOpacity={0.8}>
            <Text style={s.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) return null;

  // ── Premium Plan View ──
  const totalCal = plan.dailyCalories || MEAL_ORDER.reduce((sum, k) => sum + (plan.meals?.[k]?.calories || 0), 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.backText}>‹ Back</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => { setRetryCount(0); generatePlan(); }} activeOpacity={0.6}>
            <Text style={s.refreshText}>{loading ? 'Generating...' : 'Refresh Plan'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.pageTitle}>Your Nutrition Plan</Text>
        <View style={s.badgeRow}>
          <View style={s.badge}><Text style={s.badgeText}>AI Nutritionist</Text></View>
          <Text style={s.dateText}>{plan.planDate}</Text>
        </View>

        {/* Summary Card */}
        <View style={s.summaryCard}>
          <Text style={s.summaryText}>{plan.summary}</Text>
          {totalCal > 0 && (
            <View style={s.calRow}>
              <Text style={s.calValue}>{totalCal}</Text>
              <Text style={s.calLabel}>kcal / day</Text>
            </View>
          )}
        </View>

        {/* Target Nutrients */}
        {plan.targetNutrients?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>FOCUS NUTRIENTS</Text>
            <View style={s.pillRow}>
              {plan.targetNutrients.map((n, i) => (
                <View key={i} style={s.pill}><Text style={s.pillText}>{n}</Text></View>
              ))}
            </View>
          </View>
        )}

        {/* Deficiency Table */}
        {plan.deficiencies && plan.deficiencies.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>DEFICIENCY ANALYSIS</Text>
            <View style={s.table}>
              <View style={s.tableHeaderRow}>
                <Text style={[s.th, { flex: 1 }]}>Nutrient</Text>
                <Text style={[s.th, { width: 50, textAlign: 'center' }]}>Score</Text>
                <Text style={[s.th, { width: 60, textAlign: 'center' }]}>Priority</Text>
                <Text style={[s.th, { flex: 1.2, textAlign: 'right' }]}>Action</Text>
              </View>
              {plan.deficiencies.map((d, i) => {
                const prColor = d.priority === 'high' ? colors.error : d.priority === 'medium' ? colors.warning : colors.brand;
                return (
                  <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                    <Text style={[s.td, { flex: 1, fontWeight: '600' }]}>{d.nutrient}</Text>
                    <View style={{ width: 50, alignItems: 'center' }}>
                      <Text style={[s.td, { color: prColor, fontWeight: '700' }]}>{d.score}</Text>
                      <View style={s.miniBar}><View style={[s.miniBarFill, { width: `${d.score}%`, backgroundColor: prColor }]} /></View>
                    </View>
                    <View style={{ width: 60, alignItems: 'center' }}>
                      <View style={[s.priorityTag, { backgroundColor: prColor + '18' }]}>
                        <Text style={[s.priorityText, { color: prColor }]}>{d.priority}</Text>
                      </View>
                    </View>
                    <Text style={[s.td, { flex: 1.2, textAlign: 'right', fontSize: 11 }]}>{d.action}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Meal Cards */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>DAILY MEAL PLAN</Text>
          {MEAL_ORDER.map(mealKey => {
            const meal = plan.meals?.[mealKey];
            if (!meal?.items?.length) return null;
            const accent = MEAL_ACCENTS[mealKey] || colors.brand;
            return (
              <View key={mealKey} style={[s.mealCard, { borderLeftColor: accent }]}>
                {/* Meal Header */}
                <View style={s.mealHeaderRow}>
                  <View>
                    <Text style={s.mealTitle}>{MEAL_LABELS[mealKey] || mealKey}</Text>
                    <Text style={s.mealTime}>{meal.time}</Text>
                  </View>
                  {meal.calories != null && meal.calories > 0 && (
                    <View style={s.mealMacros}>
                      <Text style={s.macroValue}>{meal.calories} <Text style={s.macroUnit}>kcal</Text></Text>
                      {meal.protein != null && <Text style={s.macroDetail}>P {meal.protein}g · C {meal.carbs || 0}g · F {meal.fat || 0}g</Text>}
                    </View>
                  )}
                </View>

                {/* Food Table Header */}
                <View style={s.foodTableHeader}>
                  <Text style={[s.foodTh, { flex: 1 }]}>Food</Text>
                  <Text style={[s.foodTh, { width: 70, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[s.foodTh, { width: 80, textAlign: 'right' }]}>Targets</Text>
                </View>

                {/* Food Items */}
                {meal.items.map((item, idx) => (
                  <View key={idx} style={[s.foodRow, idx > 0 && s.foodRowBorder]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.foodName}>{item.food}</Text>
                      <Text style={s.foodBenefit}>{item.benefit}</Text>
                    </View>
                    <View style={{ width: 70, alignItems: 'center' }}>
                      <View style={s.qtyPill}><Text style={s.qtyText}>{item.quantity}</Text></View>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-end' }}>
                      <View style={s.nutrientTag}><Text style={s.nutrientTagText}>{item.nutrient}</Text></View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* Hydration */}
        {plan.hydration && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>HYDRATION</Text>
            <View style={s.infoCard}>
              <Text style={s.infoText}>{plan.hydration}</Text>
            </View>
          </View>
        )}

        {/* Tips */}
        {plan.tips?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>CLINICAL RECOMMENDATIONS</Text>
            {plan.tips.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <View style={s.tipNumCircle}><Text style={s.tipNum}>{i + 1}</Text></View>
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <View style={s.disclaimerCard}>
          <Text style={s.disclaimerTitle}>Medical Disclaimer</Text>
          <Text style={s.disclaimerText}>
            This nutrition plan is AI-generated for wellness awareness only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider before making dietary changes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 50 },
  topBar: { paddingHorizontal: SPACING.xxl, paddingVertical: 12 },
  backText: { fontSize: 16, fontWeight: '500', color: c.textTertiary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  refreshText: { fontSize: 14, fontWeight: '600', color: c.brand },

  pageTitle: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.6, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  badge: { backgroundColor: c.brandBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', color: c.brand, letterSpacing: 0.3 },
  dateText: { fontSize: 13, color: c.textTertiary },

  // Summary
  summaryCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 20 },
  summaryText: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  calRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: c.hairline },
  calValue: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
  calLabel: { fontSize: 14, color: c.textTertiary, marginLeft: 6 },

  // Sections
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textQuaternary, letterSpacing: 1.2, marginBottom: 12 },

  // Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: c.bgTertiary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  pillText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },

  // Deficiency Table
  table: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: c.text },
  th: { fontSize: 10, fontWeight: '700', color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  tableRowAlt: { backgroundColor: c.bgSecondary },
  td: { fontSize: 13, color: c.text },
  miniBar: { width: 36, height: 3, borderRadius: 2, backgroundColor: c.hairline, marginTop: 3, overflow: 'hidden' },
  miniBarFill: { height: 3, borderRadius: 2 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const },

  // Meal Cards
  mealCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 16, marginBottom: 12, borderLeftWidth: 3 },
  mealHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.hairline },
  mealTitle: { fontSize: 16, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  mealTime: { fontSize: 12, color: c.textTertiary, marginTop: 2 },
  mealMacros: { alignItems: 'flex-end' },
  macroValue: { fontSize: 15, fontWeight: '700', color: c.text },
  macroUnit: { fontSize: 11, fontWeight: '500', color: c.textTertiary },
  macroDetail: { fontSize: 10, color: c.textQuaternary, marginTop: 2, letterSpacing: 0.3 },

  // Food Table
  foodTableHeader: { flexDirection: 'row', paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: c.hairline },
  foodTh: { fontSize: 10, fontWeight: '700', color: c.textQuaternary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  foodRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  foodRowBorder: { borderTopWidth: 1, borderTopColor: c.hairline },
  foodName: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 2 },
  foodBenefit: { fontSize: 11, color: c.textTertiary, lineHeight: 15 },
  qtyPill: { backgroundColor: c.brandBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qtyText: { fontSize: 11, fontWeight: '700', color: c.brand },
  nutrientTag: { backgroundColor: c.bgTertiary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  nutrientTagText: { fontSize: 10, fontWeight: '600', color: c.textSecondary },

  // Info cards
  infoCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 16 },
  infoText: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },

  // Tips
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  tipNumCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.brandBg, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 1 },
  tipNum: { fontSize: 11, fontWeight: '700', color: c.brand },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  // Disclaimer
  disclaimerCard: { backgroundColor: c.bgSecondary, borderRadius: RADIUS.md, padding: 16, marginTop: 8 },
  disclaimerTitle: { fontSize: 12, fontWeight: '700', color: c.textTertiary, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  disclaimerText: { fontSize: 11, color: c.textQuaternary, lineHeight: 16 },

  // Center states
  centerMsg: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  centerTitle: { fontSize: 22, fontWeight: '700', color: c.text, letterSpacing: -0.4, marginBottom: 8, textAlign: 'center' },
  centerDesc: { fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  spinner: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: c.hairline, borderTopColor: c.brand, marginBottom: 28 },
  retryBtn: { marginTop: 20, backgroundColor: c.invertedBg, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 36 },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: c.invertedText },
});

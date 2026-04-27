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

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  midMorning: 'Mid-Morning',
  lunch: 'Lunch',
  evening: 'Evening Snack',
  dinner: 'Dinner',
};
const MEAL_ORDER = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

interface FoodItem { food: string; qty: string; quantity?: string; }
interface MealData { time: string; calories?: number; items: FoodItem[]; }
interface PlanData {
  planDate: string;
  summary: string;
  dailyCalories?: number;
  focusNutrients?: string[];
  targetNutrients?: string[];
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

  useFocusEffect(useCallback(() => {
    (async () => {
      const cached = await AsyncStorage.getItem(PLAN_CACHE_KEY);
      if (cached) { try { setPlan(JSON.parse(cached)); return; } catch {} }
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
      if (retryCount === 0) { setRetryCount(1); setLoading(false); setTimeout(() => generatePlan(), 2000); return; }
      setError(e.message || 'Failed to generate plan.');
    }
    setLoading(false);
  }

  const s = makeStyles(colors);
  const focusList = plan?.focusNutrients || plan?.targetNutrients || [];

  // ── No Scans ──
  if (!hasScans && !plan && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.topBar}><TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.back}>‹ Back</Text></TouchableOpacity></View>
        <View style={s.center}>
          <Text style={s.centerTitle}>Nutrition Plan</Text>
          <Text style={s.centerSub}>Complete your first scan to get a personalized plan.</Text>
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
          <Text style={s.centerSub}>Analyzing your results...</Text>
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

  const totalCal = plan.dailyCalories || MEAL_ORDER.reduce((sum, k) => sum + (plan.meals?.[k]?.calories || 0), 0);

  // ── Plan View ──
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}><Text style={s.back}>‹ Back</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => { setRetryCount(0); generatePlan(); }} activeOpacity={0.6}>
            <Text style={s.refresh}>{loading ? 'Generating...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.title}>Daily Plan</Text>
        <Text style={s.date}>{plan.planDate}</Text>

        {/* Summary + Calories */}
        <View style={s.summaryCard}>
          <Text style={s.summaryText}>{plan.summary}</Text>
          {totalCal > 0 && (
            <View style={s.calBlock}>
              <Text style={s.calNum}>{totalCal}</Text>
              <Text style={s.calUnit}>kcal</Text>
            </View>
          )}
        </View>

        {/* Focus Nutrients */}
        {focusList.length > 0 && (
          <View style={s.focusRow}>
            {focusList.map((n, i) => (
              <View key={i} style={s.focusPill}><Text style={s.focusText}>{n}</Text></View>
            ))}
          </View>
        )}

        {/* Meals */}
        {MEAL_ORDER.map(key => {
          const meal = plan.meals?.[key];
          if (!meal?.items?.length) return null;
          return (
            <View key={key} style={s.mealCard}>
              <View style={s.mealHead}>
                <View>
                  <Text style={s.mealName}>{MEAL_LABELS[key] || key}</Text>
                  <Text style={s.mealTime}>{meal.time}</Text>
                </View>
                {meal.calories != null && meal.calories > 0 && (
                  <Text style={s.mealCal}>{meal.calories} <Text style={s.mealCalUnit}>kcal</Text></Text>
                )}
              </View>
              {meal.items.map((item, idx) => (
                <View key={idx} style={[s.foodRow, idx > 0 && s.foodBorder]}>
                  <Text style={s.foodName}>{item.food}</Text>
                  <Text style={s.foodQty}>{item.qty || item.quantity}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Hydration */}
        {plan.hydration && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Hydration</Text>
            <Text style={s.infoValue}>{plan.hydration}</Text>
          </View>
        )}

        {/* Tips */}
        {plan.tips?.length > 0 && (
          <View style={s.tipsBlock}>
            <Text style={s.tipsLabel}>Tips</Text>
            {plan.tips.map((tip, i) => (
              <Text key={i} style={s.tipText}>• {tip}</Text>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={s.disclaimer}>AI-generated for wellness awareness only. Not medical advice.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: 24, paddingBottom: 50 },
  topBar: { paddingHorizontal: 24, paddingVertical: 12 },
  back: { fontSize: 16, fontWeight: '500', color: c.textTertiary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  refresh: { fontSize: 14, fontWeight: '600', color: c.brand },

  title: { fontSize: 30, fontWeight: '700', color: c.text, letterSpacing: -0.8 },
  date: { fontSize: 13, color: c.textQuaternary, marginTop: 2, marginBottom: 20 },

  // Summary
  summaryCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 20, marginBottom: 16 },
  summaryText: { fontSize: 15, color: c.textSecondary, lineHeight: 22 },
  calBlock: { flexDirection: 'row', alignItems: 'baseline', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.hairline },
  calNum: { fontSize: 36, fontWeight: '700', color: c.text, letterSpacing: -1 },
  calUnit: { fontSize: 15, color: c.textTertiary, marginLeft: 6 },

  // Focus
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  focusPill: { backgroundColor: c.brandBg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  focusText: { fontSize: 13, fontWeight: '600', color: c.brand },

  // Meals
  mealCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 10 },
  mealHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: c.hairline },
  mealName: { fontSize: 17, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  mealTime: { fontSize: 12, color: c.textQuaternary, marginTop: 2 },
  mealCal: { fontSize: 16, fontWeight: '600', color: c.text },
  mealCalUnit: { fontSize: 12, fontWeight: '400', color: c.textTertiary },

  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  foodBorder: { borderTopWidth: 1, borderTopColor: c.hairline },
  foodName: { fontSize: 15, fontWeight: '500', color: c.text, flex: 1, paddingRight: 12 },
  foodQty: { fontSize: 13, fontWeight: '600', color: c.brand, backgroundColor: c.brandBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: 'hidden' },

  // Hydration
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 10 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: c.textTertiary },
  infoValue: { fontSize: 14, fontWeight: '600', color: c.text },

  // Tips
  tipsBlock: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 10 },
  tipsLabel: { fontSize: 14, fontWeight: '600', color: c.textTertiary, marginBottom: 12 },
  tipText: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 4 },

  // Disclaimer
  disclaimer: { fontSize: 11, color: c.textQuaternary, textAlign: 'center', marginTop: 12 },

  // Center states
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  centerTitle: { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 8 },
  centerSub: { fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 21 },
  spinner: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: c.hairline, borderTopColor: c.brand, marginBottom: 24 },
  retryBtn: { marginTop: 20, backgroundColor: c.invertedBg, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 36 },
  retryText: { fontSize: 15, fontWeight: '700', color: c.invertedText },
});

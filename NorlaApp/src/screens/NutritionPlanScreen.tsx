import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { generateNutritionPlan } from '../lib/api';
import { getProfile, getScans, type ScanCache } from '../lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_CACHE_KEY = 'norla_nutrition_plan';

const MEAL_META: Record<string, { label: string; accent: string }> = {
  breakfast: { label: 'Breakfast', accent: COLORS.brand },
  midMorning: { label: 'Mid-Morning', accent: '#8B5CF6' },
  lunch: { label: 'Lunch', accent: '#3B82F6' },
  evening: { label: 'Evening', accent: '#F59E0B' },
  dinner: { label: 'Dinner', accent: COLORS.text },
};

interface PlanData {
  planDate: string;
  summary: string;
  targetNutrients: string[];
  meals: Record<string, { time: string; items: { food: string; quantity: string; nutrient: string; benefit: string }[] }>;
  hydration: string;
  tips: string[];
}

export function NutritionPlanScreen() {
  const nav = useNavigation<any>();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const spinAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => { loadCachedPlan(); }, []);

  useEffect(() => {
    if (loading) {
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start();
    } else { spinAnim.setValue(0); }
  }, [loading]);

  async function loadCachedPlan() {
    const cached = await AsyncStorage.getItem(PLAN_CACHE_KEY);
    if (cached) { try { setPlan(JSON.parse(cached)); } catch {} }
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const scans = await getScans();
      if (scans.length === 0) { setError('Complete a scan first to get a personalized plan.'); setLoading(false); return; }
      const latest = scans[0];
      const profile = await getProfile();
      let userAge: number | undefined;
      let userSex: string | undefined;
      if (profile) {
        userSex = profile.sex;
        if (profile.dob) {
          const bd = new Date(profile.dob);
          const now = new Date();
          userAge = now.getFullYear() - bd.getFullYear();
          const m = now.getMonth() - bd.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) userAge--;
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
      }
    } catch (e: any) { setError(e.message || 'Failed to generate plan.'); }
    setLoading(false);
  }

  // ── Empty State ──
  if (!plan && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.emptyScroll}>
          <TouchableOpacity style={s.backRow} onPress={() => nav.goBack()} activeOpacity={0.6}>
            <Text style={s.backText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={s.emptyCenter}>
            <View style={s.emptyIcon}>
              <Text style={s.emptyIconLetter}>N</Text>
            </View>
            <Text style={s.emptyTitle}>Your Nutrition Plan</Text>
            <Text style={s.emptyDesc}>
              Get a personalized daily meal plan based on your latest scan. Our AI nutritionist will recommend specific foods to address your needs.
            </Text>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <TouchableOpacity style={s.generateBtn} onPress={handleGenerate} activeOpacity={0.8}>
              <Text style={s.generateBtnText}>Generate My Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Loading State ──
  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingCenter}>
          <Animated.View style={[s.loadingRing, { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
            <View style={s.loadingDot} />
          </Animated.View>
          <Text style={s.loadingTitle}>Creating Your Plan</Text>
          <Text style={s.loadingDesc}>Analyzing your nutritional profile and designing a personalized meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Plan View ──
  const mealOrder = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => nav.goBack()} activeOpacity={0.6}>
            <Text style={s.backText}>‹ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGenerate} activeOpacity={0.6}>
            <Text style={s.refreshBtn}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.pageTitle}>Daily Plan</Text>
        <Text style={s.pageSub}>{plan!.summary}</Text>

        {/* Target Nutrients */}
        {plan!.targetNutrients?.length > 0 && (
          <View style={s.targetsRow}>
            <Text style={s.targetsLabel}>FOCUS</Text>
            {plan!.targetNutrients.slice(0, 4).map((n, i) => (
              <View key={i} style={s.targetPill}>
                <Text style={s.targetText}>{n}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Meal Cards */}
        {mealOrder.map(mealKey => {
          const meal = plan!.meals?.[mealKey];
          if (!meal?.items?.length) return null;
          const meta = MEAL_META[mealKey] || { label: mealKey, accent: COLORS.text };

          return (
            <View key={mealKey} style={s.mealCard}>
              <View style={s.mealHeader}>
                <View style={[s.mealDot, { backgroundColor: meta.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.mealTitle}>{meta.label}</Text>
                  <Text style={s.mealTime}>{meal.time}</Text>
                </View>
              </View>

              {meal.items.map((item, idx) => (
                <View key={idx} style={[s.foodItem, idx > 0 && s.foodDivider]}>
                  <View style={s.foodRow}>
                    <Text style={s.foodName}>{item.food}</Text>
                    <Text style={s.foodQty}>{item.quantity}</Text>
                  </View>
                  <Text style={s.foodBenefit}>{item.benefit}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Hydration */}
        {plan!.hydration && (
          <View style={s.hydrationCard}>
            <Text style={s.hydrationLabel}>HYDRATION</Text>
            <Text style={s.hydrationText}>{plan!.hydration}</Text>
          </View>
        )}

        {/* Tips */}
        {plan!.tips?.length > 0 && (
          <View style={s.tipsCard}>
            <Text style={s.tipsLabel}>DAILY TIPS</Text>
            {plan!.tips.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <View style={s.tipDot} />
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.disclaimer}>
          This plan is AI-generated for wellness awareness only.{'\n'}Consult a healthcare professional before making dietary changes.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 40 },
  emptyScroll: { paddingHorizontal: SPACING.xxl, flex: 1 },

  // Back / Header
  backRow: { paddingVertical: 12 },
  backText: { fontSize: 16, fontWeight: '500', color: COLORS.textTertiary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  refreshBtn: { fontSize: 14, fontWeight: '600', color: COLORS.brand },

  // Page
  pageTitle: { fontSize: 32, fontWeight: '700', color: COLORS.text, letterSpacing: -0.8, marginBottom: 6 },
  pageSub: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 20 },

  // Targets
  targetsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 24, gap: 8 },
  targetsLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textQuaternary, letterSpacing: 1, marginRight: 4 },
  targetPill: { backgroundColor: COLORS.bgSecondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  targetText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

  // Meal cards
  mealCard: {
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    padding: 18, marginBottom: 10,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  mealDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  mealTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  mealTime: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },

  // Food items
  foodItem: { paddingVertical: 10 },
  foodDivider: { borderTopWidth: 1, borderTopColor: COLORS.hairline },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  foodName: { fontSize: 15, fontWeight: '600', color: COLORS.text, flex: 1 },
  foodQty: { fontSize: 13, fontWeight: '600', color: COLORS.brand, marginLeft: 8 },
  foodBenefit: { fontSize: 12, color: COLORS.textTertiary, lineHeight: 17 },

  // Hydration
  hydrationCard: { backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md, padding: 18, marginBottom: 10 },
  hydrationLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textQuaternary, letterSpacing: 1, marginBottom: 8 },
  hydrationText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },

  // Tips
  tipsCard: { backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md, padding: 18, marginBottom: 10 },
  tipsLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textQuaternary, letterSpacing: 1, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.brand, marginTop: 6, marginRight: 10 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },

  // Empty state
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.text,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  emptyIconLetter: { fontSize: 28, fontWeight: '700', color: COLORS.white },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 21, marginBottom: 28, maxWidth: 300 },
  errorText: { fontSize: 13, color: COLORS.error, marginBottom: 12, textAlign: 'center' },
  generateBtn: { backgroundColor: COLORS.text, borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 44 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },

  // Loading
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  loadingRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 3, borderColor: COLORS.hairline,
    borderTopColor: COLORS.brand,
    marginBottom: 24,
  },
  loadingDot: { position: 'absolute', top: -3, right: 22, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brand },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, letterSpacing: -0.4, marginBottom: 8 },
  loadingDesc: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', lineHeight: 20 },

  // Disclaimer
  disclaimer: { fontSize: 11, color: COLORS.textQuaternary, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../lib/theme';
import { generateNutritionPlan } from '../lib/api';
import { getProfile, getScans } from '../lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_CACHE_KEY = 'norla_nutrition_plan';

const MEAL_META: Record<string, { label: string; accent: string }> = {
  breakfast: { label: 'Breakfast', accent: '#10B981' },
  midMorning: { label: 'Mid-Morning', accent: '#8B5CF6' },
  lunch: { label: 'Lunch', accent: '#3B82F6' },
  evening: { label: 'Evening', accent: '#F59E0B' },
  dinner: { label: 'Dinner', accent: '#EF4444' },
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
  const { colors } = useTheme();
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
      if (result.plan) { setPlan(result.plan); await AsyncStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(result.plan)); }
    } catch (e: any) { setError(e.message || 'Failed to generate plan.'); }
    setLoading(false);
  }

  const s = makeStyles(colors);

  // ── Empty ──
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
            <Text style={s.emptyDesc}>Get a personalized daily meal plan based on your latest scan. Our AI nutritionist will recommend specific foods to address your needs.</Text>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <TouchableOpacity style={s.generateBtn} onPress={handleGenerate} activeOpacity={0.8}>
              <Text style={s.generateBtnText}>Generate My Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingCenter}>
          <Animated.View style={[s.loadingRing, { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]} />
          <Text style={s.loadingTitle}>Creating Your Plan</Text>
          <Text style={s.loadingDesc}>Analyzing your nutritional profile and designing a personalized meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Plan ──
  const mealOrder = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
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

        {plan!.targetNutrients?.length > 0 && (
          <View style={s.targetsRow}>
            <Text style={s.targetsLabel}>FOCUS</Text>
            {plan!.targetNutrients.slice(0, 4).map((n, i) => (
              <View key={i} style={s.targetPill}><Text style={s.targetText}>{n}</Text></View>
            ))}
          </View>
        )}

        {mealOrder.map(mealKey => {
          const meal = plan!.meals?.[mealKey];
          if (!meal?.items?.length) return null;
          const meta = MEAL_META[mealKey] || { label: mealKey, accent: colors.text };
          return (
            <View key={mealKey} style={[s.mealCard, { borderLeftColor: meta.accent }]}>
              <View style={s.mealHeader}>
                <Text style={s.mealTitle}>{meta.label}</Text>
                <Text style={s.mealTime}>{meal.time}</Text>
              </View>
              {meal.items.map((item, idx) => (
                <View key={idx} style={[s.foodItem, idx > 0 && s.foodDivider]}>
                  <View style={s.foodRow}>
                    <Text style={s.foodName}>{item.food}</Text>
                    <View style={s.qtyPill}><Text style={s.foodQty}>{item.quantity}</Text></View>
                  </View>
                  <Text style={s.foodBenefit}>{item.benefit}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {plan!.hydration && (
          <View style={s.hydrationCard}>
            <Text style={s.sectionLabel}>HYDRATION</Text>
            <Text style={s.hydrationText}>{plan!.hydration}</Text>
          </View>
        )}

        {plan!.tips?.length > 0 && (
          <View style={s.tipsCard}>
            <Text style={s.sectionLabel}>DAILY TIPS</Text>
            {plan!.tips.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <Text style={s.tipNum}>{i + 1}</Text>
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={s.disclaimer}>This plan is AI-generated for wellness awareness only.{'\n'}Consult a healthcare professional before making dietary changes.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 40 },
  emptyScroll: { paddingHorizontal: SPACING.xxl, flex: 1 },
  backRow: { paddingVertical: 12 },
  backText: { fontSize: 16, fontWeight: '500', color: c.textTertiary },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  refreshBtn: { fontSize: 14, fontWeight: '600', color: c.brand },
  pageTitle: { fontSize: 32, fontWeight: '700', color: c.text, letterSpacing: -0.8, marginBottom: 6 },
  pageSub: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginBottom: 20 },
  targetsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 24, gap: 8 },
  targetsLabel: { fontSize: 11, fontWeight: '700', color: c.textQuaternary, letterSpacing: 1, marginRight: 4 },
  targetPill: { backgroundColor: c.bgSecondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  targetText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
  mealCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 10, borderLeftWidth: 3 },
  mealHeader: { marginBottom: 14 },
  mealTitle: { fontSize: 16, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  mealTime: { fontSize: 12, color: c.textTertiary, marginTop: 2 },
  foodItem: { paddingVertical: 10 },
  foodDivider: { borderTopWidth: 1, borderTopColor: c.hairline },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  foodName: { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
  qtyPill: { backgroundColor: c.brandBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 8 },
  foodQty: { fontSize: 12, fontWeight: '700', color: c.brand },
  foodBenefit: { fontSize: 12, color: c.textTertiary, lineHeight: 17 },
  hydrationCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.hairline },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: c.textQuaternary, letterSpacing: 1, marginBottom: 10 },
  hydrationText: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
  tipsCard: { backgroundColor: c.cardBg, borderRadius: RADIUS.md, padding: 18, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tipNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: c.brandBg, textAlign: 'center', lineHeight: 20, fontSize: 11, fontWeight: '700', color: c.brand, marginRight: 10, overflow: 'hidden' },
  tipText: { flex: 1, fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.brand, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyIconLetter: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: c.text, letterSpacing: -0.5, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 21, marginBottom: 28, maxWidth: 300 },
  errorText: { fontSize: 13, color: c.error, marginBottom: 12, textAlign: 'center' },
  generateBtn: { backgroundColor: c.invertedBg, borderRadius: RADIUS.md, paddingVertical: 16, paddingHorizontal: 44 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: c.invertedText },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  loadingRing: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: c.hairline, borderTopColor: c.brand, marginBottom: 24 },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: c.text, letterSpacing: -0.4, marginBottom: 8 },
  loadingDesc: { fontSize: 14, color: c.textTertiary, textAlign: 'center', lineHeight: 20 },
  disclaimer: { fontSize: 11, color: c.textQuaternary, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { generateNutritionPlan } from '../lib/api';
import { getProfile, getScans, type ScanCache } from '../lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAN_CACHE_KEY = 'norla_nutrition_plan';

const MEAL_ICONS: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  breakfast: { emoji: '🌅', label: 'Breakfast', color: '#F59E0B', bg: '#FFFBEB' },
  midMorning: { emoji: '🍵', label: 'Mid-Morning', color: '#8B5CF6', bg: '#F5F3FF' },
  lunch: { emoji: '☀️', label: 'Lunch', color: '#10B981', bg: '#F0FDF4' },
  evening: { emoji: '🍎', label: 'Evening Snack', color: '#F97316', bg: '#FFF7ED' },
  dinner: { emoji: '🌙', label: 'Dinner', color: '#3B82F6', bg: '#EFF6FF' },
};

const NUTRIENT_EMOJI: Record<string, string> = {
  iron: '🩸', b12: '🧬', vitD: '☀️', vitA: '👁️', folate: '🥬',
  zinc: '⚡', protein: '💪', hydration: '💧', vitC: '🍊', omega3: '🐟',
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
  const [latestScan, setLatestScan] = useState<ScanCache | null>(null);
  const spinAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    loadCachedPlan();
  }, []);

  useEffect(() => {
    if (loading) {
      Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [loading]);

  async function loadCachedPlan() {
    const scans = await getScans();
    if (scans.length > 0) setLatestScan(scans[0]);
    const cached = await AsyncStorage.getItem(PLAN_CACHE_KEY);
    if (cached) {
      try { setPlan(JSON.parse(cached)); } catch {}
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const scans = await getScans();
      if (scans.length === 0) {
        setError('Complete a scan first to get a personalized plan.');
        setLoading(false);
        return;
      }
      const latest = scans[0];
      setLatestScan(latest);

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

      // Flatten nutrient scores
      const scores: Record<string, number> = {};
      if (latest.nutrientScores) {
        for (const [k, v] of Object.entries(latest.nutrientScores)) {
          scores[k] = typeof v === 'object' ? ((v as any).score ?? v) : v as number;
        }
      }

      const result = await generateNutritionPlan({
        nutrientScores: scores,
        userAge,
        userSex,
        foodPattern: undefined, // Could be enhanced later
      });

      if (result.plan) {
        setPlan(result.plan);
        await AsyncStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(result.plan));
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate plan. Please try again.');
    }
    setLoading(false);
  }

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (!plan && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.emptyScroll}>
          <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={s.emptyCenter}>
            <Text style={s.emptyEmoji}>🥗</Text>
            <Text style={s.emptyTitle}>Your Nutrition Plan</Text>
            <Text style={s.emptyDesc}>
              Get a personalized daily meal plan based on your latest scan results. AI will recommend specific foods and quantities to address your nutritional needs.
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

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingCenter}>
          <Animated.Text style={[s.loadingEmoji, { transform: [{ rotate: spin }] }]}>🍽️</Animated.Text>
          <Text style={s.loadingTitle}>Creating Your Plan</Text>
          <Text style={s.loadingDesc}>Our AI nutritionist is designing a personalized meal plan for you...</Text>
          <ActivityIndicator size="small" color={COLORS.brand} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  const mealOrder = ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={s.backText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGenerate}>
            <Text style={s.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.pageTitle}>Your Daily Plan</Text>
        <Text style={s.pageSub}>{plan!.summary}</Text>

        {/* Target Nutrients */}
        {plan!.targetNutrients && plan!.targetNutrients.length > 0 && (
          <View style={s.targetsRow}>
            {plan!.targetNutrients.slice(0, 4).map((n, i) => (
              <View key={i} style={s.targetPill}>
                <Text style={s.targetText}>{NUTRIENT_EMOJI[n] || '🎯'} {n}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Meal Cards */}
        {mealOrder.map(mealKey => {
          const meal = plan!.meals?.[mealKey];
          if (!meal || !meal.items?.length) return null;
          const meta = MEAL_ICONS[mealKey] || { emoji: '🍽️', label: mealKey, color: '#666', bg: '#F5F5F5' };

          return (
            <View key={mealKey} style={[s.mealCard, { borderLeftColor: meta.color }]}>
              <View style={s.mealHeader}>
                <View style={[s.mealIconBg, { backgroundColor: meta.bg }]}>
                  <Text style={s.mealEmoji}>{meta.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.mealTitle, { color: meta.color }]}>{meta.label}</Text>
                  <Text style={s.mealTime}>{meal.time}</Text>
                </View>
              </View>

              {meal.items.map((item, idx) => (
                <View key={idx} style={[s.foodItem, idx > 0 && s.foodItemBorder]}>
                  <View style={s.foodMain}>
                    <Text style={s.foodName}>{item.food}</Text>
                    <Text style={s.foodQty}>{item.quantity}</Text>
                  </View>
                  <Text style={s.foodBenefit}>{NUTRIENT_EMOJI[item.nutrient] || '•'} {item.benefit}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Hydration */}
        {plan!.hydration && (
          <View style={s.hydrationCard}>
            <Text style={s.hydrationTitle}>💧 Hydration</Text>
            <Text style={s.hydrationText}>{plan!.hydration}</Text>
          </View>
        )}

        {/* Tips */}
        {plan!.tips && plan!.tips.length > 0 && (
          <View style={s.tipsCard}>
            <Text style={s.tipsTitle}>💡 Daily Tips</Text>
            {plan!.tips.map((tip, i) => (
              <View key={i} style={s.tipRow}>
                <Text style={s.tipNum}>{i + 1}</Text>
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Disclaimer */}
        <Text style={s.disclaimer}>
          This plan is AI-generated for wellness awareness only. Consult a healthcare professional before making dietary changes.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFB' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyScroll: { paddingHorizontal: 20, flex: 1 },

  // Back button
  backBtn: { paddingVertical: 12 },
  backText: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary },
  refreshText: { fontSize: 14, fontWeight: '600', color: COLORS.brand },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.6, marginBottom: 6 },
  pageSub: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 16 },

  // Targets
  targetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  targetPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  targetText: { fontSize: 12, fontWeight: '600', color: '#92400E' },

  // Meal cards
  mealCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  mealIconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mealEmoji: { fontSize: 20 },
  mealTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  mealTime: { fontSize: 12, color: '#999', marginTop: 2 },

  // Food items
  foodItem: { paddingVertical: 10 },
  foodItemBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  foodMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  foodName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', flex: 1 },
  foodQty: { fontSize: 13, fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  foodBenefit: { fontSize: 12, color: '#888', lineHeight: 17 },

  // Hydration
  hydrationCard: {
    backgroundColor: '#EFF6FF', borderRadius: 16, padding: 18, marginBottom: 14,
  },
  hydrationTitle: { fontSize: 16, fontWeight: '700', color: '#1E40AF', marginBottom: 8 },
  hydrationText: { fontSize: 14, color: '#3B82F6', lineHeight: 20 },

  // Tips
  tipsCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  tipsTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  tipRow: { flexDirection: 'row', marginBottom: 10 },
  tipNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#F0FDF4', textAlign: 'center', lineHeight: 22, fontSize: 11, fontWeight: '700', color: '#10B981', marginRight: 10 },
  tipText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 19 },

  // Empty state
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21, marginBottom: 24, maxWidth: 300 },
  errorText: { fontSize: 13, color: '#EF4444', marginBottom: 12, textAlign: 'center' },
  generateBtn: { backgroundColor: '#1A1A1A', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Loading
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  loadingEmoji: { fontSize: 48, marginBottom: 20 },
  loadingTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  loadingDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },

  // Disclaimer
  disclaimer: { fontSize: 11, color: '#BBB', textAlign: 'center', marginTop: 8, lineHeight: 16, paddingHorizontal: 20 },
});

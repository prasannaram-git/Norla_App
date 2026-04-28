import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../../lib/theme';
import { QUESTIONNAIRE_STEPS, DEFAULT_QUESTIONNAIRE } from '../../lib/questionnaire-config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ScanStackParamList, 'Questionnaire'>;

export function QuestionnaireScreen({ navigation, route }: Props) {
  const { images } = route.params;
  const { colors } = useTheme();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({ ...DEFAULT_QUESTIONNAIRE });
  const currentStep = QUESTIONNAIRE_STEPS[stepIdx];
  const total = QUESTIONNAIRE_STEPS.length;

  const set = (field: string, value: any) => setAnswers(p => ({ ...p, [field]: value }));

  const handleNext = () => {
    if (stepIdx < total - 1) setStepIdx(stepIdx + 1);
    else navigation.navigate('Processing', { images, questionnaire: answers });
  };

  const isLast = stepIdx >= total - 1;
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Progress bar */}
      <View style={s.progressRow}>
        {QUESTIONNAIRE_STEPS.map((_, i) => (
          <View key={i} style={[s.bar, i <= stepIdx && s.barActive]} />
        ))}
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.step}>Step {stepIdx + 1} of {total}</Text>
        <Text style={s.title}>{currentStep.title}</Text>
        <Text style={s.sub}>{currentStep.subtitle}</Text>

        {currentStep.questions.map((q, qi) => (
          <View key={q.id} style={[s.questionWrap, qi < currentStep.questions.length - 1 && s.qBorder]}>
            <Text style={s.qText}>{q.question}</Text>
            {q.description ? <Text style={s.qDesc}>{q.description}</Text> : null}

            {/* Slider */}
            {q.type === 'slider' && (
              <View>
                <View style={s.sliderLabels}>
                  <Text style={s.sliderLabel}>{q.labels?.[0]}</Text>
                  <Text style={s.sliderLabel}>{q.labels?.[1]}</Text>
                </View>
                <View style={s.dotsRow}>
                  {[1, 2, 3, 4, 5].map(v => {
                    const active = (answers[q.field] || 3) >= v;
                    return (
                      <TouchableOpacity key={v} style={[s.dot, active && s.dotActive]} onPress={() => set(q.field, v)} activeOpacity={0.7}>
                        <Text style={[s.dotText, active && s.dotTextActive]}>{v}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Pills */}
            {q.type === 'pills' && (
              <View style={s.pillsRow}>
                {q.options?.map(opt => {
                  const optValue = typeof opt === 'string' ? opt : opt.value;
                  const optLabel = typeof opt === 'string' ? opt : opt.label;
                  const active = answers[q.field] === optValue;
                  return (
                    <TouchableOpacity key={optValue} style={[s.pill, active && s.pillActive]} onPress={() => set(q.field, optValue)} activeOpacity={0.7}>
                      <Text style={[s.pillText, active && s.pillTextActive]}>{optLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Toggle */}
            {q.type === 'toggle' && (
              <View style={s.toggleRow}>
                <Text style={s.toggleLabel}>{answers[q.field] ? 'Yes' : 'No'}</Text>
                <Switch
                  value={!!answers[q.field]}
                  onValueChange={v => set(q.field, v)}
                  trackColor={{ false: colors.hairline, true: colors.brand + '60' }}
                  thumbColor={answers[q.field] ? colors.brand : colors.textQuaternary}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        {stepIdx > 0 && (
          <TouchableOpacity onPress={() => setStepIdx(stepIdx - 1)} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, stepIdx === 0 && { flex: 1 }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={s.nextText}>{isLast ? 'Submit & Analyze' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: SPACING.xxl, paddingTop: 8, paddingBottom: 16 },
  bar: { flex: 1, height: 3, backgroundColor: c.hairline, borderRadius: 2 },
  barActive: { backgroundColor: c.brand },

  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 24 },
  step: { fontSize: 12, color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: c.text, letterSpacing: -0.4 },
  sub: { fontSize: 14, color: c.textSecondary, marginTop: 4, marginBottom: 28 },

  questionWrap: { paddingBottom: 24, marginBottom: 24 },
  qBorder: { borderBottomWidth: 1, borderBottomColor: c.hairline },
  qText: { fontSize: 15, fontWeight: '600', color: c.text, lineHeight: 22 },
  qDesc: { fontSize: 13, color: c.textTertiary, marginTop: 4, marginBottom: 4 },

  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  sliderLabel: { fontSize: 11, color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  dotsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: { width: 52, height: 40, borderRadius: 8, backgroundColor: c.bgTertiary, borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center' },
  dotActive: { backgroundColor: c.brand, borderColor: c.brand },
  dotText: { fontSize: 15, fontWeight: '700', color: c.textTertiary },
  dotTextActive: { color: '#FFFFFF' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 16, height: 36, borderRadius: RADIUS.full, backgroundColor: c.bgTertiary, borderWidth: 1, borderColor: c.border, justifyContent: 'center' },
  pillActive: { backgroundColor: c.brand, borderColor: c.brand },
  pillText: { fontSize: 14, fontWeight: '500', color: c.textSecondary },
  pillTextActive: { color: '#FFFFFF' },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: c.textSecondary },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: c.hairline,
    backgroundColor: c.bg,
  },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  backText: { fontSize: 15, fontWeight: '500', color: c.textSecondary },
  nextBtn: { flex: 1, height: 52, borderRadius: RADIUS.md, backgroundColor: c.brand, justifyContent: 'center', alignItems: 'center' },
  nextText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});

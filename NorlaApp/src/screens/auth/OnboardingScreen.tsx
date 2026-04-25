import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../lib/theme';
import { saveProfile } from '../../lib/storage';
import { syncProfile } from '../../lib/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const STEPS = ['name', 'dob', 'sex'] as const;
type Step = typeof STEPS[number];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function OnboardingScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [sex, setSex] = useState('');

  // Date picker state — default to 25 years ago
  const defaultYear = new Date().getFullYear() - 25;
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const stepIdx = STEPS.indexOf(step);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (next: Step) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 120);
  };

  const handleNext = async () => {
    setError('');
    if (step === 'name') {
      if (name.trim().length < 2) { setError('Please enter your name'); return; }
      animateTransition('dob');
    } else if (step === 'dob') {
      const dob = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      // Validate age
      const age = new Date().getFullYear() - selectedYear;
      if (age < 13) { setError('You must be at least 13 years old'); return; }
      if (age > 120) { setError('Please enter a valid date of birth'); return; }
      animateTransition('sex');
    } else {
      if (!sex) { setError('Please select one'); return; }
      const dob = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      const profile = { phone, name: name.trim(), dob, sex };
      await saveProfile(profile);
      syncProfile(profile);
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) {
      animateTransition(STEPS[stepIdx - 1]);
    }
  };

  // Generate year options (120 years back from current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 108 }, (_, i) => currentYear - 13 - i); // 13 to 120 years ago
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Clamp day if month/year changes
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth]);

  const formattedDate = `${selectedDay} ${MONTH_FULL[selectedMonth - 1]} ${selectedYear}`;

  return (
    <SafeAreaView style={s.safe}>
      {/* Progress bar */}
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: `${((stepIdx + 1) / 3) * 100}%` }]} />
      </View>

      {/* Step indicator */}
      <View style={s.stepHeader}>
        {stepIdx > 0 ? (
          <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <Text style={s.stepLabel}>Step {stepIdx + 1} of 3</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Step 1: Name ── */}
          {step === 'name' && (
            <>
              <Text style={s.heading}>What's your name?</Text>
              <Text style={s.sub}>This helps us personalize your experience.</Text>
              <TextInput
                style={s.input}
                placeholder="Full name"
                placeholderTextColor={COLORS.textQuaternary}
                value={name}
                onChangeText={t => { setName(t); setError(''); }}
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
            </>
          )}

          {/* ── Step 2: Date of Birth ── */}
          {step === 'dob' && (
            <>
              <Text style={s.heading}>Date of birth</Text>
              <Text style={s.sub}>Used for age-adjusted nutrition insights.</Text>

              {/* Selected date display */}
              <View style={s.dateDisplay}>
                <Text style={s.dateDisplayText}>{formattedDate}</Text>
              </View>

              {/* Day / Month / Year picker */}
              <View style={s.pickerRow}>
                {/* Day */}
                <View style={s.pickerCol}>
                  <Text style={s.pickerLabel}>Day</Text>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {days.map(d => (
                      <TouchableOpacity
                        key={`day-${d}`}
                        style={[s.pickerItem, d === selectedDay && s.pickerItemActive]}
                        onPress={() => { setSelectedDay(d); setError(''); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.pickerItemText, d === selectedDay && s.pickerItemTextActive]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Month */}
                <View style={[s.pickerCol, { flex: 1.4 }]}>
                  <Text style={s.pickerLabel}>Month</Text>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity
                        key={`month-${m}`}
                        style={[s.pickerItem, (i + 1) === selectedMonth && s.pickerItemActive]}
                        onPress={() => { setSelectedMonth(i + 1); setError(''); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.pickerItemText, (i + 1) === selectedMonth && s.pickerItemTextActive]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Year */}
                <View style={s.pickerCol}>
                  <Text style={s.pickerLabel}>Year</Text>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {years.map(y => (
                      <TouchableOpacity
                        key={`year-${y}`}
                        style={[s.pickerItem, y === selectedYear && s.pickerItemActive]}
                        onPress={() => { setSelectedYear(y); setError(''); }}
                        activeOpacity={0.7}
                      >
                        <Text style={[s.pickerItemText, y === selectedYear && s.pickerItemTextActive]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </>
          )}

          {/* ── Step 3: Sex ── */}
          {step === 'sex' && (
            <>
              <Text style={s.heading}>Biological sex</Text>
              <Text style={s.sub}>Nutritional needs vary by sex. This improves accuracy.</Text>
              <View style={s.optRow}>
                {[
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.opt, sex === opt.value && s.optActive]}
                    onPress={() => { setSex(opt.value); setError(''); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.optText, sex === opt.value && s.optTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, step === 'name' && name.trim().length < 2 && s.btnOff, step === 'sex' && !sex && s.btnOff]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>{step === 'sex' ? 'Get Started' : 'Continue'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },

  progressTrack: { height: 3, backgroundColor: COLORS.hairline },
  progressFill: { height: 3, backgroundColor: COLORS.text, borderRadius: 2 },

  stepHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xxl, paddingVertical: 14,
  },
  backText: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary },
  stepLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textQuaternary },

  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xxl, paddingTop: 16, paddingBottom: 40 },

  heading: { fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, lineHeight: 22, marginBottom: 28 },

  input: {
    height: 52, borderBottomWidth: 1.5, borderBottomColor: COLORS.border,
    fontSize: 18, fontWeight: '500', color: COLORS.text, marginBottom: 28,
  },

  // Date display
  dateDisplay: {
    paddingVertical: 14, paddingHorizontal: 18,
    backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md,
    marginBottom: 20, alignItems: 'center',
  },
  dateDisplayText: { fontSize: 18, fontWeight: '600', color: COLORS.text, letterSpacing: -0.3 },

  // Date picker columns
  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  pickerScroll: { maxHeight: 200, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgSecondary },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  pickerItemActive: { backgroundColor: COLORS.text, borderRadius: RADIUS.sm },
  pickerItemText: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary },
  pickerItemTextActive: { color: COLORS.white, fontWeight: '700' },

  // Sex options
  optRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  opt: {
    flex: 1, height: 56, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  optActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  optText: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  optTextActive: { color: COLORS.white },

  error: { fontSize: 13, color: COLORS.error, marginBottom: 16 },

  btn: { height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center' },
  btnOff: { opacity: 0.15 },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});

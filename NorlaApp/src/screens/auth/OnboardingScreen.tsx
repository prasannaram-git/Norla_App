import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../../lib/theme';
import { saveProfile } from '../../lib/storage';
import { syncProfile } from '../../lib/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const STEPS = ['name', 'dob', 'sex', 'body', 'theme'] as const;
type Step = typeof STEPS[number];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

export function OnboardingScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const { colors, mode, setMode } = useTheme();
  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [sex, setSex] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(mode);

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
      const age = new Date().getFullYear() - selectedYear;
      if (age < 13) { setError('You must be at least 13 years old'); return; }
      if (age > 120) { setError('Please enter a valid date of birth'); return; }
      animateTransition('sex');
    } else if (step === 'sex') {
      if (!sex) { setError('Please select one'); return; }
      animateTransition('body');
    } else if (step === 'body') {
      const h = parseFloat(height), w = parseFloat(weight);
      if (!height || isNaN(h) || h < 50 || h > 300) { setError('Enter a valid height (50-300 cm)'); return; }
      if (!weight || isNaN(w) || w < 10 || w > 500) { setError('Enter a valid weight (10-500 kg)'); return; }
      animateTransition('theme');
    } else {
      // Theme step — save everything
      setMode(selectedTheme);
      const dob = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      const h = parseFloat(height) || undefined;
      const w = parseFloat(weight) || undefined;
      const profile = { phone, name: name.trim(), dob, sex, height: h, weight: w };
      await saveProfile(profile);
      syncProfile(profile);
      navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) animateTransition(STEPS[stepIdx - 1]);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 108 }, (_, i) => currentYear - 13 - i);
  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    if (selectedDay > daysInMonth) setSelectedDay(daysInMonth);
  }, [selectedMonth, selectedYear, daysInMonth]);

  const formattedDate = `${selectedDay} ${MONTH_FULL[selectedMonth - 1]} ${selectedYear}`;
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width: `${((stepIdx + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <View style={s.stepHeader}>
        {stepIdx > 0 ? (
          <TouchableOpacity onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={s.backText}>Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <Text style={s.stepLabel}>Step {stepIdx + 1} of {STEPS.length}</Text>
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
                placeholderTextColor={colors.textQuaternary}
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
              <View style={s.dateDisplay}>
                <Text style={s.dateDisplayText}>{formattedDate}</Text>
              </View>
              <View style={s.pickerRow}>
                <View style={s.pickerCol}>
                  <Text style={s.pickerLabel}>Day</Text>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {days.map(d => (
                      <TouchableOpacity key={`day-${d}`} style={[s.pickerItem, d === selectedDay && s.pickerItemActive]}
                        onPress={() => { setSelectedDay(d); setError(''); }} activeOpacity={0.7}>
                        <Text style={[s.pickerItemText, d === selectedDay && s.pickerItemTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={[s.pickerCol, { flex: 1.4 }]}>
                  <Text style={s.pickerLabel}>Month</Text>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {MONTHS.map((m, i) => (
                      <TouchableOpacity key={`month-${m}`} style={[s.pickerItem, (i + 1) === selectedMonth && s.pickerItemActive]}
                        onPress={() => { setSelectedMonth(i + 1); setError(''); }} activeOpacity={0.7}>
                        <Text style={[s.pickerItemText, (i + 1) === selectedMonth && s.pickerItemTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={s.pickerCol}>
                  <Text style={s.pickerLabel}>Year</Text>
                  <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                    {years.map(y => (
                      <TouchableOpacity key={`year-${y}`} style={[s.pickerItem, y === selectedYear && s.pickerItemActive]}
                        onPress={() => { setSelectedYear(y); setError(''); }} activeOpacity={0.7}>
                        <Text style={[s.pickerItemText, y === selectedYear && s.pickerItemTextActive]}>{y}</Text>
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
                {[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }].map(opt => (
                  <TouchableOpacity key={opt.value} style={[s.opt, sex === opt.value && s.optActive]}
                    onPress={() => { setSex(opt.value); setError(''); }} activeOpacity={0.8}>
                    <Text style={[s.optText, sex === opt.value && s.optTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* ── Step 4: Height & Weight ── */}
          {step === 'body' && (
            <>
              <Text style={s.heading}>Height & Weight</Text>
              <Text style={s.sub}>Helps calculate BMI and personalize your plan.</Text>
              <View style={s.bodyRow}>
                <View style={s.bodyCol}>
                  <Text style={s.bodyLabel}>HEIGHT</Text>
                  <View style={s.bodyInputWrap}>
                    <TextInput
                      style={s.bodyInput}
                      placeholder="170"
                      placeholderTextColor={colors.textQuaternary}
                      value={height}
                      onChangeText={t => { setHeight(t.replace(/[^0-9.]/g, '')); setError(''); }}
                      keyboardType="numeric"
                      maxLength={5}
                      autoFocus
                    />
                    <Text style={s.bodyUnit}>cm</Text>
                  </View>
                </View>
                <View style={s.bodyCol}>
                  <Text style={s.bodyLabel}>WEIGHT</Text>
                  <View style={s.bodyInputWrap}>
                    <TextInput
                      style={s.bodyInput}
                      placeholder="65"
                      placeholderTextColor={colors.textQuaternary}
                      value={weight}
                      onChangeText={t => { setWeight(t.replace(/[^0-9.]/g, '')); setError(''); }}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                    <Text style={s.bodyUnit}>kg</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ── Step 4: Theme ── */}
          {step === 'theme' && (
            <>
              <Text style={s.heading}>Choose your look</Text>
              <Text style={s.sub}>You can change this anytime from your profile.</Text>
              <View style={s.themeRow}>
                <TouchableOpacity
                  style={[s.themeCard, { backgroundColor: '#FFFFFF', borderColor: selectedTheme === 'light' ? colors.brand : '#E8E8E8' }]}
                  onPress={() => setSelectedTheme('light')} activeOpacity={0.8}
                >
                  <View style={s.themePreview}>
                    <View style={[s.themeBar, { backgroundColor: '#1A1A1A' }]} />
                    <View style={[s.themeBar, { backgroundColor: '#666666', width: '60%' }]} />
                    <View style={[s.themeBar, { backgroundColor: '#BBBBBB', width: '40%' }]} />
                  </View>
                  <Text style={[s.themeLabel, { color: '#1A1A1A' }]}>Light</Text>
                  {selectedTheme === 'light' && <View style={s.themeCheck}><Text style={s.themeCheckText}>✓</Text></View>}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.themeCard, { backgroundColor: '#0A0A0A', borderColor: selectedTheme === 'dark' ? colors.brand : '#2A2A2A' }]}
                  onPress={() => setSelectedTheme('dark')} activeOpacity={0.8}
                >
                  <View style={s.themePreview}>
                    <View style={[s.themeBar, { backgroundColor: '#F5F5F5' }]} />
                    <View style={[s.themeBar, { backgroundColor: '#A0A0A0', width: '60%' }]} />
                    <View style={[s.themeBar, { backgroundColor: '#4A4A4A', width: '40%' }]} />
                  </View>
                  <Text style={[s.themeLabel, { color: '#F5F5F5' }]}>Dark</Text>
                  {selectedTheme === 'dark' && <View style={[s.themeCheck, { backgroundColor: '#34D399' }]}><Text style={s.themeCheckText}>✓</Text></View>}
                </TouchableOpacity>
              </View>
            </>
          )}

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[s.btn, step === 'name' && name.trim().length < 2 && s.btnOff, step === 'sex' && !sex && s.btnOff, step === 'body' && (!height || !weight) && s.btnOff]}
            onPress={handleNext} activeOpacity={0.8}
          >
            <Text style={s.btnText}>{step === 'theme' ? 'Get Started' : 'Continue'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  progressTrack: { height: 3, backgroundColor: c.hairline },
  progressFill: { height: 3, backgroundColor: c.brand, borderRadius: 2 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xxl, paddingVertical: 14 },
  backText: { fontSize: 15, fontWeight: '500', color: c.textSecondary },
  stepLabel: { fontSize: 13, fontWeight: '500', color: c.textQuaternary },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.xxl, paddingTop: 16, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: c.textSecondary, marginTop: 8, lineHeight: 22, marginBottom: 28 },
  input: { height: 52, borderBottomWidth: 1.5, borderBottomColor: c.border, fontSize: 18, fontWeight: '500', color: c.text, marginBottom: 28 },
  dateDisplay: { paddingVertical: 14, paddingHorizontal: 18, backgroundColor: c.bgSecondary, borderRadius: RADIUS.md, marginBottom: 20, alignItems: 'center' },
  dateDisplayText: { fontSize: 18, fontWeight: '600', color: c.text, letterSpacing: -0.3 },
  pickerRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontSize: 12, fontWeight: '600', color: c.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8 },
  pickerScroll: { maxHeight: 200, borderRadius: RADIUS.sm, backgroundColor: c.bgSecondary },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  pickerItemActive: { backgroundColor: c.invertedBg, borderRadius: RADIUS.sm },
  pickerItemText: { fontSize: 15, fontWeight: '500', color: c.textSecondary },
  pickerItemTextActive: { color: c.invertedText, fontWeight: '700' },
  optRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  opt: { flex: 1, height: 56, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: c.border },
  optActive: { backgroundColor: c.invertedBg, borderColor: c.invertedBg },
  optText: { fontSize: 16, fontWeight: '600', color: c.textSecondary },
  optTextActive: { color: c.invertedText },
  error: { fontSize: 13, color: c.error, marginBottom: 16 },
  btn: { height: 52, borderRadius: RADIUS.md, backgroundColor: c.invertedBg, justifyContent: 'center', alignItems: 'center' },
  btnOff: { opacity: 0.15 },
  btnText: { fontSize: 16, fontWeight: '700', color: c.invertedText },
  // Theme step
  themeRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  themeCard: { flex: 1, borderRadius: RADIUS.lg, borderWidth: 2, padding: 20, alignItems: 'center' },
  themePreview: { width: '100%', marginBottom: 16, gap: 8 },
  themeBar: { height: 8, borderRadius: 4, width: '80%' },
  themeLabel: { fontSize: 16, fontWeight: '700' },
  themeCheck: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
  themeCheckText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  // Body step
  bodyRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  bodyCol: { flex: 1 },
  bodyLabel: { fontSize: 12, fontWeight: '700', color: c.textTertiary, letterSpacing: 0.8, marginBottom: 10 },
  bodyInputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: c.border, paddingBottom: 4 },
  bodyInput: { flex: 1, fontSize: 28, fontWeight: '700', color: c.text, paddingVertical: 8 },
  bodyUnit: { fontSize: 16, fontWeight: '600', color: c.textTertiary, marginLeft: 6 },
});

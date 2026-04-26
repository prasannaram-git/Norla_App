import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../../lib/theme';
import { submitScan, syncScanToServer } from '../../lib/api';
import { addScanToCache, getSession, getProfile } from '../../lib/storage';
import { SERVER_URL } from '../../lib/constants';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ScanStackParamList, 'Processing'>;

const MESSAGES = [
  'Preparing photos',
  'Connecting to AI',
  'Analyzing face',
  'Examining eyes',
  'Evaluating left hand',
  'Evaluating right hand',
  'Processing biomarkers',
  'Calculating scores',
  'Generating report',
];

export function ProcessingScreen({ route }: Props) {
  const rootNav = useNavigation<any>();
  const { colors } = useTheme();
  const { images, questionnaire } = route.params;
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })).start();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(p => (p + 1) % MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { run(); }, []);

  async function run() {
    try {
      // Log payload size for debugging
      const sizes = {
        face: images.face?.length || 0,
        eye: images.eye?.length || 0,
        leftHand: images.leftHand?.length || 0,
        rightHand: images.rightHand?.length || 0,
      };
      const totalKB = Math.round(Object.values(sizes).reduce((a, b) => a + b, 0) / 1024);
      console.log(`[Scan] Payload: ${totalKB}KB → ${SERVER_URL}/api/analyze`);
      console.log(`[Scan] face=${Math.round(sizes.face/1024)}KB eye=${Math.round(sizes.eye/1024)}KB L=${Math.round(sizes.leftHand/1024)}KB R=${Math.round(sizes.rightHand/1024)}KB`);
      // Debug info logged to console only, not shown to user

      // Validate all images exist
      const missing = Object.entries(sizes).filter(([, v]) => v < 100).map(([k]) => k);
      if (missing.length > 0) {
        setError(`Missing photos: ${missing.join(', ')}. Go back and retake.`);
        return;
      }

      // Include user demographics (age, sex) for clinical analysis
      const profile = await getProfile();
      let userAge: number | undefined;
      let userSex: string | undefined;
      if (profile) {
        userSex = profile.sex;
        if (profile.dob) {
          const birthDate = new Date(profile.dob);
          const today = new Date();
          userAge = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            userAge--;
          }
        }
      }

      const result = await submitScan({
        faceImage: images.face,
        eyeImage: images.eye,
        leftHandImage: images.leftHand,
        rightHandImage: images.rightHand,
        questionnaire,
        userAge,
        userSex,
      });

      const scanData = {
        id: result.scanId,
        overallBalanceScore: result.overallBalanceScore,
        nutrientScores: result.nutrientScores,
        focusAreas: result.focusAreas,
        recommendations: result.recommendations,
        confidenceNote: result.confidenceNote,
        aiUsed: result.aiUsed ?? false,
        createdAt: new Date().toISOString(),
      };
      await addScanToCache(scanData);
      const session = await getSession();
      syncScanToServer(scanData, session?.phone || 'anonymous');
      rootNav.dispatch(CommonActions.reset({
        index: 1,
        routes: [
          { 
            name: 'Main', 
            state: {
              routes: [
                { name: 'Dashboard' },
                { name: 'Scan', state: { routes: [{ name: 'GuidedCamera' }], index: 0 } },
                { name: 'Stats' },
                { name: 'Profile' },
              ],
              index: 0
            }
          },
          { name: 'Results', params: { scanData } }
        ]
      }));
    } catch (err: any) {
      console.error('[Scan] Error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    }
  }

  const rotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const s = makeStyles(colors);

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.errorTitle}>Analysis Failed</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => { setError(''); run(); }} activeOpacity={0.8}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => rootNav.goBack()} style={{ marginTop: 16 }}>
            <Text style={s.goBack}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Animated.View style={[s.spinner, { transform: [{ rotate: rotation }] }]} />
        <Text style={s.title}>Analyzing</Text>
        <Text style={s.message}>{MESSAGES[msgIdx]}</Text>
        <Text style={s.hint}>{elapsed}s — usually 20–60 seconds</Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xxl },
  spinner: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: c.hairline, borderTopColor: c.brand, marginBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: c.text, letterSpacing: -0.3 },
  message: { fontSize: 15, color: c.textSecondary, marginTop: 8 },
  hint: { fontSize: 13, color: c.textQuaternary, marginTop: 32 },
  debugText: { fontSize: 11, color: c.textQuaternary, marginTop: 8 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 8 },
  errorText: { fontSize: 15, color: c.textSecondary, textAlign: 'center', marginBottom: 12, lineHeight: 22, maxWidth: 300 },
  retryBtn: { height: 48, paddingHorizontal: 32, borderRadius: RADIUS.md, backgroundColor: c.invertedBg, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  retryText: { fontSize: 15, fontWeight: '600', color: c.invertedText },
  goBack: { fontSize: 14, color: c.textSecondary },
});

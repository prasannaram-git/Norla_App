import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../../lib/theme';
import { verifyOTP, sendOTP, fetchScansFromServer } from '../../lib/api';
import { saveSession, saveProfile, getScans, saveScans } from '../../lib/storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export function OTPScreen({ navigation, route }: Props) {
  const { phone, devCode } = route.params;
  const { colors } = useTheme();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setCountdown((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleChange = (text: string, i: number) => {
    const d = [...digits];
    d[i] = text.replace(/\D/g, '').slice(-1);
    setDigits(d); setError('');
    if (text && i < 5) refs.current[i + 1]?.focus();
    if (d.every(v => v)) handleVerify(d.join(''));
  };

  const handleKey = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const otp = code || digits.join('');
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    try {
      const res = await verifyOTP(phone, otp);
      if (!res.sessionToken) throw new Error('Server error — please update the server and try again.');
      await saveSession(res.sessionToken, res.phone);
      try {
        const serverScans = await fetchScansFromServer(res.sessionToken);
        if (serverScans.length > 0) {
          const localScans = await getScans();
          const localIds = new Set(localScans.map(s => s.id));
          const newScans = serverScans.filter(s => !localIds.has(s.id));
          if (newScans.length > 0) {
            const merged = [...localScans, ...newScans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            await saveScans(merged);
          }
        }
      } catch {}
      if (res.profile?.name) {
        await saveProfile(res.profile);
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Main' }] });
      } else {
        navigation.navigate('Onboarding', { phone: res.phone });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid code');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    }
    setLoading(false);
  };

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={s.content}>
        <Text style={s.heading}>Verify your number</Text>
        <Text style={s.sub}>Enter the 6-digit code sent to{'\n'}<Text style={s.phone}>{phone}</Text></Text>
        {devCode ? (
          <View style={s.devBanner}><Text style={s.devText}>Dev code: {devCode}</Text></View>
        ) : null}
        <View style={s.otpRow}>
          {digits.map((d, i) => (
            <TextInput key={i} ref={r => { refs.current[i] = r; }}
              style={[s.otpBox, d ? s.otpFilled : null, error ? s.otpError : null]}
              value={d} onChangeText={t => handleChange(t, i)} onKeyPress={e => handleKey(e, i)}
              keyboardType="number-pad" maxLength={1} selectTextOnFocus autoFocus={i === 0} />
          ))}
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        {loading && <Text style={s.verifying}>Verifying...</Text>}
        <TouchableOpacity onPress={() => { if (countdown <= 0) { setCountdown(60); sendOTP(phone).catch(() => {}); } }}
          disabled={countdown > 0} style={s.resendBtn}>
          <Text style={[s.resend, countdown > 0 && s.resendDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: SPACING.xxl, paddingTop: 8, paddingBottom: 4 },
  backText: { fontSize: 15, fontWeight: '500', color: c.textSecondary },
  content: { flex: 1, paddingHorizontal: SPACING.xxl, paddingTop: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: c.textSecondary, marginTop: 8, lineHeight: 24, marginBottom: 32 },
  phone: { fontWeight: '600', color: c.text },
  devBanner: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: c.bgTertiary, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: c.border, marginBottom: 24, alignSelf: 'flex-start' },
  devText: { fontSize: 13, fontWeight: '600', color: c.warning },
  otpRow: { flexDirection: 'row', gap: 10 },
  otpBox: { flex: 1, height: 56, borderBottomWidth: 2, borderBottomColor: c.border, textAlign: 'center', fontSize: 24, fontWeight: '700', color: c.text },
  otpFilled: { borderBottomColor: c.text },
  otpError: { borderBottomColor: c.error },
  error: { fontSize: 13, color: c.error, marginTop: 16, textAlign: 'center' },
  verifying: { fontSize: 14, color: c.textTertiary, marginTop: 16, textAlign: 'center' },
  resendBtn: { marginTop: 28, alignSelf: 'center', paddingVertical: 8 },
  resend: { fontSize: 14, fontWeight: '500', color: c.text, textAlign: 'center' },
  resendDisabled: { color: c.textQuaternary },
});

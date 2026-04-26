import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../lib/theme';
import { verifyOTP, sendOTP, fetchScansFromServer } from '../../lib/api';
import { saveSession, saveProfile, getScans, saveScans } from '../../lib/storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export function OTPScreen({ navigation, route }: Props) {
  const { phone, devCode } = route.params;
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
    setDigits(d);
    setError('');
    if (text && i < 5) refs.current[i + 1]?.focus();
    if (d.every(v => v)) handleVerify(d.join(''));
  };

  const handleKey = (e: any, i: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async (code?: string) => {
    const otp = code || digits.join('');
    if (otp.length !== 6) return;
    if (loading) return;
    setLoading(true);
    try {
      const res = await verifyOTP(phone, otp);

      // Validate response — production server must return sessionToken
      if (!res.sessionToken) {
        throw new Error('Server error — please update the server and try again.');
      }

      await saveSession(res.sessionToken, res.phone);

      // Restore scan history from server (merge with local cache)
      try {
        const serverScans = await fetchScansFromServer(res.sessionToken);
        if (serverScans.length > 0) {
          const localScans = await getScans();
          const localIds = new Set(localScans.map(s => s.id));
          const newScans = serverScans.filter(s => !localIds.has(s.id));
          if (newScans.length > 0) {
            const merged = [...localScans, ...newScans]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            await saveScans(merged);
          }
        }
      } catch {} // Silently fail — doesn't block login

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

  // Format phone for display (show last 4 digits)
  const maskedPhone = phone.length > 4
    ? phone.slice(0, phone.length - 4).replace(/./g, '·') + phone.slice(-4)
    : phone;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <Text style={s.heading}>Verify your number</Text>
        <Text style={s.sub}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={s.phone}>{phone}</Text>
        </Text>

        {devCode ? (
          <View style={s.devBanner}>
            <Text style={s.devText}>Dev code: {devCode}</Text>
          </View>
        ) : null}

        <View style={s.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { refs.current[i] = r; }}
              style={[s.otpBox, d ? s.otpFilled : null, error ? s.otpError : null]}
              value={d}
              onChangeText={t => handleChange(t, i)}
              onKeyPress={e => handleKey(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        {loading && <Text style={s.verifying}>Verifying...</Text>}

        <TouchableOpacity
          onPress={() => {
            if (countdown <= 0) {
              setCountdown(60);
              sendOTP(phone).catch(() => {});
            }
          }}
          disabled={countdown > 0}
          style={s.resendBtn}
        >
          <Text style={[s.resend, countdown > 0 && s.resendDisabled]}>
            {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },

  header: { paddingHorizontal: SPACING.xxl, paddingTop: 8, paddingBottom: 4 },
  backText: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary },

  content: { flex: 1, paddingHorizontal: SPACING.xxl, paddingTop: 40 },

  heading: { fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: COLORS.textSecondary, marginTop: 8, lineHeight: 24, marginBottom: 32 },
  phone: { fontWeight: '600', color: COLORS.text },

  devBanner: {
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: '#FFF7ED', borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: '#FED7AA',
    marginBottom: 24, alignSelf: 'flex-start',
  },
  devText: { fontSize: 13, fontWeight: '600', color: '#C2410C' },

  otpRow: { flexDirection: 'row', gap: 10 },
  otpBox: {
    flex: 1, height: 56,
    borderBottomWidth: 2, borderBottomColor: COLORS.border,
    textAlign: 'center', fontSize: 24, fontWeight: '700', color: COLORS.text,
  },
  otpFilled: { borderBottomColor: COLORS.text },
  otpError: { borderBottomColor: COLORS.error },

  error: { fontSize: 13, color: COLORS.error, marginTop: 16, textAlign: 'center' },
  verifying: { fontSize: 14, color: COLORS.textTertiary, marginTop: 16, textAlign: 'center' },

  resendBtn: { marginTop: 28, alignSelf: 'center', paddingVertical: 8 },
  resend: { fontSize: 14, fontWeight: '500', color: COLORS.text, textAlign: 'center' },
  resendDisabled: { color: COLORS.textQuaternary },
});

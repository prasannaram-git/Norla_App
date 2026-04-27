import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Localization from 'expo-localization';
import { useTheme } from '../../lib/ThemeContext';
import { SPACING, RADIUS, type ColorPalette } from '../../lib/theme';
import { sendOTP } from '../../lib/api';
import { getCountryByCode, localeToCountryCode, type CountryCode } from '../../lib/country-codes';
import { CountryPicker } from '../../components/CountryPicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Phone'>;

export function PhoneScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [country, setCountry] = useState<CountryCode>(getCountryByCode('IN'));
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    try {
      const locales = Localization.getLocales();
      if (locales && locales.length > 0) {
        const regionCode = locales[0].regionCode;
        if (regionCode) setCountry(getCountryByCode(regionCode));
      }
    } catch {}
  }, []);

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) { setError('Enter a valid phone number'); return; }
    setError(''); setLoading(true);
    try {
      const formatted = `${country.dial}${digits}`;
      const res = await sendOTP(formatted);
      navigation.navigate('OTP', { phone: formatted, devCode: res.dev_code });
    } catch (err: any) { setError(err.message || 'Could not send code. Try again.'); }
    setLoading(false);
  };

  const minDigits = Math.min(country.maxLen, 6);
  const isValid = phone.replace(/\D/g, '').length >= minDigits;
  const s = makeStyles(colors);
  const logoSource = isDark ? require('../../../assets/norla-full-logo-white.png') : require('../../../assets/norla-full-logo.png');

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.content}>
          <Image source={logoSource} style={s.logo} resizeMode="contain" />
          <Text style={s.heading}>Enter your number</Text>
          <Text style={s.sub}>We'll send a verification code to your WhatsApp.</Text>
          <View style={s.row}>
            <TouchableOpacity style={s.countryBtn} onPress={() => setPickerVisible(true)} activeOpacity={0.7}>
              <Text style={s.countryCode}>{country.code}</Text>
              <Text style={s.countryDial}>{country.dial}</Text>
              <Text style={s.chevron}>▾</Text>
            </TouchableOpacity>
            <TextInput style={s.input} placeholder="Phone number" placeholderTextColor={colors.textQuaternary}
              keyboardType="phone-pad" maxLength={country.maxLen} value={phone}
              onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); setError(''); }} autoFocus />
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          <TouchableOpacity style={[s.btn, !isValid && s.btnOff]} onPress={handleSend} disabled={loading || !isValid} activeOpacity={0.8}>
            <Text style={s.btnText}>{loading ? 'Sending...' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('PrivacyPolicy')}>
          <Text style={s.footer}>By continuing you agree to our Terms and Privacy Policy</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <CountryPicker visible={pickerVisible} selected={country} onSelect={setCountry} onClose={() => setPickerVisible(false)} />
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  logo: { width: 140, height: 27, alignSelf: 'flex-start', marginBottom: 40 },
  heading: { fontSize: 28, fontWeight: '700', color: c.text, letterSpacing: -0.6 },
  sub: { fontSize: 15, color: c.textSecondary, marginTop: 8, marginBottom: 32, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 52, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  countryCode: { fontSize: 13, fontWeight: '600', color: c.textTertiary },
  countryDial: { fontSize: 16, fontWeight: '600', color: c.text },
  chevron: { fontSize: 11, color: c.textTertiary, marginLeft: 2 },
  input: { flex: 1, height: 52, borderBottomWidth: 1, borderBottomColor: c.border, fontSize: 18, fontWeight: '500', color: c.text, letterSpacing: 0.5 },
  error: { fontSize: 13, color: c.error, marginBottom: 16 },
  btn: { height: 52, borderRadius: RADIUS.md, backgroundColor: c.invertedBg, justifyContent: 'center', alignItems: 'center' },
  btnOff: { opacity: 0.15 },
  btnText: { fontSize: 16, fontWeight: '600', color: c.invertedText },
  footer: { fontSize: 12, color: c.textQuaternary, textAlign: 'center', paddingBottom: 16, paddingHorizontal: SPACING.xxl },
});

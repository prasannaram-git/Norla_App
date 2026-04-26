import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeContext';
import { SPACING, type ColorPalette } from '../lib/theme';

export function PrivacyPolicyScreen() {
  const nav = useNavigation();
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={s.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdated}>Last updated: April 25, 2026</Text>

        <Text style={s.sectionTitle}>1. Information We Collect</Text>
        <Text style={s.body}>
          Norla collects the following information to provide nutrition analysis services:{'\n\n'}
          - Phone number (for authentication via WhatsApp OTP){'\n'}
          - Name, date of birth, and sex (for personalized analysis){'\n'}
          - Photos of your face, eyes, and hands (for AI-powered nutrition analysis){'\n'}
          - Questionnaire responses about your diet and lifestyle
        </Text>

        <Text style={s.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={s.body}>
          Your information is used exclusively for:{'\n\n'}
          - Authenticating your identity{'\n'}
          - Performing AI-powered nutrition analysis{'\n'}
          - Generating personalized nutrition scores and recommendations{'\n'}
          - Tracking your nutrition progress over time
        </Text>

        <Text style={s.sectionTitle}>3. Photo Processing</Text>
        <Text style={s.body}>
          Photos you capture are processed in real-time by Google Gemini AI for nutritional biomarker analysis. Photos are transmitted securely, analyzed, and then discarded from our servers. We do not permanently store your photos on our servers.
        </Text>

        <Text style={s.sectionTitle}>4. Third-Party Services</Text>
        <Text style={s.body}>
          We use the following third-party services:{'\n\n'}
          - Google Gemini AI: For image-based nutrition analysis. Photos are processed per Google's AI data processing terms.{'\n'}
          - WhatsApp Business API: For sending OTP verification codes.{'\n'}
          - Supabase: For secure data storage and user authentication.
        </Text>

        <Text style={s.sectionTitle}>5. Data Storage & Retention</Text>
        <Text style={s.body}>
          Your profile information (name, DOB, sex) and scan results (scores, recommendations) are stored securely to provide history and progress tracking. Photos are NOT stored permanently. You can delete all your data at any time through the Profile screen.
        </Text>

        <Text style={s.sectionTitle}>6. Data Security</Text>
        <Text style={s.body}>
          We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), secure token-based authentication, and access-controlled data storage. No API keys or sensitive credentials are stored on your device.
        </Text>

        <Text style={s.sectionTitle}>7. Your Rights</Text>
        <Text style={s.body}>
          You have the right to:{'\n\n'}
          - Access your personal data{'\n'}
          - Request deletion of your account and all associated data{'\n'}
          - Opt out of the service at any time{'\n\n'}
          To delete your account, go to Profile and tap "Delete Account". This permanently removes all your data from our systems.
        </Text>

        <Text style={s.sectionTitle}>8. Children's Privacy</Text>
        <Text style={s.body}>
          Norla is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
        </Text>

        <Text style={s.sectionTitle}>9. Changes to This Policy</Text>
        <Text style={s.body}>
          We may update this privacy policy from time to time. Any changes will be reflected in the app with an updated "Last updated" date. Continued use of Norla after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={s.sectionTitle}>10. Contact Us</Text>
        <Text style={s.body}>
          If you have questions about this privacy policy or your data, contact us at:{'\n\n'}
          Email: support@trynorla.com{'\n'}
          Website: trynorla.com (coming soon)
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ColorPalette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xxl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.hairline },
  backBtn: { fontSize: 16, fontWeight: '500', color: c.text },
  headerTitle: { fontSize: 17, fontWeight: '600', color: c.text },
  content: { paddingHorizontal: SPACING.xxl, paddingTop: 20 },
  lastUpdated: { fontSize: 13, color: c.textTertiary, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: c.text, marginTop: 24, marginBottom: 8 },
  body: { fontSize: 14, color: c.textSecondary, lineHeight: 22 },
});

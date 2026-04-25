import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CommonActions } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { getProfile, clearSession, type UserProfile } from '../lib/storage';
import { deleteAccount } from '../lib/api';
import { APP_VERSION } from '../lib/constants';

export function ProfileScreen() {
  const nav = useNavigation<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useFocusEffect(useCallback(() => { getProfile().then(setProfile); }, []));

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await clearSession();
        nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      }},
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Account', 'This permanently deletes all data. Cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteAccount(); } catch {}
        await clearSession();
        nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
      }},
    ]);
  };

  const rows = [
    { label: 'Phone', value: profile?.phone || '--' },
    { label: 'Date of Birth', value: profile?.dob || '--' },
    { label: 'Sex', value: profile?.sex ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1) : '--' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Profile</Text>

        {/* Name */}
        <View style={s.nameSection}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={s.name}>{profile?.name || 'User'}</Text>
        </View>

        {/* Info rows */}
        <View style={s.infoCard}>
          {rows.map((row, i) => (
            <View key={row.label} style={[s.infoRow, i < rows.length - 1 && s.rowBorder]}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.gap} />

        {/* Actions */}
        <TouchableOpacity style={s.actionRow} onPress={handleLogout} activeOpacity={0.6}>
          <Text style={s.actionText}>Sign Out</Text>
        </TouchableOpacity>
        <View style={s.rowBorderFull} />
        <TouchableOpacity style={s.actionRow} onPress={handleDelete} activeOpacity={0.6}>
          <Text style={[s.actionText, { color: COLORS.error }]}>Delete Account</Text>
        </TouchableOpacity>
        <View style={s.rowBorderFull} />
        <TouchableOpacity style={s.actionRow} onPress={() => nav.navigate('PrivacyPolicy' as any)} activeOpacity={0.6}>
          <Text style={[s.actionText, { color: COLORS.textTertiary }]}>Privacy Policy</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <Image source={require('../../assets/norla-full-logo.png')} style={s.footerLogo} resizeMode="contain" />
          <Text style={s.footerText}>Norla provides AI-generated predictions for wellness awareness only. Not a medical device.</Text>
          <Text style={s.version}>Version {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 40 },
  heading: { fontSize: 32, fontWeight: '700', color: COLORS.text, letterSpacing: -0.8, marginTop: 8, marginBottom: 28 },

  nameSection: { alignItems: 'center', paddingBottom: 28, marginBottom: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarLetter: { fontSize: 30, fontWeight: '600', color: COLORS.white },
  name: { fontSize: 20, fontWeight: '600', color: COLORS.text },

  infoCard: { backgroundColor: COLORS.bgSecondary, borderRadius: RADIUS.md, paddingHorizontal: 16, marginBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.hairline },
  infoLabel: { fontSize: 15, color: COLORS.textSecondary },
  infoValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  gap: { height: 32 },

  actionRow: { paddingVertical: 16 },
  actionText: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  rowBorderFull: { height: 1, backgroundColor: COLORS.hairline },

  footer: { alignItems: 'center', marginTop: 48 },
  footerLogo: { width: 110, height: 32, marginBottom: 14, opacity: 0.45 },
  footerText: { fontSize: 12, color: COLORS.textQuaternary, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  version: { fontSize: 12, color: COLORS.textQuaternary, marginTop: 8 },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../lib/theme';
import { IMAGE_STEPS } from '../../lib/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ScanStackParamList, 'PhotoReview'>;

export function PhotoReviewScreen({ navigation, route }: Props) {
  const { images } = route.params;
  const allCaptured = IMAGE_STEPS.every(s => !!images[s.key]);
  const capturedCount = IMAGE_STEPS.filter(s => !!images[s.key]).length;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.heading}>Review Photos</Text>
        <Text style={s.sub}>
          {capturedCount}/{IMAGE_STEPS.length} captured. Tap any photo to retake.
        </Text>

        <View style={s.grid}>
          {IMAGE_STEPS.map((step, i) => (
            <TouchableOpacity
              key={step.key}
              style={s.photoCard}
              activeOpacity={0.7}
              onPress={() => navigation.replace('GuidedCamera', { step: i, images })}
            >
              {images[step.key] ? (
                <Image source={{ uri: images[step.key] }} style={s.photoImg} />
              ) : (
                <View style={s.photoEmpty}>
                  <Text style={s.emptyText}>Tap to capture</Text>
                </View>
              )}
              <View style={s.photoLabel}>
                <Text style={s.labelText}>{step.label}</Text>
                {images[step.key] ? (
                  <View style={s.checkDot} />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom pinned buttons */}
      <View style={s.bottomBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, !allCaptured && s.btnOff]}
          onPress={() => allCaptured && navigation.navigate('Questionnaire', { images })}
          disabled={!allCaptured}
          activeOpacity={0.8}
        >
          <Text style={s.btnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { paddingHorizontal: SPACING.xxl, paddingBottom: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: COLORS.text, letterSpacing: -0.6, marginTop: 12 },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6, marginBottom: 24, lineHeight: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoCard: { width: '47%', aspectRatio: 0.85, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: COLORS.bgSecondary },
  photoImg: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 12, color: COLORS.textTertiary },
  photoLabel: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  labelText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.hairline,
    backgroundColor: COLORS.white,
  },
  backBtn: { paddingVertical: 14, paddingHorizontal: 16 },
  backText: { fontSize: 15, fontWeight: '500', color: COLORS.textSecondary },
  btn: { flex: 1, height: 52, borderRadius: RADIUS.md, backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center' },
  btnOff: { opacity: 0.15 },
  btnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});

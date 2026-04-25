import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, TextInput,
  StyleSheet, Linking, Platform, Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { markRatingShown } from '../lib/rating';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function StarIcon({ filled, size = 32 }: { filled: boolean; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={filled ? '#F59E0B' : 'none'}
        stroke={filled ? '#F59E0B' : COLORS.border}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RatingModal({ visible, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    await markRatingShown();

    if (rating >= 4) {
      // High rating — redirect to Play Store
      const storeUrl = Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.norla.app'
        : 'https://apps.apple.com/app/norla/id0000000000';
      try { await Linking.openURL(storeUrl); } catch { /* ignore */ }
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setFeedback('');
      onClose();
    }, 1500);
  };

  const handleDismiss = async () => {
    await markRatingShown();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.backdrop}>
        <View style={s.card}>
          {submitted ? (
            <View style={s.thankYou}>
              <Text style={s.thankTitle}>Thank you!</Text>
              <Text style={s.thankSub}>Your feedback helps us improve Norla.</Text>
            </View>
          ) : (
            <>
              <Text style={s.title}>Enjoying Norla?</Text>
              <Text style={s.subtitle}>Your feedback helps us improve</Text>

              {/* Stars */}
              <View style={s.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <StarIcon filled={star <= rating} size={36} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback input (shows after rating) */}
              {rating > 0 && rating < 4 && (
                <TextInput
                  style={s.feedbackInput}
                  placeholder="Tell us how we can improve..."
                  placeholderTextColor={COLORS.textQuaternary}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  value={feedback}
                  onChangeText={setFeedback}
                  textAlignVertical="top"
                />
              )}

              {rating > 0 && (
                <TouchableOpacity style={s.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
                  <Text style={s.submitText}>
                    {rating >= 4 ? 'Rate on Play Store' : 'Submit Feedback'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleDismiss} style={s.dismissBtn}>
                <Text style={s.dismissText}>Not Now</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  card: {
    width: '85%', maxWidth: 340,
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    paddingVertical: 32, paddingHorizontal: 28,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: COLORS.textTertiary, marginTop: 6, marginBottom: 24 },

  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },

  feedbackInput: {
    width: '100%', minHeight: 80, maxHeight: 120,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: COLORS.text, lineHeight: 20,
    marginBottom: 16,
  },

  submitBtn: {
    width: '100%', height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  submitText: { fontSize: 15, fontWeight: '600', color: COLORS.white },

  dismissBtn: { paddingVertical: 8 },
  dismissText: { fontSize: 14, color: COLORS.textTertiary, fontWeight: '500' },

  thankYou: { alignItems: 'center', paddingVertical: 20 },
  thankTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  thankSub: { fontSize: 14, color: COLORS.textTertiary, marginTop: 8, textAlign: 'center' },
});

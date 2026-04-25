import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Ellipse, Rect, Path, G } from 'react-native-svg';
import { COLORS, RADIUS } from '../../lib/theme';
import { IMAGE_STEPS, type OverlayType } from '../../lib/constants';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '../../navigation/MainTabs';

type Props = NativeStackScreenProps<ScanStackParamList, 'GuidedCamera'>;

const { width: W } = Dimensions.get('window');
const VIEWFINDER = Math.min(W - 48, 360);
const S = 'rgba(255,255,255,0.55)'; // stroke color
const SW = 1.8; // stroke width
const SD = '7,5'; // dash array

// ── SVG Overlays ──
function CameraOverlay({ type }: { type: OverlayType }) {
  const sz = VIEWFINDER;
  const cx = sz / 2;
  const cy = sz / 2;

  return (
    <Svg width={sz} height={sz} style={StyleSheet.absoluteFill}>
      {/* ── FACE: oval head guide ── */}
      {type === 'face' && (
        <Ellipse cx={cx} cy={cy - 8} rx={cx * 0.48} ry={cy * 0.65}
          stroke={S} strokeWidth={SW} fill="none" strokeDasharray={SD} />
      )}

      {/* ── EYES: two almond-shaped eyes with iris circles ── */}
      {type === 'eye' && (
        <G>
          {/* Left eye */}
          <Ellipse cx={cx - sz * 0.17} cy={cy} rx={sz * 0.13} ry={sz * 0.06}
            stroke={S} strokeWidth={SW} fill="none" strokeDasharray={SD} />
          <Ellipse cx={cx - sz * 0.17} cy={cy} rx={sz * 0.04} ry={sz * 0.04}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} fill="none" />

          {/* Right eye */}
          <Ellipse cx={cx + sz * 0.17} cy={cy} rx={sz * 0.13} ry={sz * 0.06}
            stroke={S} strokeWidth={SW} fill="none" strokeDasharray={SD} />
          <Ellipse cx={cx + sz * 0.17} cy={cy} rx={sz * 0.04} ry={sz * 0.04}
            stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} fill="none" />

          {/* Nose bridge hint */}
          <Path d={`M ${cx - sz * 0.03} ${cy - sz * 0.02} Q ${cx} ${cy + sz * 0.04} ${cx + sz * 0.03} ${cy - sz * 0.02}`}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1} fill="none" />
        </G>
      )}

      {/* ── HAND: realistic hand outline with 5 fingers + nail tips ── */}
      {(type === 'leftHand' || type === 'rightHand') && (() => {
        const flip = type === 'rightHand';
        const sc = sz / 360; // scale factor
        // Hand path: palm + 5 fingers, designed at 360px, centered
        // Coordinates: thumb on left, pinky on right (left hand view)
        const handPath = `
          M ${108 * sc} ${310 * sc}
          Q ${80 * sc} ${280 * sc} ${60 * sc} ${230 * sc}
          L ${48 * sc} ${190 * sc}
          Q ${40 * sc} ${170 * sc} ${50 * sc} ${155 * sc}
          Q ${60 * sc} ${145 * sc} ${70 * sc} ${160 * sc}
          L ${85 * sc} ${200 * sc}
          L ${85 * sc} ${150 * sc}
          L ${80 * sc} ${90 * sc}
          Q ${78 * sc} ${70 * sc} ${90 * sc} ${65 * sc}
          Q ${102 * sc} ${62 * sc} ${105 * sc} ${80 * sc}
          L ${110 * sc} ${145 * sc}
          L ${115 * sc} ${75 * sc}
          L ${112 * sc} ${48 * sc}
          Q ${112 * sc} ${28 * sc} ${125 * sc} ${25 * sc}
          Q ${138 * sc} ${22 * sc} ${140 * sc} ${42 * sc}
          L ${142 * sc} ${75 * sc}
          L ${140 * sc} ${140 * sc}
          L ${148 * sc} ${80 * sc}
          L ${152 * sc} ${50 * sc}
          Q ${153 * sc} ${32 * sc} ${165 * sc} ${30 * sc}
          Q ${177 * sc} ${28 * sc} ${178 * sc} ${48 * sc}
          L ${175 * sc} ${80 * sc}
          L ${170 * sc} ${145 * sc}
          L ${178 * sc} ${100 * sc}
          L ${182 * sc} ${72 * sc}
          Q ${184 * sc} ${55 * sc} ${195 * sc} ${55 * sc}
          Q ${207 * sc} ${55 * sc} ${208 * sc} ${72 * sc}
          L ${205 * sc} ${100 * sc}
          L ${195 * sc} ${160 * sc}
          L ${200 * sc} ${115 * sc}
          L ${207 * sc} ${90 * sc}
          Q ${210 * sc} ${75 * sc} ${222 * sc} ${78 * sc}
          Q ${232 * sc} ${82 * sc} ${230 * sc} ${98 * sc}
          L ${222 * sc} ${130 * sc}
          L ${210 * sc} ${180 * sc}
          Q ${215 * sc} ${250 * sc} ${210 * sc} ${290 * sc}
          Q ${200 * sc} ${320 * sc} ${180 * sc} ${330 * sc}
          L ${108 * sc} ${330 * sc}
          Z
        `;

        // Nail tip positions (top of each finger)
        const nailTips = [
          { x: 92, y: 62, w: 22, h: 14 },   // index
          { x: 123, y: 22, w: 22, h: 14 },   // middle
          { x: 155, y: 27, w: 22, h: 14 },   // ring
          { x: 185, y: 52, w: 22, h: 14 },   // pinky area
          { x: 215, y: 75, w: 18, h: 12 },   // thumb
        ];

        return (
          <G transform={flip ? `translate(${sz}, 0) scale(-1, 1)` : undefined}>
            <Path d={handPath} stroke={S} strokeWidth={SW} fill="none" strokeDasharray={SD} />
            {nailTips.map((n, i) => (
              <Rect key={i}
                x={n.x * sc} y={n.y * sc} width={n.w * sc} height={n.h * sc}
                rx={4 * sc}
                stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} fill="none"
              />
            ))}
          </G>
        );
      })()}
    </Svg>
  );
}

export function GuidedCameraScreen({ navigation, route }: Props) {
  const { step: initialStep = 0, images: existingImages = {} } = route.params || {};
  const [step, setStep] = useState(initialStep);
  const [images, setImages] = useState<Record<string, string>>(existingImages);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [facingOverride, setFacingOverride] = useState<'front' | 'back' | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const current = IMAGE_STEPS[step];
  const total = IMAGE_STEPS.length;
  const defaultFacing = current?.useFrontCamera ? 'front' : 'back';
  const facing = facingOverride || defaultFacing;

  const toggleFacing = () => {
    setCameraReady(false);
    setFacingOverride(facing === 'front' ? 'back' : 'front');
  };

  // Reset camera ready state and facing override when step changes
  useEffect(() => {
    setCameraReady(false);
    setFacingOverride(null);
  }, [step]);

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.15, // Low quality — 4 images × base64 must stay small for fast AI
      });
      if (photo?.base64) {
        setPreview(`data:image/jpeg;base64,${photo.base64}`);
      } else {
        Alert.alert('Capture failed', 'No image data returned. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Capture failed', e.message || 'Please try again');
    }
    setCapturing(false);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true, quality: 0.15, allowsEditing: true, aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setPreview(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const acceptPhoto = () => {
    if (!preview) return;
    const updated = { ...images, [current.key]: preview };
    setImages(updated);
    setPreview(null);

    // If this was a single-photo retake from the review screen,
    // go straight back to review instead of advancing to next step.
    // Detection: if we started at a non-zero step, OR if the image we just
    // replaced already existed (meaning user had it and is retaking).
    const isRetake = initialStep > 0 || !!existingImages[current.key];

    if (isRetake) {
      // Return to review with the updated images
      navigation.replace('PhotoReview', { images: updated });
    } else if (step < total - 1) {
      // Normal flow — move to next step
      setStep(step + 1);
    } else {
      // All photos captured — go to review
      navigation.replace('PhotoReview', { images: updated });
    }
  };

  // ── Permission screen ──
  if (!permission?.granted) {
    return (
      <View style={s.permScreen}>
        <Text style={s.permTitle}>Camera Access</Text>
        <Text style={s.permText}>
          Norla needs camera access to analyze your nutrition markers from photos of your face, eyes, and hands.
        </Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={s.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.permSkip}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Preview/confirm screen ──
  if (preview) {
    return (
      <View style={s.container}>
        <Image source={{ uri: preview }} style={s.previewFull} resizeMode="cover" />
        <View style={s.previewOverlay}>
          <Text style={s.previewLabel}>{current.label}</Text>
          <Text style={s.previewHint}>Does this look clear and well-lit?</Text>
          <View style={s.previewActions}>
            <TouchableOpacity style={s.retakeBtn} onPress={() => setPreview(null)} activeOpacity={0.8}>
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.useBtn} onPress={acceptPhoto} activeOpacity={0.8}>
              <Text style={s.useText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Camera screen ──
  return (
    <View style={s.container}>
      {/* Top bar */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={s.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{step + 1} / {total}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Camera viewfinder */}
      <View style={s.cameraWrap}>
        {/*
          KEY PROP forces full CameraView remount when step changes.
          This prevents the blank-screen crash caused by changing
          `facing` on an already-mounted CameraView.
        */}
        <CameraView
          key={`cam-${step}-${facing}`}
          ref={cameraRef}
          style={s.camera}
          facing={facing}
          onCameraReady={() => setCameraReady(true)}
        />

        {/* Loading while camera initializes */}
        {!cameraReady && (
          <View style={s.cameraLoading}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={s.loadingText}>Starting camera...</Text>
          </View>
        )}

        {/* Guide overlay */}
        <View style={s.overlayWrap} pointerEvents="none">
          <CameraOverlay type={current.overlay} />
        </View>
      </View>

      {/* Bottom controls */}
      <View style={s.bottom}>
        <Text style={s.stepLabel}>{current.label}</Text>
        <Text style={s.stepDesc}>{current.description}</Text>

        {/* Progress dots */}
        <View style={s.dots}>
          {IMAGE_STEPS.map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive, images[IMAGE_STEPS[i].key] && s.dotDone]} />
          ))}
        </View>

        {/* Capture row */}
        <View style={s.captureRow}>
          <TouchableOpacity onPress={pickFromGallery} activeOpacity={0.7} style={s.sideBtn}>
            <Text style={s.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.captureBtn, (!cameraReady || capturing) && { opacity: 0.4 }]}
            onPress={capture}
            disabled={!cameraReady || capturing}
            activeOpacity={0.85}
          >
            <View style={s.captureInner} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleFacing} activeOpacity={0.7} style={s.sideBtn}>
            <Text style={s.galleryText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission
  permScreen: { flex: 1, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  permTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  permText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn: { height: 52, width: '100%', borderRadius: RADIUS.md, backgroundColor: COLORS.text, justifyContent: 'center', alignItems: 'center' },
  permBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  permSkip: { fontSize: 14, color: COLORS.textSecondary, marginTop: 16 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: '#000',
  },
  closeBtn: { fontSize: 22, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },

  // Camera
  cameraWrap: {
    width: VIEWFINDER, height: VIEWFINDER,
    alignSelf: 'center', borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#111',
  },
  camera: { width: '100%', height: '100%' },
  cameraLoading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#111',
  },
  loadingText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  overlayWrap: { ...StyleSheet.absoluteFillObject },

  // Bottom
  bottom: { flex: 1, paddingHorizontal: 24, paddingTop: 20, justifyContent: 'space-between', paddingBottom: 36 },
  stepLabel: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  stepDesc: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { backgroundColor: '#fff', width: 24, borderRadius: 4 },
  dotDone: { backgroundColor: 'rgba(255,255,255,0.5)' },

  captureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sideBtn: { width: 60, alignItems: 'center' },
  galleryText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  flipText: { fontSize: 24, color: 'rgba(255,255,255,0.8)' },
  flipLabel: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },

  // Preview
  previewFull: { flex: 1, width: '100%' },
  previewOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 48, paddingTop: 24,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  previewLabel: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  previewHint: { fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  previewActions: { flexDirection: 'row', gap: 12 },
  retakeBtn: {
    flex: 1, height: 48, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  retakeText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  useBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  useText: { fontSize: 15, fontWeight: '600', color: '#000' },
});

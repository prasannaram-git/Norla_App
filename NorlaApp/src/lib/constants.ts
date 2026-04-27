// Server URL — auto-detect local server in dev, production in release
import Constants from 'expo-constants';

function getServerUrl(): string {
  if (__DEV__) {
    // Use production server even in dev — WhatsApp OTP only works on production
    // To use local server for testing, uncomment the lines below:
    // const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    // if (debuggerHost) return `http://${debuggerHost}:3000`;
    // return 'http://10.81.190.191:3000';
    return 'https://norla-server.onrender.com';
  }
  return 'https://norla-server.onrender.com';
}

export const SERVER_URL = getServerUrl();

// ── App Constants ──
export const APP_VERSION = '1.0.0';
export const APP_VERSION_CODE = 1;
export const SUPPORT_EMAIL = 'support@trynorla.com';
export const PRIVACY_POLICY_URL = 'https://norla-server.onrender.com/privacy';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.norla.app';

// ── Nutrient Config — keys MUST match scoring engine output (ironSupport, etc.) ──
export const NUTRIENT_CONFIG: Record<string, { label: string; color: string }> = {
  ironSupport:        { label: 'Iron',        color: '#059669' },
  vitaminB12Support:  { label: 'Vitamin B12', color: '#6366F1' },
  vitaminDSupport:    { label: 'Vitamin D',   color: '#D97706' },
  vitaminASupport:    { label: 'Vitamin A',   color: '#F59E0B' },
  folateSupport:      { label: 'Folate',      color: '#10B981' },
  zincSupport:        { label: 'Zinc',        color: '#64748B' },
  proteinSupport:     { label: 'Protein',     color: '#0EA5E9' },
  hydrationSupport:   { label: 'Hydration',   color: '#2563EB' },
  vitaminCSupport:    { label: 'Vitamin C',   color: '#F97316' },
  omega3Support:      { label: 'Omega-3',     color: '#0891B2' },
  dietQualitySupport: { label: 'Diet Quality',color: '#8B5CF6' },
};

// ── Camera Scan Steps ──
export type OverlayType = 'face' | 'eye' | 'leftHand' | 'rightHand';

export const IMAGE_STEPS: {
  key: string;
  label: string;
  description: string;
  overlay: OverlayType;
  tips: string[];
  useFrontCamera?: boolean;
}[] = [
  {
    key: 'face',
    label: 'Face',
    description: 'Position your face within the guide',
    overlay: 'face',
    useFrontCamera: true,
    tips: [
      'Natural lighting — face a window',
      'Remove glasses and accessories',
      'Look directly at the camera',
      'No filters or heavy makeup',
    ],
  },
  {
    key: 'eye',
    label: 'Eyes Close-up',
    description: 'Align both eyes within the guides',
    overlay: 'eye',
    useFrontCamera: true,
    tips: [
      'Open both eyes wide',
      'Good lighting so sclera (white) is visible',
      'Hold steady and keep focus sharp',
      'Avoid flash',
    ],
  },
  {
    key: 'leftHand',
    label: 'Left Hand',
    description: 'Show front of left hand with nails visible',
    overlay: 'leftHand',
    useFrontCamera: false,
    tips: [
      'Spread fingers naturally',
      'Show nail beds clearly — palm facing camera',
      'Use natural light',
      'Keep hand steady',
    ],
  },
  {
    key: 'rightHand',
    label: 'Right Hand',
    description: 'Show front of right hand with nails visible',
    overlay: 'rightHand',
    useFrontCamera: false,
    tips: [
      'Spread fingers naturally',
      'Show nail beds clearly — palm facing camera',
      'Use natural light',
      'Keep hand steady',
    ],
  },
];

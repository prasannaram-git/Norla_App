export interface CountryCode {
  code: string;   // ISO 3166-1 alpha-2
  dial: string;   // e.g. '+91'
  name: string;
  flag: string;   // emoji flag
  maxLen: number; // max digits after dial code
}

// Popular countries first, then alphabetical
export const COUNTRY_CODES: CountryCode[] = [
  // ── Popular (pinned at top) ──
  { code: 'IN', dial: '+91', name: 'India', flag: '🇮🇳', maxLen: 10 },
  { code: 'US', dial: '+1', name: 'United States', flag: '🇺🇸', maxLen: 10 },
  { code: 'GB', dial: '+44', name: 'United Kingdom', flag: '🇬🇧', maxLen: 10 },
  { code: 'AE', dial: '+971', name: 'United Arab Emirates', flag: '🇦🇪', maxLen: 9 },
  { code: 'CA', dial: '+1', name: 'Canada', flag: '🇨🇦', maxLen: 10 },
  { code: 'AU', dial: '+61', name: 'Australia', flag: '🇦🇺', maxLen: 9 },
  { code: 'SG', dial: '+65', name: 'Singapore', flag: '🇸🇬', maxLen: 8 },
  { code: 'DE', dial: '+49', name: 'Germany', flag: '🇩🇪', maxLen: 11 },
  { code: 'FR', dial: '+33', name: 'France', flag: '🇫🇷', maxLen: 9 },
  { code: 'SA', dial: '+966', name: 'Saudi Arabia', flag: '🇸🇦', maxLen: 9 },

  // ── A ──
  { code: 'AF', dial: '+93', name: 'Afghanistan', flag: '🇦🇫', maxLen: 9 },
  { code: 'AL', dial: '+355', name: 'Albania', flag: '🇦🇱', maxLen: 9 },
  { code: 'DZ', dial: '+213', name: 'Algeria', flag: '🇩🇿', maxLen: 9 },
  { code: 'AR', dial: '+54', name: 'Argentina', flag: '🇦🇷', maxLen: 10 },
  { code: 'AM', dial: '+374', name: 'Armenia', flag: '🇦🇲', maxLen: 8 },
  { code: 'AT', dial: '+43', name: 'Austria', flag: '🇦🇹', maxLen: 10 },
  { code: 'AZ', dial: '+994', name: 'Azerbaijan', flag: '🇦🇿', maxLen: 9 },

  // ── B ──
  { code: 'BH', dial: '+973', name: 'Bahrain', flag: '🇧🇭', maxLen: 8 },
  { code: 'BD', dial: '+880', name: 'Bangladesh', flag: '🇧🇩', maxLen: 10 },
  { code: 'BY', dial: '+375', name: 'Belarus', flag: '🇧🇾', maxLen: 10 },
  { code: 'BE', dial: '+32', name: 'Belgium', flag: '🇧🇪', maxLen: 9 },
  { code: 'BZ', dial: '+501', name: 'Belize', flag: '🇧🇿', maxLen: 7 },
  { code: 'BJ', dial: '+229', name: 'Benin', flag: '🇧🇯', maxLen: 8 },
  { code: 'BT', dial: '+975', name: 'Bhutan', flag: '🇧🇹', maxLen: 8 },
  { code: 'BO', dial: '+591', name: 'Bolivia', flag: '🇧🇴', maxLen: 8 },
  { code: 'BA', dial: '+387', name: 'Bosnia & Herzegovina', flag: '🇧🇦', maxLen: 8 },
  { code: 'BW', dial: '+267', name: 'Botswana', flag: '🇧🇼', maxLen: 8 },
  { code: 'BR', dial: '+55', name: 'Brazil', flag: '🇧🇷', maxLen: 11 },
  { code: 'BN', dial: '+673', name: 'Brunei', flag: '🇧🇳', maxLen: 7 },
  { code: 'BG', dial: '+359', name: 'Bulgaria', flag: '🇧🇬', maxLen: 9 },

  // ── C ──
  { code: 'KH', dial: '+855', name: 'Cambodia', flag: '🇰🇭', maxLen: 9 },
  { code: 'CM', dial: '+237', name: 'Cameroon', flag: '🇨🇲', maxLen: 9 },
  { code: 'CL', dial: '+56', name: 'Chile', flag: '🇨🇱', maxLen: 9 },
  { code: 'CN', dial: '+86', name: 'China', flag: '🇨🇳', maxLen: 11 },
  { code: 'CO', dial: '+57', name: 'Colombia', flag: '🇨🇴', maxLen: 10 },
  { code: 'CR', dial: '+506', name: 'Costa Rica', flag: '🇨🇷', maxLen: 8 },
  { code: 'HR', dial: '+385', name: 'Croatia', flag: '🇭🇷', maxLen: 9 },
  { code: 'CU', dial: '+53', name: 'Cuba', flag: '🇨🇺', maxLen: 8 },
  { code: 'CY', dial: '+357', name: 'Cyprus', flag: '🇨🇾', maxLen: 8 },
  { code: 'CZ', dial: '+420', name: 'Czech Republic', flag: '🇨🇿', maxLen: 9 },

  // ── D ──
  { code: 'DK', dial: '+45', name: 'Denmark', flag: '🇩🇰', maxLen: 8 },
  { code: 'DO', dial: '+1', name: 'Dominican Republic', flag: '🇩🇴', maxLen: 10 },

  // ── E ──
  { code: 'EC', dial: '+593', name: 'Ecuador', flag: '🇪🇨', maxLen: 9 },
  { code: 'EG', dial: '+20', name: 'Egypt', flag: '🇪🇬', maxLen: 10 },
  { code: 'SV', dial: '+503', name: 'El Salvador', flag: '🇸🇻', maxLen: 8 },
  { code: 'EE', dial: '+372', name: 'Estonia', flag: '🇪🇪', maxLen: 8 },
  { code: 'ET', dial: '+251', name: 'Ethiopia', flag: '🇪🇹', maxLen: 9 },

  // ── F ──
  { code: 'FI', dial: '+358', name: 'Finland', flag: '🇫🇮', maxLen: 10 },
  { code: 'FJ', dial: '+679', name: 'Fiji', flag: '🇫🇯', maxLen: 7 },

  // ── G ──
  { code: 'GE', dial: '+995', name: 'Georgia', flag: '🇬🇪', maxLen: 9 },
  { code: 'GH', dial: '+233', name: 'Ghana', flag: '🇬🇭', maxLen: 9 },
  { code: 'GR', dial: '+30', name: 'Greece', flag: '🇬🇷', maxLen: 10 },
  { code: 'GT', dial: '+502', name: 'Guatemala', flag: '🇬🇹', maxLen: 8 },

  // ── H ──
  { code: 'HN', dial: '+504', name: 'Honduras', flag: '🇭🇳', maxLen: 8 },
  { code: 'HK', dial: '+852', name: 'Hong Kong', flag: '🇭🇰', maxLen: 8 },
  { code: 'HU', dial: '+36', name: 'Hungary', flag: '🇭🇺', maxLen: 9 },

  // ── I ──
  { code: 'IS', dial: '+354', name: 'Iceland', flag: '🇮🇸', maxLen: 7 },
  { code: 'ID', dial: '+62', name: 'Indonesia', flag: '🇮🇩', maxLen: 11 },
  { code: 'IR', dial: '+98', name: 'Iran', flag: '🇮🇷', maxLen: 10 },
  { code: 'IQ', dial: '+964', name: 'Iraq', flag: '🇮🇶', maxLen: 10 },
  { code: 'IE', dial: '+353', name: 'Ireland', flag: '🇮🇪', maxLen: 9 },
  { code: 'IL', dial: '+972', name: 'Israel', flag: '🇮🇱', maxLen: 9 },
  { code: 'IT', dial: '+39', name: 'Italy', flag: '🇮🇹', maxLen: 10 },

  // ── J ──
  { code: 'JM', dial: '+1', name: 'Jamaica', flag: '🇯🇲', maxLen: 10 },
  { code: 'JP', dial: '+81', name: 'Japan', flag: '🇯🇵', maxLen: 10 },
  { code: 'JO', dial: '+962', name: 'Jordan', flag: '🇯🇴', maxLen: 9 },

  // ── K ──
  { code: 'KZ', dial: '+7', name: 'Kazakhstan', flag: '🇰🇿', maxLen: 10 },
  { code: 'KE', dial: '+254', name: 'Kenya', flag: '🇰🇪', maxLen: 10 },
  { code: 'KW', dial: '+965', name: 'Kuwait', flag: '🇰🇼', maxLen: 8 },
  { code: 'KG', dial: '+996', name: 'Kyrgyzstan', flag: '🇰🇬', maxLen: 9 },
  { code: 'KR', dial: '+82', name: 'South Korea', flag: '🇰🇷', maxLen: 10 },

  // ── L ──
  { code: 'LA', dial: '+856', name: 'Laos', flag: '🇱🇦', maxLen: 10 },
  { code: 'LV', dial: '+371', name: 'Latvia', flag: '🇱🇻', maxLen: 8 },
  { code: 'LB', dial: '+961', name: 'Lebanon', flag: '🇱🇧', maxLen: 8 },
  { code: 'LY', dial: '+218', name: 'Libya', flag: '🇱🇾', maxLen: 10 },
  { code: 'LT', dial: '+370', name: 'Lithuania', flag: '🇱🇹', maxLen: 8 },
  { code: 'LU', dial: '+352', name: 'Luxembourg', flag: '🇱🇺', maxLen: 9 },
  { code: 'LK', dial: '+94', name: 'Sri Lanka', flag: '🇱🇰', maxLen: 9 },

  // ── M ──
  { code: 'MO', dial: '+853', name: 'Macau', flag: '🇲🇴', maxLen: 8 },
  { code: 'MY', dial: '+60', name: 'Malaysia', flag: '🇲🇾', maxLen: 10 },
  { code: 'MV', dial: '+960', name: 'Maldives', flag: '🇲🇻', maxLen: 7 },
  { code: 'MT', dial: '+356', name: 'Malta', flag: '🇲🇹', maxLen: 8 },
  { code: 'MX', dial: '+52', name: 'Mexico', flag: '🇲🇽', maxLen: 10 },
  { code: 'MD', dial: '+373', name: 'Moldova', flag: '🇲🇩', maxLen: 8 },
  { code: 'MN', dial: '+976', name: 'Mongolia', flag: '🇲🇳', maxLen: 8 },
  { code: 'ME', dial: '+382', name: 'Montenegro', flag: '🇲🇪', maxLen: 8 },
  { code: 'MA', dial: '+212', name: 'Morocco', flag: '🇲🇦', maxLen: 9 },
  { code: 'MZ', dial: '+258', name: 'Mozambique', flag: '🇲🇿', maxLen: 9 },
  { code: 'MM', dial: '+95', name: 'Myanmar', flag: '🇲🇲', maxLen: 9 },

  // ── N ──
  { code: 'NA', dial: '+264', name: 'Namibia', flag: '🇳🇦', maxLen: 9 },
  { code: 'NP', dial: '+977', name: 'Nepal', flag: '🇳🇵', maxLen: 10 },
  { code: 'NL', dial: '+31', name: 'Netherlands', flag: '🇳🇱', maxLen: 9 },
  { code: 'NZ', dial: '+64', name: 'New Zealand', flag: '🇳🇿', maxLen: 9 },
  { code: 'NI', dial: '+505', name: 'Nicaragua', flag: '🇳🇮', maxLen: 8 },
  { code: 'NG', dial: '+234', name: 'Nigeria', flag: '🇳🇬', maxLen: 10 },
  { code: 'NO', dial: '+47', name: 'Norway', flag: '🇳🇴', maxLen: 8 },

  // ── O ──
  { code: 'OM', dial: '+968', name: 'Oman', flag: '🇴🇲', maxLen: 8 },

  // ── P ──
  { code: 'PK', dial: '+92', name: 'Pakistan', flag: '🇵🇰', maxLen: 10 },
  { code: 'PA', dial: '+507', name: 'Panama', flag: '🇵🇦', maxLen: 8 },
  { code: 'PY', dial: '+595', name: 'Paraguay', flag: '🇵🇾', maxLen: 9 },
  { code: 'PE', dial: '+51', name: 'Peru', flag: '🇵🇪', maxLen: 9 },
  { code: 'PH', dial: '+63', name: 'Philippines', flag: '🇵🇭', maxLen: 10 },
  { code: 'PL', dial: '+48', name: 'Poland', flag: '🇵🇱', maxLen: 9 },
  { code: 'PT', dial: '+351', name: 'Portugal', flag: '🇵🇹', maxLen: 9 },

  // ── Q ──
  { code: 'QA', dial: '+974', name: 'Qatar', flag: '🇶🇦', maxLen: 8 },

  // ── R ──
  { code: 'RO', dial: '+40', name: 'Romania', flag: '🇷🇴', maxLen: 9 },
  { code: 'RU', dial: '+7', name: 'Russia', flag: '🇷🇺', maxLen: 10 },
  { code: 'RW', dial: '+250', name: 'Rwanda', flag: '🇷🇼', maxLen: 9 },

  // ── S ──
  { code: 'RS', dial: '+381', name: 'Serbia', flag: '🇷🇸', maxLen: 9 },
  { code: 'SL', dial: '+232', name: 'Sierra Leone', flag: '🇸🇱', maxLen: 8 },
  { code: 'SK', dial: '+421', name: 'Slovakia', flag: '🇸🇰', maxLen: 9 },
  { code: 'SI', dial: '+386', name: 'Slovenia', flag: '🇸🇮', maxLen: 8 },
  { code: 'SO', dial: '+252', name: 'Somalia', flag: '🇸🇴', maxLen: 8 },
  { code: 'ZA', dial: '+27', name: 'South Africa', flag: '🇿🇦', maxLen: 9 },
  { code: 'ES', dial: '+34', name: 'Spain', flag: '🇪🇸', maxLen: 9 },
  { code: 'SD', dial: '+249', name: 'Sudan', flag: '🇸🇩', maxLen: 9 },
  { code: 'SE', dial: '+46', name: 'Sweden', flag: '🇸🇪', maxLen: 9 },
  { code: 'CH', dial: '+41', name: 'Switzerland', flag: '🇨🇭', maxLen: 9 },
  { code: 'SY', dial: '+963', name: 'Syria', flag: '🇸🇾', maxLen: 9 },

  // ── T ──
  { code: 'TW', dial: '+886', name: 'Taiwan', flag: '🇹🇼', maxLen: 9 },
  { code: 'TJ', dial: '+992', name: 'Tajikistan', flag: '🇹🇯', maxLen: 9 },
  { code: 'TZ', dial: '+255', name: 'Tanzania', flag: '🇹🇿', maxLen: 9 },
  { code: 'TH', dial: '+66', name: 'Thailand', flag: '🇹🇭', maxLen: 9 },
  { code: 'TN', dial: '+216', name: 'Tunisia', flag: '🇹🇳', maxLen: 8 },
  { code: 'TR', dial: '+90', name: 'Turkey', flag: '🇹🇷', maxLen: 10 },
  { code: 'TM', dial: '+993', name: 'Turkmenistan', flag: '🇹🇲', maxLen: 8 },

  // ── U ──
  { code: 'UG', dial: '+256', name: 'Uganda', flag: '🇺🇬', maxLen: 9 },
  { code: 'UA', dial: '+380', name: 'Ukraine', flag: '🇺🇦', maxLen: 9 },
  { code: 'UY', dial: '+598', name: 'Uruguay', flag: '🇺🇾', maxLen: 8 },
  { code: 'UZ', dial: '+998', name: 'Uzbekistan', flag: '🇺🇿', maxLen: 9 },

  // ── V ──
  { code: 'VE', dial: '+58', name: 'Venezuela', flag: '🇻🇪', maxLen: 10 },
  { code: 'VN', dial: '+84', name: 'Vietnam', flag: '🇻🇳', maxLen: 10 },

  // ── Y ──
  { code: 'YE', dial: '+967', name: 'Yemen', flag: '🇾🇪', maxLen: 9 },

  // ── Z ──
  { code: 'ZM', dial: '+260', name: 'Zambia', flag: '🇿🇲', maxLen: 9 },
  { code: 'ZW', dial: '+263', name: 'Zimbabwe', flag: '🇿🇼', maxLen: 9 },
];

/** Find country by ISO code */
export function getCountryByCode(isoCode: string): CountryCode {
  return COUNTRY_CODES.find(c => c.code === isoCode) || COUNTRY_CODES[0]; // fallback to India
}

/** Map locale string to country code (e.g. 'en-US' → 'US', 'hi-IN' → 'IN') */
export function localeToCountryCode(locale: string): string {
  const parts = locale.split(/[-_]/);
  const region = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  if (region && COUNTRY_CODES.some(c => c.code === region)) return region;
  return 'IN'; // default
}

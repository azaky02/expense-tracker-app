import type { CurrencyCode } from '@/state/useSettingsStore';

export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2
  nameAr: string;
  nameEn: string;
  defaultCurrency: CurrencyCode;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt', defaultCurrency: 'EGP' },
  { code: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', defaultCurrency: 'SAR' },
  { code: 'AE', nameAr: 'الإمارات', nameEn: 'United Arab Emirates', defaultCurrency: 'AED' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', defaultCurrency: 'KWD' },
  { code: 'US', nameAr: 'أمريكا', nameEn: 'United States', defaultCurrency: 'USD' },
  { code: 'GB', nameAr: 'بريطانيا', nameEn: 'United Kingdom', defaultCurrency: 'GBP' },
  { code: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', defaultCurrency: 'EUR' },
];

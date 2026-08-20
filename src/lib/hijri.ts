import moment from 'moment-hijri';

import type { CalendarSystem } from '@/state/useSettingsStore';

export const HIJRI_MONTH_NAMES = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export const GREGORIAN_MONTH_NAMES_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

/** All dates are stored as Gregorian ISO ('YYYY-MM-DD') — see schema.ts. Hijri is display/input-only. */
export function isoToHijri(isoDate: string): DateParts {
  const [gy, gm, gd] = isoDate.split('-').map(Number);
  const { hy, hm, hd } = moment.iConvert.toHijri(gy, gm, gd);
  return { year: hy, month: hm, day: hd };
}

export function hijriToIso(parts: DateParts): string {
  const { gy, gm, gd } = moment.iConvert.toGregorian(parts.year, parts.month, parts.day);
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

export function isoToGregorianParts(isoDate: string): DateParts {
  const [year, month, day] = isoDate.split('-').map(Number);
  return { year, month, day };
}

export function gregorianPartsToIso(parts: DateParts): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function daysInMonth(parts: Pick<DateParts, 'year' | 'month'>, calendar: CalendarSystem): number {
  if (calendar === 'hijri') {
    return moment.iDaysInMonth(parts.year, parts.month - 1);
  }
  return new Date(parts.year, parts.month, 0).getDate();
}

export function formatDateForDisplay(isoDate: string, calendar: CalendarSystem): string {
  if (calendar === 'hijri') {
    const { year, month, day } = isoToHijri(isoDate);
    return `${day} ${HIJRI_MONTH_NAMES[month - 1]} ${year}هـ`;
  }
  const { year, month, day } = isoToGregorianParts(isoDate);
  return `${day} ${GREGORIAN_MONTH_NAMES_AR[month - 1]} ${year}`;
}

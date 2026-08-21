import { useSettingsStore, type CurrencyCode } from '@/state/useSettingsStore';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  EGP: 'ج.م',
  USD: '$',
  EUR: '€',
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  GBP: '£',
};

export const CURRENCY_OPTIONS: CurrencyCode[] = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'KWD', 'GBP'];

// Kept in sync with the store outside React (module scope), since `formatAmount` is called from
// many plain functions/components that don't otherwise subscribe to the settings store.
let currentCurrency: CurrencyCode = useSettingsStore.getState().currency;
useSettingsStore.subscribe((state) => {
  currentCurrency = state.currency;
});

export function formatAmount(amount: number, currency: CurrencyCode = currentCurrency): string {
  const number = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${number} ${CURRENCY_SYMBOLS[currency]}`;
}

export interface UpcomingPaymentItem {
  id: string;
  label: string;
  date: string; // ISO
  amount: number | null;
  source: 'Recurring' | 'CardDue';
}

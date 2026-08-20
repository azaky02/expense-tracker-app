import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { BeneficiaryBreakdownItem, MonthTotal } from '@/features/transactions/api';
import type { CategoryBreakdownItem } from '@/features/transactions/types';

import { buildReportHtml } from './buildReportHtml';

interface ExportReportPdfInput {
  isRtl: boolean;
  monthLabel: string;
  categoryChartImage: string | null;
  paymentChartImage: string | null;
  categoryBreakdown: CategoryBreakdownItem[];
  monthOverMonth: MonthTotal[];
  beneficiaryBreakdown: BeneficiaryBreakdownItem[];
  labels: {
    title: string;
    byCategory: string;
    byPaymentMethod: string;
    monthOverMonth: string;
    byBeneficiary: string;
    total: string;
  };
}

export async function exportReportPdf(input: ExportReportPdfInput): Promise<void> {
  const html = buildReportHtml(input);
  const { uri } = await Print.printToFileAsync({ html });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}

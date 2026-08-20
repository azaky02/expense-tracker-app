import type { BeneficiaryBreakdownItem, MonthTotal } from '@/features/transactions/api';
import type { CategoryBreakdownItem } from '@/features/transactions/types';
import { formatAmount } from '@/lib/currency';

interface ReportHtmlInput {
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

export function buildReportHtml(input: ReportHtmlInput): string {
  const { isRtl, monthLabel, categoryChartImage, paymentChartImage, categoryBreakdown, monthOverMonth, beneficiaryBreakdown, labels } = input;

  const categoryRows = categoryBreakdown
    .map((item) => `<tr><td>${item.categoryName}</td><td>${formatAmount(item.total)}</td></tr>`)
    .join('');

  const momRows = monthOverMonth
    .map((item) => `<tr><td>${item.month}</td><td>${formatAmount(item.expense)}</td></tr>`)
    .join('');

  const beneficiaryRows = beneficiaryBreakdown
    .map((item) => `<tr><td>${item.beneficiaryName}</td><td>${formatAmount(item.total)}</td></tr>`)
    .join('');

  return `
    <html dir="${isRtl ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Arial, sans-serif; padding: 24px; color: #15181C; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          td { padding: 6px 8px; border-bottom: 1px solid #E1E5EA; font-size: 13px; }
          img { max-width: 100%; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <h1>${labels.title}</h1>
        <p>${monthLabel}</p>

        <h2>${labels.byCategory}</h2>
        ${categoryChartImage ? `<img src="data:image/png;base64,${categoryChartImage}" />` : ''}
        <table>${categoryRows}</table>

        <h2>${labels.byPaymentMethod}</h2>
        ${paymentChartImage ? `<img src="data:image/png;base64,${paymentChartImage}" />` : ''}

        <h2>${labels.monthOverMonth}</h2>
        <table>${momRows}</table>

        <h2>${labels.byBeneficiary}</h2>
        <table>${beneficiaryRows}</table>
      </body>
    </html>
  `;
}

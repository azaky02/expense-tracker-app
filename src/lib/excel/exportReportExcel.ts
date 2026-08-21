import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

import { getBeneficiaryBreakdown, getExpenseByAccount, getExpenseCategoryBreakdown, listTransactions } from '@/features/transactions/api';

export interface ExcelExportRange {
  start: string; // 'YYYY-MM-DD'
  end: string;
}

/** Exports every transaction plus category/account/beneficiary breakdowns for a chosen date range
 * into one multi-sheet .xlsx file, then opens the native share sheet. */
export async function exportReportExcel({ start, end }: ExcelExportRange): Promise<void> {
  const [transactions, categoryBreakdown, accountBreakdown, beneficiaryBreakdown] = await Promise.all([
    listTransactions({ dateStart: start, dateEnd: end }),
    getExpenseCategoryBreakdown(start, end),
    getExpenseByAccount(start, end),
    getBeneficiaryBreakdown(start, end),
  ]);

  const workbook = XLSX.utils.book_new();

  const transactionsSheet = XLSX.utils.json_to_sheet(
    transactions.map((t) => ({
      Date: t.date,
      Type: t.type,
      Category: t.categoryName,
      Account: t.accountName,
      Amount: t.amount,
      Beneficiary: t.beneficiaryName ?? '',
      Note: t.note ?? '',
    }))
  );
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

  const categorySheet = XLSX.utils.json_to_sheet(
    categoryBreakdown.map((c) => ({ Category: c.categoryName, Total: c.total }))
  );
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'By Category');

  const accountSheet = XLSX.utils.json_to_sheet(accountBreakdown.map((a) => ({ Account: a.label, Total: a.total })));
  XLSX.utils.book_append_sheet(workbook, accountSheet, 'By Account');

  const beneficiarySheet = XLSX.utils.json_to_sheet(
    beneficiaryBreakdown.map((b) => ({ Beneficiary: b.beneficiaryName, Total: b.total }))
  );
  XLSX.utils.book_append_sheet(workbook, beneficiarySheet, 'By Beneficiary');

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}report-${start}-to-${end}.xlsx`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }
}

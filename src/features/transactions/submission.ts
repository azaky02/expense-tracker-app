import { findOrCreatePerson } from '@/features/people/api';

import type { TransactionFormValues } from './validators';
import type { TransactionInput } from './types';

/** Converts the form's flat field set into a TransactionInput for regular income/expense saves. */
export async function toTransactionInput(values: TransactionFormValues): Promise<TransactionInput> {
  let personId: string | null = null;
  if (values.type === 'Income' && values.incomeTypeUi === 'CashReceipt' && values.personName?.trim()) {
    personId = await findOrCreatePerson(values.personName);
  }

  return {
    amount: values.amount,
    type: values.type,
    categoryId: values.categoryId ?? '',
    accountId: values.accountId ?? '',
    incomeType: values.type === 'Income' && values.incomeTypeUi !== 'Custody' ? values.incomeTypeUi ?? null : null,
    incomeDetails:
      values.type === 'Income'
        ? {
            personId,
            employer: values.employer,
            payPeriod: values.payPeriod,
            employerDueDate: values.employerDueDate,
            reason: values.reason,
            senderName: values.senderName,
            referenceNote: values.referenceNote,
            source: values.source,
            description: values.description,
          }
        : null,
    date: values.date,
    note: values.note,
    attachmentUri: values.attachmentUri,
    beneficiaryName: values.beneficiaryName,
  };
}

import * as Crypto from 'expo-crypto';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAccountMonthSpend } from '@/features/accounts/api';
import { evaluateBudgetForTransaction } from '@/features/budgets/evaluate';

import {
  createTransaction,
  deleteTransaction,
  getAccountTransactions,
  getBeneficiaryBreakdown,
  getCategoryMonthTotal,
  getExpenseByAccount,
  getExpenseCategoryBreakdown,
  getMonthComparison,
  getMonthOverMonthTotals,
  getMonthSummary,
  getRecentTransactions,
  getTransaction,
  getWeeklyTotals,
  listTransactions,
  updateTransaction,
  updateTransactionNote,
  type TransactionFilters,
} from './api';
import type { TransactionInput, TransactionListItem } from './types';

const keys = {
  root: ['transactions'] as const,
  recent: (limit: number) => ['transactions', 'recent', limit] as const,
  list: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  monthSummary: (start: string, end: string) => ['transactions', 'month-summary', start, end] as const,
  categoryBreakdown: (start: string, end: string) => ['transactions', 'category-breakdown', start, end] as const,
  categoryMonthTotal: (categoryId: string, start: string, end: string) =>
    ['transactions', 'category-month-total', categoryId, start, end] as const,
  accountMonthSpend: (accountId: string, start: string, end: string) =>
    ['transactions', 'account-month-spend', accountId, start, end] as const,
  accountTransactions: (accountId: string) => ['transactions', 'account', accountId] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
  accountBreakdown: (start: string, end: string) => ['transactions', 'account-breakdown', start, end] as const,
  monthOverMonth: (monthsBack: number) => ['transactions', 'month-over-month', monthsBack] as const,
  beneficiaryBreakdown: (start: string, end: string) => ['transactions', 'beneficiary-breakdown', start, end] as const,
};

export function useExpenseByAccount(start: string, end: string) {
  return useQuery({
    queryKey: keys.accountBreakdown(start, end),
    queryFn: () => getExpenseByAccount(start, end),
  });
}

export function useMonthOverMonthTotals(monthsBack: number) {
  return useQuery({ queryKey: keys.monthOverMonth(monthsBack), queryFn: () => getMonthOverMonthTotals(monthsBack) });
}

export function useBeneficiaryBreakdown(start: string, end: string) {
  return useQuery({ queryKey: keys.beneficiaryBreakdown(start, end), queryFn: () => getBeneficiaryBreakdown(start, end) });
}

export function useTransaction(id: string) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => getTransaction(id), enabled: !!id });
}

export function useRecentTransactions(limit = 5) {
  return useQuery({ queryKey: keys.recent(limit), queryFn: () => getRecentTransactions(limit) });
}

export function useTransactionsList(filters: TransactionFilters = {}) {
  return useQuery({ queryKey: keys.list(filters), queryFn: () => listTransactions(filters) });
}

export function useMonthSummary(start: string, end: string) {
  return useQuery({ queryKey: keys.monthSummary(start, end), queryFn: () => getMonthSummary(start, end) });
}

export function useMonthComparison(start: string, end: string) {
  return useQuery({ queryKey: [...keys.monthSummary(start, end), 'comparison'], queryFn: () => getMonthComparison(start, end) });
}

export function useWeeklyTotals(start: string, end: string) {
  return useQuery({ queryKey: [...keys.monthSummary(start, end), 'weekly'], queryFn: () => getWeeklyTotals(start, end) });
}

export function useExpenseCategoryBreakdown(start: string, end: string) {
  return useQuery({
    queryKey: keys.categoryBreakdown(start, end),
    queryFn: () => getExpenseCategoryBreakdown(start, end),
  });
}

export function useCategoryMonthTotal(categoryId: string, start: string, end: string, enabled = true) {
  return useQuery({
    queryKey: keys.categoryMonthTotal(categoryId, start, end),
    queryFn: () => getCategoryMonthTotal(categoryId, start, end),
    enabled,
  });
}

export function useAccountMonthSpend(accountId: string, start: string, end: string) {
  return useQuery({
    queryKey: keys.accountMonthSpend(accountId, start, end),
    queryFn: () => getAccountMonthSpend(accountId, start, end),
  });
}

export function useAccountTransactions(accountId: string) {
  return useQuery({ queryKey: keys.accountTransactions(accountId), queryFn: () => getAccountTransactions(accountId) });
}

function invalidateAllTransactionData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: keys.root });
  void queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
  void queryClient.invalidateQueries({ queryKey: ['accounts'] });
}

/**
 * Optimistically inserts into the "recent transactions" list caches (what the user is looking at
 * right after tapping Save) so Add Transaction feels instant; aggregate figures (month summary,
 * category breakdown) are simply invalidated and refetch a moment later rather than being
 * hand-patched optimistically too, which would need duplicating the rollup logic client-side.
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: keys.root });
      const optimisticItem: TransactionListItem = {
        id: `optimistic-${Crypto.randomUUID()}`,
        amount: input.amount,
        type: input.type,
        date: input.date,
        note: input.note ?? null,
        attachmentUri: input.attachmentUri ?? null,
        beneficiaryName: input.beneficiaryName ?? null,
        categoryId: input.categoryId,
        categoryName: '',
        categoryIcon: '',
        categoryColor: '',
        accountId: input.accountId,
        accountName: null,
        incomeType: input.incomeType ?? null,
      };
      const previousRecent = queryClient.getQueriesData<TransactionListItem[]>({ queryKey: ['transactions', 'recent'] });
      queryClient.setQueriesData<TransactionListItem[]>({ queryKey: ['transactions', 'recent'] }, (old) =>
        old ? [optimisticItem, ...old] : old
      );
      return { previousRecent };
    },
    onError: (_err, _input, context) => {
      context?.previousRecent.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSuccess: (_id, input) => evaluateBudgetForTransaction(input),
    onSettled: () => invalidateAllTransactionData(queryClient),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) => updateTransaction(id, input),
    onSuccess: async (_result, { input }) => {
      invalidateAllTransactionData(queryClient);
      await evaluateBudgetForTransaction(input);
    },
  });
}

export function useUpdateTransactionNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => updateTransactionNote(id, note),
    onSuccess: () => invalidateAllTransactionData(queryClient),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => invalidateAllTransactionData(queryClient),
  });
}

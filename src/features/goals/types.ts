export interface GoalRecord {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string | null;
  linkedAccountId: string;
  linkedAccountName: string;
  isActive: boolean;
}

export interface GoalWithProgress extends GoalRecord {
  savedAmount: number;
  pct: number;
  suggestedMonthlyAmount: number | null;
}

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  linkedAccountId: string;
}

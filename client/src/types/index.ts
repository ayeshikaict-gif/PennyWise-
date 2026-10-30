export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type AccountType = 'CASH' | 'SAVINGS' | 'CURRENT' | 'DIGITAL_WALLET' | 'OTHER';

export type BillFrequency = 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export type BillStatus = 'UNPAID' | 'PAID' | 'OVERDUE';

export interface UserPreferences {
  id: string;
  userId: string;
  currency: string;
  dateFormat: string;
  firstDayOfWeek: number;
  largeTextMode: boolean;
  simplifiedMode: boolean;
  theme: 'light' | 'dark';
  budgetNotifications: boolean;
  billReminders: boolean;
  defaultAccountId?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingBalance: number;
  currentBalance?: number;
  isExcludedFromSummary: boolean;
  isArchived: boolean;
  description?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  account?: { id: string; name: string; currency: string; type: AccountType };
  type: TransactionType;
  amount: number;
  categoryId?: string | null;
  category?: { id: string; name: string; icon: string; color: string } | null;
  date: string;
  description?: string | null;
  paymentMethod?: string;
  toAccountId?: string | null;
  toAccount?: { id: string; name: string; currency: string; type: AccountType } | null;
  notes?: string | null;
  tags?: string | null;
  isRecurring: boolean;
  recurringPeriod?: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  amount: number;
  spent?: number;
  remaining?: number;
  percentUsed?: number;
  isExceeded?: boolean;
  isNearLimit?: boolean;
  month: number;
  year: number;
  alertThreshold: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  accountId?: string | null;
  account?: { id: string; name: string; currency: string } | null;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  description?: string | null;
  isCompleted: boolean;
  remainingAmount?: number;
  progressPercentage?: number;
  monthlyNeeded?: number | null;
  contributions?: Array<{
    id: string;
    amount: number;
    date: string;
    note?: string | null;
  }>;
}

export interface Bill {
  id: string;
  userId: string;
  name: string;
  expectedAmount: number;
  dueDate: string;
  frequency: BillFrequency;
  categoryId?: string | null;
  category?: Category | null;
  status: BillStatus;
  lastPaidDate?: string | null;
}

export interface OverviewMetrics {
  totalBalance: number;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsTotal: number;
  availableToSpend: number;
  availableToSpendBreakdown: {
    totalBalance: number;
    unpaidBills: number;
    budgetCommitments: number;
    explanation: string;
  };
  previousPeriod: {
    income: number;
    expenses: number;
    netCashFlow: number;
    balanceChange: number;
  };
}

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  category?: string;
}

export interface ReportData {
  startDate: string;
  endDate: string;
  categoryBreakdown: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    count: number;
  }>;
  incomeBreakdown: Array<{
    categoryId: string;
    name: string;
    color: string;
    icon: string;
    amount: number;
    count: number;
  }>;
  monthlyTrends: Array<{
    monthLabel: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  insights: Insight[];
}

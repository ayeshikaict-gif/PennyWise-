import { prisma } from '../utils/prisma';
import { round2, safeAdd, safeSub } from '../utils/math';

export interface AccountBalanceResult {
  accountId: string;
  name: string;
  type: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transfersIn: number;
  transfersOut: number;
  isExcludedFromSummary: boolean;
  isArchived: boolean;
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

/**
 * Calculates current balance for a single account from opening balance + recorded transactions
 */
export async function calculateAccountBalance(accountId: string): Promise<number> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
  });

  if (!account) return 0;

  // Incomes into this account
  const incomeAgg = await prisma.transaction.aggregate({
    where: {
      accountId,
      type: 'INCOME',
    },
    _sum: { amount: true },
  });
  const totalIncome = incomeAgg._sum.amount || 0;

  // Expenses from this account
  const expenseAgg = await prisma.transaction.aggregate({
    where: {
      accountId,
      type: 'EXPENSE',
    },
    _sum: { amount: true },
  });
  const totalExpense = expenseAgg._sum.amount || 0;

  // Transfers out of this account
  const transferOutAgg = await prisma.transaction.aggregate({
    where: {
      accountId,
      type: 'TRANSFER',
    },
    _sum: { amount: true },
  });
  const totalTransfersOut = transferOutAgg._sum.amount || 0;

  // Transfers into this account
  const transferInAgg = await prisma.transaction.aggregate({
    where: {
      toAccountId: accountId,
      type: 'TRANSFER',
    },
    _sum: { amount: true },
  });
  const totalTransfersIn = transferInAgg._sum.amount || 0;

  // Balance = Opening + Income - Expense + Transfers In - Transfers Out
  const net = safeAdd(
    safeSub(safeAdd(account.openingBalance, totalIncome), totalExpense),
    safeSub(totalTransfersIn, totalTransfersOut)
  );

  return round2(net);
}

/**
 * Calculates overview metrics for a given user and date range
 */
export async function getOverviewMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<OverviewMetrics> {
  // 1. Get all active accounts that are not excluded from summary
  const accounts = await prisma.account.findMany({
    where: {
      userId,
      isArchived: false,
    },
  });

  let totalBalance = 0;
  for (const acc of accounts) {
    if (!acc.isExcludedFromSummary) {
      const bal = await calculateAccountBalance(acc.id);
      totalBalance = safeAdd(totalBalance, bal);
    }
  }

  // 2. Income for selected period
  const incomeAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'INCOME',
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });
  const income = round2(incomeAgg._sum.amount || 0);

  // 3. Expenses for selected period (transfers strictly excluded!)
  const expenseAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });
  const expenses = round2(expenseAgg._sum.amount || 0);

  // 4. Net Cash Flow
  const netCashFlow = safeSub(income, expenses);

  // 5. Total Savings Progress / Contributions
  const savingsAgg = await prisma.savingsGoal.aggregate({
    where: { userId },
    _sum: { currentAmount: true },
  });
  const savingsTotal = round2(savingsAgg._sum.currentAmount || 0);

  // 6. Upcoming unpaid bills within the current period
  const now = new Date();
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  const unpaidBillsAgg = await prisma.bill.aggregate({
    where: {
      userId,
      status: { in: ['UNPAID', 'OVERDUE'] },
      dueDate: { lte: thirtyDaysOut },
    },
    _sum: { expectedAmount: true },
  });
  const unpaidBills = round2(unpaidBillsAgg._sum.expectedAmount || 0);

  // 7. Active monthly budgets commitment
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const overallBudget = await prisma.budget.findFirst({
    where: {
      userId,
      categoryId: null,
      month: currentMonth,
      year: currentYear,
    },
  });

  let budgetCommitment = 0;
  if (overallBudget) {
    // If overall budget set, commitment is remaining unspent budget
    const remainingBudget = Math.max(0, safeSub(overallBudget.amount, expenses));
    budgetCommitment = remainingBudget;
  }

  // Available to Spend: Total Balance minus upcoming bills minus planned budget reserve
  const rawAvailable = safeSub(safeSub(totalBalance, unpaidBills), budgetCommitment > 0 ? (budgetCommitment * 0.5) : 0);
  const availableToSpend = Math.max(0, rawAvailable);

  // 8. Previous period metrics for comparison
  const durationMs = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - durationMs);

  const prevIncomeAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'INCOME',
      date: { gte: prevStartDate, lte: prevEndDate },
    },
    _sum: { amount: true },
  });
  const prevIncome = round2(prevIncomeAgg._sum.amount || 0);

  const prevExpenseAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: prevStartDate, lte: prevEndDate },
    },
    _sum: { amount: true },
  });
  const prevExpenses = round2(prevExpenseAgg._sum.amount || 0);
  const prevNetCashFlow = safeSub(prevIncome, prevExpenses);

  return {
    totalBalance,
    income,
    expenses,
    netCashFlow,
    savingsTotal,
    availableToSpend,
    availableToSpendBreakdown: {
      totalBalance,
      unpaidBills,
      budgetCommitments: round2(budgetCommitment),
      explanation: `Calculated as your Total Balance (${totalBalance}) minus upcoming bills (${unpaidBills})${budgetCommitment > 0 ? ` and a conservative reserve for unspent budget commitments (${round2(budgetCommitment * 0.5)})` : ''}.`,
    },
    previousPeriod: {
      income: prevIncome,
      expenses: prevExpenses,
      netCashFlow: prevNetCashFlow,
      balanceChange: safeSub(netCashFlow, prevNetCashFlow),
    },
  };
}

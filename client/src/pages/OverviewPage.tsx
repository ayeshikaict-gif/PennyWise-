import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { QuickAddShortcuts } from '../components/forms/QuickAddShortcuts';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { SpendingTrendChart } from '../components/charts/SpendingTrendChart';
import { useCurrency } from '../context/CurrencyContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../api/client';
import { OverviewMetrics, Transaction, Budget, SavingsGoal, Category, Account } from '../types';
import { formatDate } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  PiggyBank,
  PlusCircle,
  Info,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface OverviewPageProps {
  onOpenAddTransaction: (prefill?: any) => void;
  onNavigateToTab: (tab: string) => void;
  accounts: Account[];
  categories: Category[];
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onOpenAddTransaction,
  onNavigateToTab,
  accounts,
  categories,
}) => {
  const { formatMoney } = useCurrency();
  const { simplifiedMode, largeTextMode } = useAccessibility();

  // Date filter state: 'THIS_MONTH', 'THIS_WEEK', 'LAST_MONTH', 'THIS_YEAR', 'CUSTOM'
  const [dateFilter, setDateFilter] = useState<'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR'>('THIS_MONTH');
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCalculationInfo, setShowCalculationInfo] = useState<boolean>(false);

  // Compute start/end dates based on selected filter
  const getDateRange = () => {
    const now = new Date();
    let start = new Date();
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (dateFilter === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateFilter === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateFilter === 'THIS_YEAR') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      const [summaryRes, transRes, budgetsRes, goalsRes, reportsRes] = await Promise.all([
        api.getSummary(startDate, endDate),
        api.getTransactions({ limit: 6 }),
        api.getBudgets(),
        api.getGoals(),
        api.getReports(startDate, endDate),
      ]);

      setMetrics(summaryRes);
      setRecentTransactions(transRes.data);
      setBudgets(budgetsRes.budgets || []);
      setGoals(goalsRes);
      setReportData(reportsRes);
    } catch (err) {
      console.error('Failed to load dashboard overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const handleShortcutClick = (shortcut: any) => {
    onOpenAddTransaction(shortcut);
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading your finances...</p>
        </div>
      </div>
    );
  }

  const hasAnyTransactions = recentTransactions.length > 0 || (metrics && (metrics.income > 0 || metrics.expenses > 0));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Date Filter & Quick Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Period:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'LAST_MONTH', label: 'Last Month' },
              { id: 'THIS_YEAR', label: 'This Year' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateFilter(tab.id as any)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  dateFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onOpenAddTransaction()}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          + Record Money
        </Button>
      </div>

      {/* Quick 1-Click Shortcuts */}
      <QuickAddShortcuts onSelectShortcut={handleShortcutClick} />

      {/* The 5 Key Answers Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Balance */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-800/80 border-slate-200/90 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatMoney(metrics?.totalBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
            Combined active accounts
          </p>
        </Card>

        {/* 2. Income (Money In) */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 border-emerald-100 dark:border-emerald-950/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {simplifiedMode ? 'Money In' : 'Total Income'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{formatMoney(metrics?.income)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Earned this period
          </p>
        </Card>

        {/* 3. Expenses (Money Out) */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-900 dark:to-rose-950/20 border-rose-100 dark:border-rose-950/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              {simplifiedMode ? 'Money Out' : 'Total Expenses'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            -{formatMoney(metrics?.expenses)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Spent this period
          </p>
        </Card>

        {/* 4. Available to Spend */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-sky-50/30 dark:from-slate-900 dark:to-sky-950/20 border-sky-100 dark:border-sky-950/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Safe to Spend
            </span>
            <button
              onClick={() => setShowCalculationInfo(!showCalculationInfo)}
              className="text-slate-400 hover:text-sky-600 p-1"
              title="Click to see how this is calculated"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
            {formatMoney(metrics?.availableToSpend)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            After bills & commitments
          </p>
        </Card>

        {/* 5. Savings Progress */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white to-brand-50/30 dark:from-slate-900 dark:to-brand-950/20 border-brand-100 dark:border-brand-950/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
              Money Saved
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-brand-600 dark:text-brand-400 tracking-tight">
            {formatMoney(metrics?.savingsTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Across active savings goals
          </p>
        </Card>
      </div>

      {/* Transparent Calculation Breakdown Card if toggled */}
      {showCalculationInfo && metrics?.availableToSpendBreakdown && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              How "Safe to Spend" is calculated:
            </span>
            <button
              onClick={() => setShowCalculationInfo(false)}
              className="font-bold text-sky-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <p className="leading-relaxed">
            {metrics.availableToSpendBreakdown.explanation}
          </p>
          <div className="flex flex-wrap gap-4 pt-1 font-semibold text-[11px]">
            <span>Total Balance: {formatMoney(metrics.availableToSpendBreakdown.totalBalance)}</span>
            <span>- Upcoming Bills: {formatMoney(metrics.availableToSpendBreakdown.unpaidBills)}</span>
            <span>- Planned Budget Reserve: {formatMoney(metrics.availableToSpendBreakdown.budgetCommitments)}</span>
          </div>
        </div>
      )}

      {/* Main Charts & Analytics Row */}
      {!hasAnyTransactions ? (
        <EmptyState
          icon={<PlusCircle className="w-8 h-8" />}
          title="Your money journey starts here"
          description="Record your first salary, allowance, or coffee expense to unlock automatic insights, budget alerts, and spending charts."
          actionText="+ Record First Transaction"
          onAction={() => onOpenAddTransaction()}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expenses Bar Chart */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Income versus Spending
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing cash in and cash out
                  </p>
                </div>
                <Badge variant={metrics && metrics.netCashFlow >= 0 ? 'success' : 'danger'}>
                  Net: {formatMoney(metrics?.netCashFlow)}
                </Badge>
              </div>
              <IncomeExpenseChart
                data={[
                  {
                    period: 'Selected Period',
                    income: metrics?.income || 0,
                    expenses: metrics?.expenses || 0,
                  },
                ]}
              />
            </Card>

            {/* Category Breakdown Donut */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Spending by Category
                </h3>
                <button
                  onClick={() => onNavigateToTab('expenses')}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  View all
                </button>
              </div>
              <CategoryPieChart
                data={reportData?.categoryBreakdown || []}
                totalAmount={metrics?.expenses || 0}
              />
            </Card>
          </div>

          {/* Monthly Trend & Budgets Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6-Month Spending Trend */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Monthly Cash Flow Trend
                  </h3>
                  <p className="text-xs text-slate-400">
                    6-month overview of money in and money out
                  </p>
                </div>
              </div>
              <SpendingTrendChart data={reportData?.monthlyTrends || []} />
            </Card>

            {/* Budgets Snapshot */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Budget Envelopes
                </h3>
                <button
                  onClick={() => onNavigateToTab('budgets')}
                  className="text-xs text-brand-600 font-semibold hover:underline"
                >
                  Manage
                </button>
              </div>

              {budgets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No monthly limits configured.{' '}
                  <button
                    onClick={() => onNavigateToTab('budgets')}
                    className="text-brand-600 font-bold underline"
                  >
                    Set a budget
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgets.slice(0, 4).map((b) => {
                    const spent = b.spent || 0;
                    const percent = b.percentUsed || 0;
                    const isOver = b.isExceeded;
                    const isWarning = b.isNearLimit;

                    return (
                      <div key={b.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {b.category?.name || 'Overall Spending Limit'}
                          </span>
                          <span
                            className={`font-semibold ${
                              isOver
                                ? 'text-rose-600'
                                : isWarning
                                ? 'text-amber-600'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {formatMoney(spent)} / {formatMoney(b.amount)}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-brand-500'
                            }`}
                            style={{ width: `${Math.min(100, percent)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{percent}% used</span>
                          <span>
                            {isOver
                              ? `Exceeded by ${formatMoney(Math.abs(b.remaining || 0))}`
                              : `${formatMoney(b.remaining)} left`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Savings Goals & Recent Transactions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Goals Progress */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Savings Goals
                  </h3>
                  <p className="text-xs text-slate-400">
                    Progress toward your milestones
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTab('savings')}
                  className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>All Goals</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  What are you saving for?{' '}
                  <button
                    onClick={() => onNavigateToTab('savings')}
                    className="text-brand-600 font-bold underline"
                  >
                    Add a goal
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.slice(0, 3).map((g) => {
                    const percent = g.progressPercentage || 0;
                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {g.name}
                          </span>
                          <span className="text-xs font-extrabold text-brand-600">
                            {percent}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span>Saved: {formatMoney(g.currentAmount)}</span>
                          <span>Target: {formatMoney(g.targetAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Recent Transactions List */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Recent Activity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest recorded transactions
                  </p>
                </div>
                <button
                  onClick={() => onNavigateToTab('transactions')}
                  className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <span>Full History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.map((t) => {
                    const isIncome = t.type === 'INCOME';
                    const isTransfer = t.type === 'TRANSFER';

                    return (
                      <div
                        key={t.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                                : isTransfer
                                ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/50'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'
                            }`}
                          >
                            {isIncome ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : isTransfer ? (
                              <ArrowRight className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {t.description || t.category?.name || (isTransfer ? 'Transfer' : 'Transaction')}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {formatDate(t.date)} • {t.account?.name || 'Account'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-black">
                          <span
                            className={
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'text-sky-600 dark:text-sky-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }
                          >
                            {isIncome ? '+' : isTransfer ? '' : '-'}
                            {formatMoney(t.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

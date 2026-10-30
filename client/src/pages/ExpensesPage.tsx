import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { api } from '../api/client';
import { Transaction, Account, Category } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { formatDate } from '../utils/formatters';
import {
  TrendingDown,
  PlusCircle,
  Download,
  Receipt,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

export interface ExpensesPageProps {
  onOpenAddExpense: () => void;
  accounts: Account[];
  categories: Category[];
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  onOpenAddExpense,
  accounts,
  categories,
}) => {
  const { formatMoney } = useCurrency();

  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadExpensesData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [transRes, reportsRes] = await Promise.all([
        api.getTransactions({ type: 'EXPENSE', limit: 100 }),
        api.getReports(start, end),
      ]);

      setExpenses(transRes.data);
      const total = transRes.data.reduce((sum: number, t: any) => sum + t.amount, 0);
      setTotalExpenses(total);
      setCategoryBreakdown(reportsRes.categoryBreakdown || []);
    } catch (err) {
      console.error('Failed to load expenses data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpensesData();
  }, []);

  const handleExportCsv = () => {
    window.open(api.exportCsvUrl(undefined, undefined, 'EXPENSE'), '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-rose-600" />
            <span>Expense Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Understand your spending habits, top categories, and daily living costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button size="sm" onClick={onOpenAddExpense} icon={<PlusCircle className="w-4 h-4" />}>
            + Add Expense
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-transparent border-rose-100 dark:border-rose-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Total Recorded Spending
          </span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatMoney(totalExpenses)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {expenses.length} expense items</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top Spending Category
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            {categoryBreakdown[0]?.name || 'Food and groceries'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {categoryBreakdown[0] ? `${formatMoney(categoryBreakdown[0].amount)} (${Math.round((categoryBreakdown[0].amount / (totalExpenses || 1)) * 100)}%)` : 'No expenses recorded'}
          </p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Average Expense Ticket
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {formatMoney(expenses.length > 0 ? totalExpenses / expenses.length : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Per recorded payment</p>
        </Card>
      </div>

      {/* Charts & Expense List Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown Donut */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Spending by Category
          </h3>
          <CategoryPieChart data={categoryBreakdown} totalAmount={totalExpenses} />
        </Card>

        {/* Expenses Table */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Recent Expense Entries
          </h3>

          {expenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-8 h-8" />}
              title="No expenses recorded yet"
              description="Record your groceries, bus fare, rent, or bill payments to see where your money goes."
              actionText="+ Record First Expense"
              onAction={onOpenAddExpense}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {t.description || t.category?.name || 'Expense'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(t.date)} • {t.account?.name} • {t.category?.name || 'Uncategorized'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                      -{formatMoney(t.amount)}
                    </span>
                    {t.paymentMethod && (
                      <span className="block text-[10px] text-slate-400 font-medium">
                        {t.paymentMethod.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

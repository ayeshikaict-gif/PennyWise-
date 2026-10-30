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
  TrendingUp,
  PlusCircle,
  Download,
  Calendar,
  Briefcase,
  Coins,
  Repeat,
  ArrowUpRight,
} from 'lucide-react';

export interface IncomePageProps {
  onOpenAddIncome: () => void;
  accounts: Account[];
  categories: Category[];
}

export const IncomePage: React.FC<IncomePageProps> = ({
  onOpenAddIncome,
  accounts,
  categories,
}) => {
  const { formatMoney } = useCurrency();

  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [recurringCount, setRecurringCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadIncomeData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [transRes, reportsRes] = await Promise.all([
        api.getTransactions({ type: 'INCOME', limit: 100 }),
        api.getReports(start, end),
      ]);

      setIncomes(transRes.data);
      const total = transRes.data.reduce((sum: number, t: any) => sum + t.amount, 0);
      setTotalIncome(total);
      setCategoryBreakdown(reportsRes.incomeBreakdown || []);

      const recurring = transRes.data.filter((t: any) => t.isRecurring).length;
      setRecurringCount(recurring);
    } catch (err) {
      console.error('Failed to load income data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncomeData();
  }, []);

  const handleExportCsv = () => {
    window.open(api.exportCsvUrl(undefined, undefined, 'INCOME'), '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Income Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track salaries, allowances, freelance earnings, and recurring income sources.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
          <Button size="sm" onClick={onOpenAddIncome} icon={<PlusCircle className="w-4 h-4" />}>
            + Add Income
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-100 dark:border-emerald-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Total Recorded Income
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatMoney(totalIncome)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {incomes.length} recorded payments</p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Primary Income Stream
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            {categoryBreakdown[0]?.name || 'Salary & Allowance'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {categoryBreakdown[0] ? `${formatMoney(categoryBreakdown[0].amount)} (${Math.round((categoryBreakdown[0].amount / (totalIncome || 1)) * 100)}%)` : 'No data yet'}
          </p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recurring Incomes
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-brand-600" />
            <span>{recurringCount} Active Stream{recurringCount === 1 ? '' : 's'}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Monthly salary, stipend, or pension</p>
        </Card>
      </div>

      {/* Breakdown Donut & History Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income Sources Pie */}
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Income by Source
          </h3>
          <CategoryPieChart data={categoryBreakdown} totalAmount={totalIncome} />
        </Card>

        {/* Income History List */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Recent Income Records
          </h3>
          {incomes.length === 0 ? (
            <EmptyState
              icon={<Coins className="w-8 h-8" />}
              title="No income recorded yet"
              description="Record your salary, freelance payments, scholarship, or allowances to keep track of your cash inflow."
              actionText="+ Record First Income"
              onAction={onOpenAddIncome}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {incomes.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {t.description || t.category?.name || 'Income'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(t.date)} • {t.account?.name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      +{formatMoney(t.amount)}
                    </span>
                    {t.isRecurring && (
                      <span className="block text-[10px] text-brand-600 font-semibold">
                        Recurring {t.recurringPeriod?.toLowerCase()}
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

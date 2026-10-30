import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { BudgetModal } from '../components/forms/BudgetModal';
import { api } from '../api/client';
import { Budget, Category } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import {
  PieChart,
  PlusCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';

export interface BudgetsPageProps {
  categories: Category[];
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ categories }) => {
  const { formatMoney } = useCurrency();

  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const loadBudgets = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBudgets(month, year);
      setBudgets(res.budgets || []);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [month, year]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleCopyLastMonth = async () => {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    try {
      const res = await api.copyBudgets({
        fromMonth: prevMonth,
        fromYear: prevYear,
        toMonth: month,
        toYear: year,
      });
      setCopySuccess(res.message);
      loadBudgets();
      setTimeout(() => setCopySuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to copy budgets.');
    }
  };

  const handleDeleteBudget = async () => {
    if (!deleteId) return;
    try {
      await api.deleteBudget(deleteId);
      setDeleteId(null);
      loadBudgets();
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

  // Separate overall budget from category budgets
  const overallBudget = budgets.find((b) => !b.categoryId);
  const categoryBudgets = budgets.filter((b) => !!b.categoryId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-brand-600" />
            <span>Budget Planner & Limits</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set envelopes for groceries, transport, or overall spending without stressful blocking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLastMonth}
            icon={<Copy className="w-4 h-4" />}
            title="Copy previous month envelope limits"
          >
            Copy Previous Month
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedBudget(null);
              setIsModalOpen(true);
            }}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            + Set Budget
          </Button>
        </div>
      </div>

      {copySuccess && (
        <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{copySuccess}</span>
        </div>
      )}

      {/* Month Navigator Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 px-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          onClick={handlePrevMonth}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 font-black text-base sm:text-lg text-slate-900 dark:text-white">
          <Calendar className="w-5 h-5 text-brand-600" />
          <span>
            {monthName} {year}
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Overall Budget Envelope Card */}
      {overallBudget && (
        <Card className="p-6 bg-gradient-to-r from-brand-50/50 via-white to-emerald-50/30 dark:from-slate-900 dark:to-slate-800 border-brand-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  ★ Overall Monthly Spending Limit
                </span>
                {overallBudget.isExceeded ? (
                  <Badge variant="danger">Limit Exceeded</Badge>
                ) : overallBudget.isNearLimit ? (
                  <Badge variant="warning">Approaching Limit</Badge>
                ) : (
                  <Badge variant="success">On Track</Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Combined ceiling across all expenses this month
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {formatMoney(overallBudget.spent)}
              </span>
              <span className="text-xs text-slate-400 font-bold"> / {formatMoney(overallBudget.amount)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3.5 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallBudget.isExceeded
                  ? 'bg-rose-500'
                  : overallBudget.isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-brand-500'
              }`}
              style={{ width: `${Math.min(100, overallBudget.percentUsed || 0)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{overallBudget.percentUsed}% used</span>
            <span>
              {overallBudget.isExceeded
                ? `Exceeded limit by ${formatMoney(Math.abs(overallBudget.remaining || 0))}`
                : `${formatMoney(overallBudget.remaining)} remaining`}
            </span>
          </div>
        </Card>
      )}

      {/* Category Envelopes Grid */}
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
          Category Envelopes ({categoryBudgets.length})
        </h3>

        {categoryBudgets.length === 0 && !overallBudget ? (
          <EmptyState
            icon={<PieChart className="w-8 h-8" />}
            title="No budgets set for this month"
            description="Create a budget envelope for groceries, transit, or entertainment to easily see how much you plan to spend."
            actionText="+ Set First Budget"
            onAction={() => {
              setSelectedBudget(null);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map((b) => {
              const spent = b.spent || 0;
              const percent = b.percentUsed || 0;
              const isOver = b.isExceeded;
              const isNear = b.isNearLimit;

              return (
                <Card key={b.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                        {b.category?.name || 'Category'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedBudget(b);
                            setIsModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-brand-600 rounded-md"
                          title="Edit budget"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(b.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Delete budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 font-medium">Spent:</span>
                      <div className="font-bold">
                        <span className={isOver ? 'text-rose-600' : 'text-slate-900 dark:text-white'}>
                          {formatMoney(spent)}
                        </span>
                        <span className="text-slate-400"> / {formatMoney(b.amount)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>{percent}% spent</span>
                      <span>
                        {isOver
                          ? `Over by ${formatMoney(Math.abs(b.remaining || 0))}`
                          : `${formatMoney(b.remaining)} left`}
                      </span>
                    </div>
                  </div>

                  {/* Warning Note if near or exceeded */}
                  {isOver && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-[11px] flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Budget exceeded. Transactions will still record normally.</span>
                    </div>
                  )}
                  {isNear && !isOver && (
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Approaching limit ({percent}%).</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBudget(null);
        }}
        onSaved={loadBudgets}
        initialData={selectedBudget}
        categories={categories}
        currentMonth={month}
        currentYear={year}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBudget}
        title="Remove Budget Envelope"
        message="Are you sure you want to delete this spending limit? Your recorded transactions will not be affected."
        confirmText="Remove"
        isDangerous={true}
      />
    </div>
  );
};

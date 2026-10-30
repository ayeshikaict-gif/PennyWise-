import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { GoalModal, GoalContributeModal } from '../components/forms/GoalModal';
import { api } from '../api/client';
import { SavingsGoal, Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { formatDate } from '../utils/formatters';
import {
  PiggyBank,
  PlusCircle,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface SavingsGoalsPageProps {
  accounts: Account[];
}

export const SavingsGoalsPage: React.FC<SavingsGoalsPageProps> = ({ accounts }) => {
  const { formatMoney } = useCurrency();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Contribute/Withdraw modal
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const res = await api.getGoals();
      setGoals(res);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteGoal(deleteId);
      setDeleteId(null);
      loadGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-brand-600" />
            <span>Savings Goals</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Set clear targets for vacations, emergency cushions, or large purchases.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedGoal(null);
            setIsModalOpen(true);
          }}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          + Create Goal
        </Button>
      </div>

      {/* Summary Banner */}
      <Card className="p-6 bg-gradient-to-r from-brand-600 to-emerald-600 text-white rounded-3xl shadow-lg shadow-brand-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Total Saved Towards Goals
            </span>
            <p className="text-3xl font-black tracking-tight mt-1">
              {formatMoney(totalSaved)}
            </p>
            <p className="text-xs text-emerald-100 mt-1">
              Combined target: {formatMoney(totalTarget)} ({goals.length} active goal{goals.length === 1 ? '' : 's'})
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>
      </Card>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-8 h-8" />}
          title="What are you saving for?"
          description="Create your first goal, whether it is an emergency fund, a new laptop, or holiday travels."
          actionText="+ Create Your First Goal"
          onAction={() => {
            setSelectedGoal(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const percent = g.progressPercentage || 0;
            const isCompleted = g.isCompleted || percent >= 100;

            return (
              <Card key={g.id} className="p-6 flex flex-col justify-between space-y-4 hoverable">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {g.name}
                      </h3>
                      {g.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{g.description}</p>
                      )}
                    </div>
                    {isCompleted ? (
                      <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                        Completed
                      </Badge>
                    ) : (
                      <span className="text-xs font-black text-brand-600 dark:text-brand-400">
                        {percent}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Saved vs Target */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Saved</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(g.currentAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Target</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(g.targetAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Target Date & Monthly Savings Recommendation */}
                  {g.targetDate && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Target Date:
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatDate(g.targetDate)}
                        </span>
                      </div>
                      {g.monthlyNeeded && g.monthlyNeeded > 0 && !isCompleted && (
                        <div className="flex items-center justify-between text-brand-700 dark:text-brand-300 font-semibold pt-1 border-t border-slate-200/60 dark:border-slate-700">
                          <span>Recommended Monthly:</span>
                          <span>{formatMoney(g.monthlyNeeded)}/mo</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => setContributeGoal(g)}
                      icon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Add / Withdraw
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedGoal(g);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit Goal"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGoal(null);
        }}
        onSaved={loadGoals}
        initialData={selectedGoal}
        accounts={accounts}
      />

      {/* Contribution / Withdrawal Modal */}
      <GoalContributeModal
        isOpen={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        onSaved={loadGoals}
        goal={contributeGoal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Savings Goal"
        message="Are you sure you want to remove this goal? Any historical savings records will be kept."
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
};

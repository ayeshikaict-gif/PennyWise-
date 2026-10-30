import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { BillModal } from '../components/forms/BillModal';
import { api } from '../api/client';
import { Bill, Category, Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { formatDate } from '../utils/formatters';
import {
  Receipt,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';

export interface BillsPageProps {
  accounts: Account[];
  categories: Category[];
  onRefreshSummary: () => void;
}

export const BillsPage: React.FC<BillsPageProps> = ({
  accounts,
  categories,
  onRefreshSummary,
}) => {
  const { formatMoney } = useCurrency();

  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Pay Modal / Dialog State
  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [recordExpense, setRecordExpense] = useState<boolean>(true);
  const [payAccountId, setPayAccountId] = useState<string>(accounts[0]?.id || '');
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadBills = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBills();
      setBills(res);
      onRefreshSummary();
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleConfirmPayment = async () => {
    if (!payBill) return;
    setIsPaying(true);
    try {
      await api.payBill(payBill.id, {
        recordExpense,
        accountId: recordExpense ? payAccountId : undefined,
      });
      setPayBill(null);
      loadBills();
    } catch (err) {
      console.error('Failed to pay bill:', err);
    } finally {
      setIsPaying(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteBill(deleteId);
      setDeleteId(null);
      loadBills();
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  const unpaidBills = bills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE');
  const totalUpcomingAmount = unpaidBills.reduce((sum, b) => sum + b.expectedAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-600" />
            <span>Bills & Payment Reminders</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Never miss an electricity, internet, tuition, or subscription deadline.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedBill(null);
            setIsModalOpen(true);
          }}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          + Add Bill Reminder
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-100 dark:border-amber-950/40">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Total Upcoming Unpaid
          </span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {formatMoney(totalUpcomingAmount)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {unpaidBills.length} obligation{unpaidBills.length === 1 ? '' : 's'} awaiting settlement
          </p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Next Bill Due
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            {unpaidBills[0]?.name || 'All caught up!'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {unpaidBills[0]
              ? `Due ${formatDate(unpaidBills[0].dueDate)} (${formatMoney(unpaidBills[0].expectedAmount)})`
              : 'No upcoming bills due soon'}
          </p>
        </Card>

        <Card>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Schedules
          </span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {bills.length} Tracked Bills
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Monthly, quarterly, or yearly</p>
        </Card>
      </div>

      {/* Bills List / Grid */}
      {bills.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title="No bills scheduled"
          description="Add your electricity, phone, water, or streaming service bills to keep track of upcoming payments."
          actionText="+ Add First Bill"
          onAction={() => {
            setSelectedBill(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bills.map((b) => {
            const isOverdue = b.status === 'OVERDUE';
            const isPaid = b.status === 'PAID';

            return (
              <Card
                key={b.id}
                className={`p-6 flex flex-col justify-between space-y-4 hoverable ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                    : isPaid
                    ? 'opacity-80 bg-slate-50/60 dark:bg-slate-800/40'
                    : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                        {b.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Schedule: {b.frequency.toLowerCase()}
                      </p>
                    </div>
                    {isOverdue ? (
                      <Badge variant="danger" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                        Overdue
                      </Badge>
                    ) : isPaid ? (
                      <Badge variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}>
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="warning" icon={<Clock className="w-3.5 h-3.5" />}>
                        Due Soon
                      </Badge>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Expected Amount
                    </span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {formatMoney(b.expectedAmount)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {formatDate(b.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    {!isPaid && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setPayBill(b);
                          setRecordExpense(true);
                          setPayAccountId(accounts[0]?.id || '');
                        }}
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedBill(b);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit Bill"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(b.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bill Modal */}
      <BillModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBill(null);
        }}
        onSaved={loadBills}
        initialData={selectedBill}
        categories={categories}
      />

      {/* Mark As Paid Dialog */}
      {payBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Mark {payBill.name} as Paid
            </h3>
            <p className="text-sm text-slate-500">
              Amount: <strong className="text-slate-900 dark:text-white">{formatMoney(payBill.expectedAmount)}</strong>
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordExpense}
                  onChange={(e) => setRecordExpense(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-brand-600"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-slate-900 dark:text-white">
                    Record this payment as an Expense transaction
                  </strong>
                  Deducts from chosen account so your balances stay accurate. Uncheck if you already recorded this payment separately.
                </span>
              </label>

              {recordExpense && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deduct payment from account:
                  </label>
                  <select
                    value={payAccountId}
                    onChange={(e) => setPayAccountId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatMoney(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setPayBill(null)} disabled={isPaying}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmPayment} isLoading={isPaying}>
                Confirm Paid
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Bill Reminder"
        message="Are you sure you want to remove this reminder? Your recorded expenses will not be affected."
        confirmText="Remove"
        isDangerous={true}
      />
    </div>
  );
};

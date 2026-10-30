import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../api/client';
import { Account, Category, Transaction, TransactionType } from '../../types';
import { TrendingDown, TrendingUp, ArrowLeftRight, Check } from 'lucide-react';

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Partial<Transaction> | null;
  accounts: Account[];
  categories: Category[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
  accounts,
  categories,
}) => {
  const { currency } = useCurrency();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringPeriod, setRecurringPeriod] = useState<string>('MONTHLY');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);

  // Initialize or reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'EXPENSE');
        setAmount(initialData.amount ? initialData.amount.toString() : '');
        setAccountId(initialData.accountId || (accounts[0]?.id || ''));
        setToAccountId(initialData.toAccountId || '');
        setCategoryId(initialData.categoryId || '');
        setDate(
          initialData.date
            ? new Date(initialData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        );
        setDescription(initialData.description || '');
        setPaymentMethod(initialData.paymentMethod || 'CASH');
        setNotes(initialData.notes || '');
        setTags(initialData.tags || '');
        setIsRecurring(initialData.isRecurring || false);
        setRecurringPeriod(initialData.recurringPeriod || 'MONTHLY');
      } else {
        // Reset defaults
        setType('EXPENSE');
        setAmount('');
        // Remember previously used account or default to first
        const savedAccount = localStorage.getItem('pennywise_last_account');
        setAccountId(savedAccount && accounts.some((a) => a.id === savedAccount) ? savedAccount : accounts[0]?.id || '');
        setToAccountId('');
        setCategoryId('');
        setDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setPaymentMethod('CASH');
        setNotes('');
        setTags('');
        setIsRecurring(false);
      }
      setErrors({});
      setShowOptionalFields(false);
    }
  }, [isOpen, initialData, accounts]);

  // Filter categories by selected type (Income vs Expense)
  const availableCategories = categories.filter((c) => c.type === type);

  // Auto-select first matching category if current is invalid
  useEffect(() => {
    if (type !== 'TRANSFER') {
      const match = availableCategories.find((c) => c.id === categoryId);
      if (!match && availableCategories.length > 0) {
        setCategoryId(availableCategories[0].id);
      }
    }
  }, [type, availableCategories, categoryId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than zero';
    }
    if (!accountId) {
      errs.accountId = 'Please choose an account';
    }
    if (type === 'TRANSFER') {
      if (!toAccountId) {
        errs.toAccountId = 'Please choose destination account';
      } else if (toAccountId === accountId) {
        errs.toAccountId = 'Source and destination accounts must be different';
      }
    } else {
      if (!categoryId) {
        errs.categoryId = 'Please select a category';
      }
    }
    if (!date) {
      errs.date = 'Date is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        amount: parseFloat(amount),
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : null,
        categoryId: type === 'TRANSFER' ? null : categoryId,
        date,
        description: description.trim() || null,
        paymentMethod,
        notes: notes.trim() || null,
        tags: tags.trim() || null,
        isRecurring,
        recurringPeriod: isRecurring ? recurringPeriod : null,
      };

      if (initialData?.id) {
        await api.updateTransaction(initialData.id, payload);
      } else {
        await api.createTransaction(payload);
        // Remember account for next time
        localStorage.setItem('pennywise_last_account', accountId);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Transaction' : 'Record Transaction'}
      description="Record money in, money out, or an internal transfer in seconds."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">
            {errors.form}
          </div>
        )}

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl select-none">
          <button
            type="button"
            onClick={() => setType('EXPENSE')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              type === 'EXPENSE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>Money Out</span>
          </button>
          <button
            type="button"
            onClick={() => setType('INCOME')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              type === 'INCOME'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Money In</span>
          </button>
          <button
            type="button"
            onClick={() => setType('TRANSFER')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              type === 'TRANSFER'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Amount ({currency}) *
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-lg">
              {currency === 'LKR' ? 'Rs.' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-extrabold text-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              autoFocus
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs font-semibold text-rose-600">{errors.amount}</p>
          )}
        </div>

        {/* Category Selection (for Income & Expense) */}
        {type !== 'TRANSFER' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-2xl">
              {availableCategories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 font-bold border border-brand-300'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate flex-1">{c.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="mt-1 text-xs font-semibold text-rose-600">{errors.categoryId}</p>
            )}
          </div>
        )}

        {/* Account Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={type === 'TRANSFER' ? 'From Account *' : 'Account *'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            error={errors.accountId}
            options={accounts.map((a) => ({
              value: a.id,
              label: `${a.name} (${a.currency})`,
            }))}
          />

          {type === 'TRANSFER' ? (
            <Select
              label="To Destination Account *"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              error={errors.toAccountId}
              options={[
                { value: '', label: 'Select destination account...' },
                ...accounts
                  .filter((a) => a.id !== accountId)
                  .map((a) => ({
                    value: a.id,
                    label: `${a.name} (${a.currency})`,
                  })),
              ]}
            />
          ) : (
            <Input
              type="date"
              label="Date *"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              error={errors.date}
            />
          )}
        </div>

        {type === 'TRANSFER' && (
          <Input
            type="date"
            label="Transfer Date *"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />
        )}

        {/* Short Description */}
        <Input
          label="Description (Optional)"
          placeholder={
            type === 'EXPENSE'
              ? 'e.g. Keells grocery basket, Bus ticket, Dinner'
              : type === 'INCOME'
              ? 'e.g. October Salary, Freelance project fee'
              : 'e.g. ATM withdrawal, Card payment'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Toggle Extra Optional Fields */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            {showOptionalFields ? '- Hide Extra Details' : '+ Add Payment Method, Notes or Tags'}
          </button>
        </div>

        {showOptionalFields && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-100">
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'BANK_CARD', label: 'Debit / Credit Card' },
                { value: 'ONLINE_TRANSFER', label: 'Online Bank Transfer' },
                { value: 'DIGITAL_WALLET', label: 'Digital Wallet / QR' },
                { value: 'OTHER', label: 'Other Method' },
              ]}
            />

            <Input
              label="Tags (Comma-separated)"
              placeholder="e.g. work, food, tax, bill"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />

            <Input
              label="Personal Notes"
              placeholder="Add any extra reminders or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData?.id ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

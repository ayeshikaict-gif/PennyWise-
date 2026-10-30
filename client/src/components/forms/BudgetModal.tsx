import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { api } from '../../api/client';
import { Budget, Category } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

export interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Budget | null;
  categories: Category[];
  currentMonth: number;
  currentYear: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
  categories,
  currentMonth,
  currentYear,
}) => {
  const { currency } = useCurrency();

  const [categoryId, setCategoryId] = useState<string>(''); // empty string = Overall limit
  const [amount, setAmount] = useState<string>('');
  const [alertThreshold, setAlertThreshold] = useState<number>(0.8);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategoryId(initialData.categoryId || '');
        setAmount(initialData.amount.toString());
        setAlertThreshold(initialData.alertThreshold || 0.8);
      } else {
        setCategoryId('');
        setAmount('');
        setAlertThreshold(0.8);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Only expense categories are budgetable
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid monthly spending limit';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.saveBudget({
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        month: currentMonth,
        year: currentYear,
        alertThreshold,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save budget.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Adjust Spending Limit' : 'Set Monthly Budget'}
      description="Plan how much you wish to spend so you can save comfortably without stress."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        <Select
          label="Budget Scope *"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          options={[
            { value: '', label: '★ Overall Monthly Spending Limit (Combined)' },
            ...expenseCategories.map((c) => ({
              value: c.id,
              label: `Category: ${c.name}`,
            })),
          ]}
          helperText="Choose whether to limit total spending or a specific category (like Food or Entertainment)."
        />

        <Input
          type="number"
          step="0.01"
          label={`Spending Limit (${currency}) *`}
          placeholder="e.g. 25000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          helperText="We will warn you when your spending reaches this envelope limit."
        />

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Warning Alert Threshold: {Math.round(alertThreshold * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>50%</span>
            <span>75%</span>
            <span>85%</span>
            <span>100% (Strict)</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};

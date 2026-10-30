import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { api } from '../../api/client';
import { Account, SavingsGoal } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

export interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: SavingsGoal | null;
  accounts: Account[];
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
  accounts,
}) => {
  const { currency } = useCurrency();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setTargetAmount(initialData.targetAmount.toString());
        setCurrentAmount(initialData.currentAmount.toString());
        setTargetDate(
          initialData.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : ''
        );
        setDescription(initialData.description || '');
        setAccountId(initialData.accountId || '');
      } else {
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setTargetDate('');
        setDescription('');
        setAccountId('');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Goal name is required';
    const target = parseFloat(targetAmount);
    if (!targetAmount || isNaN(target) || target <= 0) {
      errs.targetAmount = 'Please enter a target amount greater than zero';
    }
    const current = parseFloat(currentAmount);
    if (isNaN(current) || current < 0) {
      errs.currentAmount = 'Current saved amount cannot be negative';
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
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        targetDate: targetDate || null,
        description: description.trim() || null,
        accountId: accountId || null,
      };

      if (initialData?.id) {
        await api.updateGoal(initialData.id, payload);
      } else {
        await api.createGoal(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save savings goal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Savings Goal' : 'Create Savings Goal'}
      description="Set a target for what you're working toward (laptop, holiday, emergency cushion)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        <Input
          label="Goal Name *"
          placeholder="e.g. New Laptop, Emergency Fund, Ella Holiday"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            step="0.01"
            label={`Target Amount (${currency}) *`}
            placeholder="e.g. 250000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            error={errors.targetAmount}
          />

          <Input
            type="number"
            step="0.01"
            label={`Already Saved (${currency})`}
            placeholder="0"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            error={errors.currentAmount}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="date"
            label="Target Date (Optional)"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            helperText="Provides a monthly recommended savings estimate."
          />

          <Select
            label="Linked Account (Optional)"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            options={[
              { value: '', label: 'None (Track separately)' },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.currency})`,
              })),
            ]}
          />
        </div>

        <Input
          label="Description / Motivation (Optional)"
          placeholder="e.g. 6 months safety cushion for peace of mind"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData?.id ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Modal to contribute or withdraw money from a goal
export interface GoalContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  goal: SavingsGoal | null;
}

export const GoalContributeModal: React.FC<GoalContributeModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  goal,
}) => {
  const { currency } = useCurrency();
  const [action, setAction] = useState<'ADD' | 'WITHDRAW'>('ADD');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setNote('');
      setError('');
      setAction('ADD');
    }
  }, [isOpen]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Please enter an amount greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalAmount = action === 'ADD' ? parsed : -parsed;
      await api.contributeGoal(goal.id, {
        amount: finalAmount,
        note: note.trim() || undefined,
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update goal progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={action === 'ADD' ? `Add Money to "${goal.name}"` : `Withdraw from "${goal.name}"`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl select-none">
          <button
            type="button"
            onClick={() => setAction('ADD')}
            className={`py-2 rounded-xl font-bold text-xs transition-all ${
              action === 'ADD'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            + Add Money
          </button>
          <button
            type="button"
            onClick={() => setAction('WITHDRAW')}
            className={`py-2 rounded-xl font-bold text-xs transition-all ${
              action === 'WITHDRAW'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            - Withdraw
          </button>
        </div>

        <Input
          type="number"
          step="0.01"
          label={`Amount (${currency}) *`}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />

        <Input
          label="Note (Optional)"
          placeholder="e.g. Monthly allocation, bonus savings"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm
          </Button>
        </div>
      </form>
    </Modal>
  );
};

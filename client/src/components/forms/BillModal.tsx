import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { api } from '../../api/client';
import { Bill, BillFrequency, Category } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

export interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Bill | null;
  categories: Category[];
}

export const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
  categories,
}) => {
  const { currency } = useCurrency();

  const [name, setName] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [frequency, setFrequency] = useState<BillFrequency>('MONTHLY');
  const [categoryId, setCategoryId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setExpectedAmount(initialData.expectedAmount.toString());
        setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
        setFrequency(initialData.frequency);
        setCategoryId(initialData.categoryId || '');
      } else {
        setName('');
        setExpectedAmount('');
        // Default due date: 7 days from now
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setDueDate(nextWeek.toISOString().split('T')[0]);
        setFrequency('MONTHLY');
        setCategoryId('');
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Bill name is required';
    const parsedAmt = parseFloat(expectedAmount);
    if (!expectedAmount || isNaN(parsedAmt) || parsedAmt <= 0) {
      errs.expectedAmount = 'Please enter a valid bill amount';
    }
    if (!dueDate) {
      errs.dueDate = 'Due date is required';
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
        expectedAmount: parseFloat(expectedAmount),
        dueDate,
        frequency,
        categoryId: categoryId || null,
      };

      if (initialData?.id) {
        await api.updateBill(initialData.id, payload);
      } else {
        await api.createBill(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save bill reminder.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Bill Reminder' : 'Add Bill & Payment Reminder'}
      description="Keep track of recurring obligations like electricity, rent, internet, or insurance."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        <Input
          label="Bill Name *"
          placeholder="e.g. CEB Electricity, Dialog Fiber, Water Board, House Rent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            step="0.01"
            label={`Expected Amount (${currency}) *`}
            placeholder="0.00"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            error={errors.expectedAmount}
          />

          <Input
            type="date"
            label="Due Date *"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={errors.dueDate}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Schedule / Frequency *"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as BillFrequency)}
            options={[
              { value: 'MONTHLY', label: 'Every Month' },
              { value: 'WEEKLY', label: 'Every Week' },
              { value: 'QUARTERLY', label: 'Every 3 Months' },
              { value: 'YEARLY', label: 'Once a Year' },
              { value: 'ONCE', label: 'One-Time Bill' },
            ]}
          />

          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: '', label: 'None' },
              ...expenseCategories.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData?.id ? 'Save Changes' : 'Add Bill Reminder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

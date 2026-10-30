import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { api } from '../../api/client';
import { Account, AccountType } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

export interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialData,
}) => {
  const { currency: defaultCurrency } = useCurrency();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('SAVINGS');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isExcludedFromSummary, setIsExcludedFromSummary] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setType(initialData.type);
        setCurrency(initialData.currency);
        setOpeningBalance(initialData.openingBalance.toString());
        setIsExcludedFromSummary(initialData.isExcludedFromSummary);
        setDescription(initialData.description || '');
      } else {
        setName('');
        setType('SAVINGS');
        setCurrency(defaultCurrency);
        setOpeningBalance('0');
        setIsExcludedFromSummary(false);
        setDescription('');
      }
      setErrors({});
    }
  }, [isOpen, initialData, defaultCurrency]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Account name is required';
    const parsedBal = parseFloat(openingBalance);
    if (isNaN(parsedBal)) errs.openingBalance = 'Please enter a valid opening balance number';
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
        type,
        currency,
        openingBalance: parseFloat(openingBalance),
        isExcludedFromSummary,
        description: description.trim() || null,
      };

      if (initialData?.id) {
        await api.updateAccount(initialData.id, payload);
      } else {
        await api.createAccount(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save account.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData?.id ? 'Edit Account' : 'Add Financial Account'}
      description="Track cash in wallet, bank accounts, or digital wallets."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {errors.form}
          </div>
        )}

        <Input
          label="Account Name *"
          placeholder="e.g. Commercial Bank, Cash Pocket, FriMi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Account Type *"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            options={[
              { value: 'SAVINGS', label: 'Savings Account' },
              { value: 'CASH', label: 'Cash Wallet' },
              { value: 'CURRENT', label: 'Current Account' },
              { value: 'DIGITAL_WALLET', label: 'Digital Wallet / Mobile' },
              { value: 'OTHER', label: 'Other Account' },
            ]}
          />

          <Select
            label="Currency *"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: 'LKR', label: 'LKR (Rs.)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'INR', label: 'INR (₹)' },
            ]}
          />
        </div>

        <Input
          type="number"
          step="0.01"
          label="Opening Balance *"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          error={errors.openingBalance}
          helperText="Starting balance before any recorded transactions."
        />

        <Input
          label="Description / Purpose (Optional)"
          placeholder="e.g. Emergency reserve, Daily allowance, House rent fund"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <input
            type="checkbox"
            id="excludeSummary"
            checked={isExcludedFromSummary}
            onChange={(e) => setIsExcludedFromSummary(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
          />
          <label htmlFor="excludeSummary" className="text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold block text-slate-900 dark:text-white">
              Exclude from Total Balance summary
            </span>
            Check this if this account is a separate business account or locked investment you do
            not want counted in your daily spending total.
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initialData?.id ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

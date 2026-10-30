import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useCurrency } from '../../context/CurrencyContext';
import { api } from '../../api/client';
import { Sparkles, ArrowRight, CheckCircle2, Wallet, DollarSign, PieChart } from 'lucide-react';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [step, setStep] = useState<number>(1);

  // Form states
  const [accountName, setAccountName] = useState('Cash Wallet');
  const [accountType, setAccountType] = useState('CASH');
  const [openingBalance, setOpeningBalance] = useState('5000');
  const [monthlyBudget, setMonthlyBudget] = useState('30000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Create initial account if provided
      if (accountName.trim()) {
        await api.createAccount({
          name: accountName.trim(),
          type: accountType,
          currency,
          openingBalance: parseFloat(openingBalance) || 0,
        });
      }

      // 2. Set initial budget if provided
      if (monthlyBudget && parseFloat(monthlyBudget) > 0) {
        const now = new Date();
        await api.saveBudget({
          categoryId: null, // overall
          amount: parseFloat(monthlyBudget),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          alertThreshold: 0.8,
        });
      }

      localStorage.setItem('pennywise_onboarding_completed', 'true');
      onComplete();
      onClose();
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
    >
      <div className="text-center pt-2 pb-4">
        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-8 bg-brand-600'
                  : i < step
                  ? 'w-2 bg-brand-300 dark:bg-brand-700'
                  : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome & Currency */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Welcome to PennyWise
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Your friendly personal finance companion. Managing money is now as easy as sending a message.
              </p>
            </div>

            <div className="text-left pt-3">
              <Select
                label="Choose your primary currency:"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={availableCurrencies.map((c) => ({
                  value: c.code,
                  label: `${c.label}`,
                }))}
                helperText="Sri Lankan Rupee (LKR) is default, but you can switch to USD, EUR, GBP, or INR anytime."
              />
            </div>
          </div>
        )}

        {/* Step 2: Add Account */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Add an Account
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                Where do you keep your money? Add a cash wallet or your primary bank account.
              </p>
            </div>

            <div className="text-left space-y-3 pt-2">
              <Input
                label="Account Name"
                placeholder="e.g. Cash Pocket, Commercial Bank"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />

              <Select
                label="Account Type"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                options={[
                  { value: 'CASH', label: 'Cash Wallet' },
                  { value: 'SAVINGS', label: 'Savings Account' },
                  { value: 'CURRENT', label: 'Current Account' },
                  { value: 'DIGITAL_WALLET', label: 'Digital Wallet' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Step 3: Opening Balance */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <DollarSign className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Opening Balance
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                How much is currently in this account? You can change this or skip it anytime.
              </p>
            </div>

            <div className="text-left pt-2">
              <Input
                type="number"
                step="0.01"
                label={`Opening Balance (${currency})`}
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                helperText="Enter 0 or leave blank if you want to start fresh."
              />
            </div>
          </div>
        )}

        {/* Step 4: Monthly Spending Budget */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <PieChart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Set a Monthly Budget
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                (Optional) How much do you want to safely spend per month?
              </p>
            </div>

            <div className="text-left pt-2">
              <Input
                type="number"
                step="0.01"
                label={`Planned Monthly Budget (${currency})`}
                placeholder="e.g. 50000"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                helperText="We'll notify you gently when you're close to this limit. You can skip this step!"
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Skip Guide
          </Button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              isLoading={isSubmitting}
              icon={step === 4 ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            >
              {step === 4 ? 'Get Started' : 'Next Step'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

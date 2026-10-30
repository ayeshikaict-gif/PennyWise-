import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { api } from '../api/client';
import { Account } from '../types';
import {
  Settings,
  User,
  Globe,
  Sliders,
  Type,
  Moon,
  Sun,
  Bell,
  Download,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export interface SettingsPageProps {
  accounts: Account[];
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ accounts }) => {
  const { user, updateUserPreferences } = useAuth();
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const {
    largeTextMode,
    setLargeTextMode,
    simplifiedMode,
    setSimplifiedMode,
    theme,
    setTheme,
  } = useAccessibility();

  const [dateFormat, setDateFormat] = useState(user?.preferences?.dateFormat || 'YYYY-MM-DD');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(user?.preferences?.firstDayOfWeek ?? 1);
  const [budgetNotifications, setBudgetNotifications] = useState(
    user?.preferences?.budgetNotifications ?? true
  );
  const [billReminders, setBillReminders] = useState(
    user?.preferences?.billReminders ?? true
  );
  const [defaultAccountId, setDefaultAccountId] = useState(
    user?.preferences?.defaultAccountId || accounts[0]?.id || ''
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserPreferences({
        dateFormat,
        firstDayOfWeek: Number(firstDayOfWeek),
        budgetNotifications,
        billReminders,
        defaultAccountId: defaultAccountId || null,
        currency,
        largeTextMode,
        simplifiedMode,
        theme,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  };

  const handleExportAll = () => {
    window.open(api.exportAllUrl(), '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-600" />
          <span>Settings & Personalization</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Customize currency, accessibility modes, plain language display, and alerts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 text-xs rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Your preferences have been saved successfully!</span>
        </div>
      )}

      {/* User Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Profile Information
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
              Display Name
            </label>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{user?.name || 'User'}</p>
          </div>
          <div>
            <label className="block text-slate-400 font-bold uppercase text-[10px] mb-1">
              Email Address
            </label>
            <p className="font-bold text-sm text-slate-900 dark:text-white">{user?.email || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Accessibility & Interface Modes */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Interface Modes & Accessibility ("For Everyone")
          </h3>
        </div>

        <div className="space-y-4">
          {/* Simplified Mode Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                Simplified Easy Mode
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Streamlines the dashboard into 5 primary sections with extra-large tap targets, zero banking jargon ("Money In" and "Money Out"), and gentle guidance. Ideal for beginners, students, or retirees.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={simplifiedMode}
                onChange={(e) => setSimplifiedMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Comfortable Text Mode Toggle */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                Comfortable Larger Text Mode
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Increases font sizes throughout all buttons, cards, and labels for comfortable reading on all devices.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={largeTextMode}
                onChange={(e) => setLargeTextMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          {/* Theme Option */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                Color Theme
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose between Clean Light theme or Dark theme.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-700 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Regional & Financial Preferences Form */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Globe className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Currency & Regional Settings
          </h3>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Default Primary Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={availableCurrencies.map((c) => ({
                value: c.code,
                label: `${c.label}`,
              }))}
              helperText="Default: Sri Lankan Rupee (LKR, Rs.)"
            />

            <Select
              label="Date Display Format"
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              options={[
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-10-30)' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (30/10/2026)' },
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (10/30/2026)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="First Day of the Week"
              value={firstDayOfWeek}
              onChange={(e) => setFirstDayOfWeek(Number(e.target.value))}
              options={[
                { value: 1, label: 'Monday (Standard)' },
                { value: 0, label: 'Sunday' },
                { value: 6, label: 'Saturday' },
              ]}
            />

            <Select
              label="Default Account for New Records"
              value={defaultAccountId}
              onChange={(e) => setDefaultAccountId(e.target.value)}
              options={accounts.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.currency})`,
              }))}
            />
          </div>

          {/* Notifications Toggles */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Budget approaching limit alerts
              </span>
              <input
                type="checkbox"
                checked={budgetNotifications}
                onChange={(e) => setBudgetNotifications(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Upcoming bill reminders
              </span>
              <input
                type="checkbox"
                checked={billReminders}
                onChange={(e) => setBillReminders(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" size="sm">
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Data Backup & Export Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Download className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Data Privacy & Export
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Your financial data is private and securely encrypted on your local server. You can export a complete JSON backup of all your accounts, transactions, envelopes, and bills anytime.
        </p>
        <Button variant="outline" size="sm" onClick={handleExportAll} icon={<Download className="w-4 h-4" />}>
          Download Complete Data Backup (JSON)
        </Button>
      </Card>
    </div>
  );
};

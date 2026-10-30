import React, { useState } from 'react';
import {
  Bell,
  Sun,
  Moon,
  Type,
  Sparkles,
  CheckCheck,
  ChevronDown,
  X,
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useNotifications } from '../../context/NotificationContext';
import { Badge } from '../common/Badge';

export interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const { largeTextMode, setLargeTextMode, simplifiedMode, setSimplifiedMode, theme, setTheme } =
    useAccessibility();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Header Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simplified Mode Quick Pill */}
        <button
          onClick={() => setSimplifiedMode(!simplifiedMode)}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            simplifiedMode
              ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
          title="Toggle Simplified Easy Mode"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>{simplifiedMode ? 'Simplified Mode: ON' : 'Simplified'}</span>
        </button>

        {/* Large Text Mode Toggle */}
        <button
          onClick={() => setLargeTextMode(!largeTextMode)}
          className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${
            largeTextMode
              ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-950/50 dark:border-brand-700 dark:text-brand-300'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
          title={largeTextMode ? 'Switch to Standard Text' : 'Comfortable Larger Text Mode'}
          aria-label="Toggle text size"
        >
          <Type className="w-4 h-4" />
          <span className="text-[11px] font-bold hidden md:inline">
            {largeTextMode ? 'A+' : 'A'}
          </span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Currency Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition-colors"
            title="Change primary currency"
          >
            <span>{currency}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isCurrencyDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsCurrencyDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 py-1.5 animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  Select Currency
                </div>
                {availableCurrencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCurrency(c.code);
                      setIsCurrencyDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                      currency === c.code
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{c.label}</span>
                    {currency === c.code && <span className="text-brand-600">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title="Notifications and reminders"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl z-30 overflow-hidden animate-in fade-in duration-150">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Reminders & Alerts
                    </h4>
                    <p className="text-xs text-slate-400">
                      {unreadCount} unread reminder{unreadCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-400">
                      No new alerts right now! You are all caught up.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors ${
                          n.isRead ? 'opacity-70 bg-transparent' : 'bg-slate-50/70 dark:bg-slate-800/60'
                        }`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {n.title}
                          </span>
                          <Badge
                            size="sm"
                            variant={
                              n.type === 'BILL_DUE'
                                ? 'danger'
                                : n.type === 'BUDGET_WARNING'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {n.type === 'BILL_DUE'
                              ? 'Bill'
                              : n.type === 'BUDGET_WARNING'
                              ? 'Budget'
                              : 'Alert'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

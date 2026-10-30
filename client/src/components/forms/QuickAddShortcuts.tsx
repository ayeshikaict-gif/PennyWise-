import React from 'react';
import { Coffee, ShoppingCart, Fuel, Bus, Briefcase, Utensils, Zap } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export interface ShortcutItem {
  id: string;
  label: string;
  type: 'EXPENSE' | 'INCOME';
  categoryName: string;
  defaultAmounts: Record<string, number>;
  icon: React.ReactNode;
}

const SHORTCUTS: ShortcutItem[] = [
  {
    id: 'coffee',
    label: 'Coffee / Tea',
    type: 'EXPENSE',
    categoryName: 'Food and groceries',
    defaultAmounts: { LKR: 250, USD: 4, EUR: 3.5, GBP: 3, INR: 50 },
    icon: <Coffee className="w-4 h-4 text-amber-600" />,
  },
  {
    id: 'groceries',
    label: 'Groceries',
    type: 'EXPENSE',
    categoryName: 'Food and groceries',
    defaultAmounts: { LKR: 3500, USD: 35, EUR: 30, GBP: 25, INR: 800 },
    icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'transit',
    label: 'Transit / Bus',
    type: 'EXPENSE',
    categoryName: 'Transportation',
    defaultAmounts: { LKR: 350, USD: 3, EUR: 2.5, GBP: 2.5, INR: 60 },
    icon: <Bus className="w-4 h-4 text-sky-600" />,
  },
  {
    id: 'fuel',
    label: 'Fuel Refill',
    type: 'EXPENSE',
    categoryName: 'Transportation',
    defaultAmounts: { LKR: 4500, USD: 40, EUR: 38, GBP: 35, INR: 1000 },
    icon: <Fuel className="w-4 h-4 text-orange-600" />,
  },
  {
    id: 'lunch',
    label: 'Lunch Meal',
    type: 'EXPENSE',
    categoryName: 'Food and groceries',
    defaultAmounts: { LKR: 750, USD: 10, EUR: 9, GBP: 8, INR: 200 },
    icon: <Utensils className="w-4 h-4 text-rose-500" />,
  },
  {
    id: 'salary',
    label: 'Salary Income',
    type: 'INCOME',
    categoryName: 'Salary',
    defaultAmounts: { LKR: 180000, USD: 2500, EUR: 2200, GBP: 2000, INR: 50000 },
    icon: <Briefcase className="w-4 h-4 text-brand-600" />,
  },
];

export interface QuickAddShortcutsProps {
  onSelectShortcut: (shortcut: {
    type: 'EXPENSE' | 'INCOME';
    categoryName: string;
    amount: number;
    description: string;
  }) => void;
}

export const QuickAddShortcuts: React.FC<QuickAddShortcutsProps> = ({ onSelectShortcut }) => {
  const { currency, formatMoney } = useCurrency();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Quick 1-Click Shortcuts
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {SHORTCUTS.map((s) => {
          const amount = s.defaultAmounts[currency] || s.defaultAmounts['LKR'] || 100;
          return (
            <button
              key={s.id}
              onClick={() =>
                onSelectShortcut({
                  type: s.type,
                  categoryName: s.categoryName,
                  amount,
                  description: `${s.label} Quick Entry`,
                })
              }
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-center group active:scale-95"
            >
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-xs mb-1.5 group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                {s.label}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {formatMoney(amount)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

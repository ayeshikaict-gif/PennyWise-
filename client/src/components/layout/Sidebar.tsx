import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  PieChart,
  PiggyBank,
  Wallet,
  Receipt,
  FileBarChart,
  Settings,
  PlusCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const { user, logout } = useAuth();
  const { simplifiedMode, largeTextMode } = useAccessibility();

  // Full standard navigation list
  const standardNavItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'bills', label: 'Bills & Payments', icon: Receipt },
    { id: 'reports', label: 'Reports & Insights', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Simplified navigation list for beginners, students, or retirees
  const simplifiedNavItems = [
    { id: 'overview', label: 'Home Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Money In & Out', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Spending Budgets', icon: PieChart },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'bills', label: 'Upcoming Bills', icon: Receipt },
    { id: 'settings', label: 'Settings & Comfort', icon: Settings },
  ];

  const navItems = simplifiedMode ? simplifiedNavItems : standardNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-200">
      {/* App Logo */}
      <div className="flex items-center gap-3 px-6 h-20 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Penny<span className="text-brand-600 dark:text-brand-400">Wise</span>
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Personal Finance
          </p>
        </div>
      </div>

      {/* Prominent Add Transaction Button */}
      <div className="p-4 px-5">
        <button
          onClick={onOpenAddTransaction}
          className="w-full flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-2xl shadow-sm shadow-brand-600/30 transition-all duration-150 active:scale-[0.98] group"
        >
          <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span className={largeTextMode ? 'text-base' : 'text-sm'}>+ Add Transaction</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-left font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-semibold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
              } ${largeTextMode ? 'text-base py-3' : 'text-sm'}`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile & Sign Out Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

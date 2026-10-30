import React, { useState } from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PieChart,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Receipt,
  FileBarChart,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddTransaction: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const { logout } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const moreItems = [
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown },
    { id: 'savings', label: 'Savings Goals', icon: PiggyBank },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'bills', label: 'Bills & Payments', icon: Receipt },
    { id: 'reports', label: 'Reports & Insights', icon: FileBarChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectMoreItem = (id: string) => {
    onSelectTab(id);
    setIsMoreOpen(false);
  };

  return (
    <>
      {/* More Modal Drawer */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800 z-10 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                More Financial Tools
              </h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectMoreItem(item.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl text-left font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-800'
                        : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-brand-600 dark:text-brand-400" />
                    <span className="text-sm truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-rose-600 bg-rose-50 dark:bg-rose-950/30 text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-40 px-2 py-2 flex items-center justify-around shadow-lg">
        {/* Home */}
        <button
          onClick={() => onSelectTab('overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'overview'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] mt-1">Home</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'transactions'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-[11px] mt-1">History</span>
        </button>

        {/* Center Prominent Add Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenAddTransaction}
            className="w-13 h-13 w-12 h-12 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-600/40 active:scale-95 transition-transform"
            aria-label="Add transaction"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </div>

        {/* Budgets */}
        <button
          onClick={() => onSelectTab('budgets')}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            currentTab === 'budgets'
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[11px] mt-1">Budgets</span>
        </button>

        {/* More */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 ${
            isMoreOpen || moreItems.some((i) => i.id === currentTab)
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] mt-1">More</span>
        </button>
      </nav>
    </>
  );
};

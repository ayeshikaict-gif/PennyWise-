import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage';
import { AccountsPage } from './pages/AccountsPage';
import { BillsPage } from './pages/BillsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionModal } from './components/forms/TransactionModal';
import { OnboardingModal } from './components/forms/OnboardingModal';
import { api } from './api/client';
import { Account, Category, Transaction } from './types';

export const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [editTxData, setEditTxData] = useState<Partial<Transaction> | null>(null);

  // Onboarding Modal State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Refresh trigger for summary/metrics
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const loadBaseData = async () => {
    if (!isAuthenticated) return;
    try {
      const [accs, cats] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
      ]);
      setAccounts(accs);
      setCategories(cats);

      // Check onboarding for first time
      const onboarded = localStorage.getItem('pennywise_onboarding_completed');
      if (!onboarded && accs.length === 0) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Failed to load accounts & categories:', err);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, [isAuthenticated, refreshKey]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading PennyWise...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleOpenAddTransaction = (prefill?: any) => {
    if (prefill) {
      // Find matching category
      const cat = categories.find(
        (c) => c.name.toLowerCase() === prefill.categoryName?.toLowerCase()
      );
      setEditTxData({
        type: prefill.type || 'EXPENSE',
        amount: prefill.amount,
        categoryId: cat?.id || undefined,
        description: prefill.description,
      });
    } else {
      setEditTxData(null);
    }
    setIsTxModalOpen(true);
  };

  const handleOpenTransfer = (fromAccountId?: string) => {
    setEditTxData({
      type: 'TRANSFER',
      accountId: fromAccountId,
    });
    setIsTxModalOpen(true);
  };

  const handleTransactionSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Financial Overview',
      subtitle: `Welcome back, ${user?.name || 'Friend'}! Here is your money at a glance.`,
    },
    transactions: {
      title: 'Transactions',
      subtitle: 'Complete searchable record of your earnings and expenses.',
    },
    income: {
      title: 'Income Sources',
      subtitle: 'Track allowances, salaries, pensions, and freelance projects.',
    },
    expenses: {
      title: 'Expense Tracker',
      subtitle: 'Understand your spending habits and recurring living costs.',
    },
    budgets: {
      title: 'Spending Budgets',
      subtitle: 'Set comfortable monthly envelopes and track remaining allowances.',
    },
    savings: {
      title: 'Savings Goals',
      subtitle: 'Work towards milestones like emergencies, holidays, or a laptop.',
    },
    accounts: {
      title: 'Accounts & Wallets',
      subtitle: 'Manage cash in hand, digital wallets, and bank accounts.',
    },
    bills: {
      title: 'Bills & Payments',
      subtitle: 'Scheduled electricity, internet, and recurring obligations.',
    },
    reports: {
      title: 'Reports & Insights',
      subtitle: 'Smart observations, trends, and printable financial statements.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Personalize currency, comfortable text, and accessibility modes.',
    },
  };

  const currentHeaderInfo = pageTitles[currentTab] || {
    title: 'PennyWise',
    subtitle: 'Personal Finance Dashboard',
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddTransaction={() => handleOpenAddTransaction()}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title={currentHeaderInfo.title}
          subtitle={currentHeaderInfo.subtitle}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'overview' && (
            <OverviewPage
              onOpenAddTransaction={handleOpenAddTransaction}
              onNavigateToTab={setCurrentTab}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenAddTransaction={() => handleOpenAddTransaction()}
              onEditTransaction={(t) => {
                setEditTxData(t);
                setIsTxModalOpen(true);
              }}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'income' && (
            <IncomePage
              onOpenAddIncome={() => handleOpenAddTransaction({ type: 'INCOME' })}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesPage
              onOpenAddExpense={() => handleOpenAddTransaction({ type: 'EXPENSE' })}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'budgets' && <BudgetsPage categories={categories} />}

          {currentTab === 'savings' && <SavingsGoalsPage accounts={accounts} />}

          {currentTab === 'accounts' && (
            <AccountsPage
              onOpenTransfer={handleOpenTransfer}
              onRefreshAccounts={loadBaseData}
            />
          )}

          {currentTab === 'bills' && (
            <BillsPage
              accounts={accounts}
              categories={categories}
              onRefreshSummary={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {currentTab === 'reports' && <ReportsPage accounts={accounts} />}

          {currentTab === 'settings' && <SettingsPage accounts={accounts} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddTransaction={() => handleOpenAddTransaction()}
      />

      {/* Shared Quick Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditTxData(null);
        }}
        onSaved={handleTransactionSaved}
        initialData={editTxData}
        accounts={accounts}
        categories={categories}
      />

      {/* Guided Welcome Onboarding Wizard */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={loadBaseData}
      />
    </div>
  );
};

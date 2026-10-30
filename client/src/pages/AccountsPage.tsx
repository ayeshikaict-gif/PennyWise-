import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { AccountModal } from '../components/forms/AccountModal';
import { api } from '../api/client';
import { Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import {
  Wallet,
  Building,
  Smartphone,
  PlusCircle,
  ArrowLeftRight,
  Archive,
  ArchiveRestore,
  Edit2,
  CheckCircle,
} from 'lucide-react';

export interface AccountsPageProps {
  onOpenTransfer: (fromAccountId?: string) => void;
  onRefreshAccounts: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  onOpenTransfer,
  onRefreshAccounts,
}) => {
  const { formatMoney } = useCurrency();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAccounts(includeArchived);
      setAccounts(res);
      onRefreshAccounts();
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, [includeArchived]);

  const handleToggleArchive = async (id: string) => {
    try {
      await api.archiveAccount(id);
      loadAccounts();
    } catch (err) {
      console.error('Failed to archive account:', err);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'SAVINGS':
      case 'CURRENT':
        return <Building className="w-5 h-5 text-sky-600" />;
      case 'DIGITAL_WALLET':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const totalCombinedBalance = activeAccounts
    .filter((a) => !a.isExcludedFromSummary)
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-600" />
            <span>Accounts & Wallets</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Keep track of physical cash, savings, checking, and digital wallets in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenTransfer()}
            icon={<ArrowLeftRight className="w-4 h-4" />}
          >
            Transfer Between Accounts
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedAccount(null);
              setIsModalOpen(true);
            }}
            icon={<PlusCircle className="w-4 h-4" />}
          >
            + Add Account
          </Button>
        </div>
      </div>

      {/* Total Balance Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Combined Net Worth (Active Accounts)
            </span>
            <p className="text-3xl font-black tracking-tight mt-1 text-white">
              {formatMoney(totalCombinedBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeAccounts.length} active account{activeAccounts.length === 1 ? '' : 's'} tracked
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="rounded text-brand-500"
              />
              <span>Show Archived</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8" />}
          title="No financial accounts yet"
          description="Add your first wallet, savings account, or bank card to start tracking balances accurately."
          actionText="+ Add Your First Account"
          onAction={() => {
            setSelectedAccount(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            return (
              <Card
                key={acc.id}
                className={`p-6 flex flex-col justify-between space-y-4 hoverable ${
                  acc.isArchived ? 'opacity-60 bg-slate-100 dark:bg-slate-800/40' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                          {acc.name}
                        </h3>
                        <p className="text-xs text-slate-400 capitalize">
                          {acc.type.toLowerCase().replace('_', ' ')} • {acc.currency}
                        </p>
                      </div>
                    </div>
                    {acc.isArchived ? (
                      <Badge variant="neutral">Archived</Badge>
                    ) : acc.isExcludedFromSummary ? (
                      <Badge variant="warning">Excluded</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>

                  {acc.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {acc.description}
                    </p>
                  )}

                  {/* Balance details */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Current Balance
                    </span>
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                      {formatMoney(acc.currentBalance)}
                    </p>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Opening: {formatMoney(acc.openingBalance)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenTransfer(acc.id)}
                    icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
                  >
                    Transfer
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedAccount(acc);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleArchive(acc.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title={acc.isArchived ? 'Restore account' : 'Archive account'}
                    >
                      {acc.isArchived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAccount(null);
        }}
        onSaved={loadAccounts}
        initialData={selectedAccount}
      />
    </div>
  );
};

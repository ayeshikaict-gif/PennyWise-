import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { api } from '../api/client';
import { Transaction, Account, Category } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { formatDate } from '../utils/formatters';
import {
  Search,
  Filter,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
} from 'lucide-react';

export interface TransactionsPageProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (t: Transaction) => void;
  accounts: Account[];
  categories: Category[];
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
  accounts,
  categories,
}) => {
  const { formatMoney } = useCurrency();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions({
        page,
        limit,
        search,
        type: typeFilter,
        accountId: accountFilter,
        categoryId: categoryFilter,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      setTransactions(res.data);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter, accountFilter, categoryFilter, startDate, endDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setAccountFilter('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters =
    search || typeFilter || accountFilter || categoryFilter || startDate || endDate;

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(deleteId);
      setDeleteId(null);
      loadTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transactions History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Search, filter, and review every recorded money movement.
          </p>
        </div>
        <Button onClick={onOpenAddTransaction} icon={<PlusCircle className="w-4 h-4" />}>
          + Add Transaction
        </Button>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, tag, notes, or amount..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>

        {/* Multi-criteria filter controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Types' },
              { value: 'EXPENSE', label: 'Money Out (Expense)' },
              { value: 'INCOME', label: 'Money In (Income)' },
              { value: 'TRANSFER', label: 'Transfers' },
            ]}
          />

          <Select
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Accounts' },
              ...accounts.map((a) => ({ value: a.id, label: a.name })),
            ]}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />

          <Input
            type="date"
            placeholder="From Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />

          <Input
            type="date"
            placeholder="To Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />

          <Select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split(':');
              setSortBy(sb);
              setSortOrder(so);
              setPage(1);
            }}
            options={[
              { value: 'date:desc', label: 'Newest First' },
              { value: 'date:asc', label: 'Oldest First' },
              { value: 'amount:desc', label: 'Highest Amount' },
              { value: 'amount:asc', label: 'Lowest Amount' },
            ]}
          />
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">
              Filtered results: <strong className="text-slate-900 dark:text-white">{totalCount}</strong> transactions found
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-brand-600 font-bold hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          </div>
        )}
      </Card>

      {/* Transactions Table / List */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading records...</p>
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Filter className="w-8 h-8" />}
            title={hasActiveFilters ? 'No transactions matched your filters' : 'No transactions recorded'}
            description={
              hasActiveFilters
                ? 'Try broadening your search term or clearing date boundaries.'
                : 'Your financial journey starts with your first record. Add an expense or income now.'
            }
            actionText={hasActiveFilters ? 'Clear Filters' : '+ Add Transaction'}
            onAction={hasActiveFilters ? clearFilters : onOpenAddTransaction}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description & Details</th>
                  <th className="py-3.5 px-4">Account</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((t) => {
                  const isIncome = t.type === 'INCOME';
                  const isTransfer = t.type === 'TRANSFER';

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>

                      {/* Description & Details */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600'
                                : isTransfer
                                ? 'bg-sky-50 text-sky-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isIncome ? (
                              <TrendingUp className="w-3.5 h-3.5" />
                            ) : isTransfer ? (
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {t.description || (isTransfer ? `Transfer to ${t.toAccount?.name}` : t.category?.name || 'Uncategorized')}
                          </span>
                        </div>
                        {t.tags && (
                          <div className="flex flex-wrap gap-1 mt-1 pl-8">
                            {t.tags.split(',').map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {isTransfer ? (
                          <div className="flex items-center gap-1 font-medium">
                            <span>{t.account?.name}</span>
                            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                            <span>{t.toAccount?.name}</span>
                          </div>
                        ) : (
                          t.account?.name
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isTransfer ? (
                          <Badge size="sm" variant="info">
                            Internal Transfer
                          </Badge>
                        ) : t.category ? (
                          <Badge
                            size="sm"
                            variant={isIncome ? 'success' : 'neutral'}
                          >
                            {t.category.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-black">
                        <span
                          className={
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isTransfer
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatMoney(t.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditTransaction(t)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(t.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                icon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to remove this transaction? Your account balances and reports will be updated accordingly."
        confirmText="Delete"
        isDangerous={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

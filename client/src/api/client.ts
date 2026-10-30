import {
  INITIAL_DEMO_USER,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_GOALS,
  INITIAL_BILLS,
} from './mockData';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Local Storage Fallback Store for Vercel / Static Previews
class LocalStore {
  private get<T>(key: string, defaultValue: T): T {
    const raw = localStorage.getItem(`pennywise_local_${key}`);
    if (!raw) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, val: T): void {
    localStorage.setItem(`pennywise_local_${key}`, JSON.stringify(val));
  }

  getUser() {
    return this.get('user', INITIAL_DEMO_USER);
  }

  setUser(u: any) {
    this.set('user', u);
  }

  getAccounts() {
    return this.get('accounts', INITIAL_ACCOUNTS);
  }

  setAccounts(a: any[]) {
    this.set('accounts', a);
  }

  getCategories() {
    return this.get('categories', INITIAL_CATEGORIES);
  }

  getTransactions() {
    return this.get('transactions', INITIAL_TRANSACTIONS);
  }

  setTransactions(t: any[]) {
    this.set('transactions', t);
  }

  getBudgets() {
    return this.get('budgets', INITIAL_BUDGETS);
  }

  setBudgets(b: any[]) {
    this.set('budgets', b);
  }

  getGoals() {
    return this.get('goals', INITIAL_GOALS);
  }

  setGoals(g: any[]) {
    this.set('goals', g);
  }

  getBills() {
    return this.get('bills', INITIAL_BILLS);
  }

  setBills(b: any[]) {
    this.set('bills', b);
  }
}

const localStore = new LocalStore();

async function handleLocalFallback(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};

  // Auth
  if (endpoint.startsWith('/auth/demo')) {
    return {
      message: 'Demo login successful',
      token: 'demo-token-12345',
      user: localStore.getUser(),
    };
  }
  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
    const user = {
      ...localStore.getUser(),
      name: body.name || 'User',
      email: body.email,
    };
    localStore.setUser(user);
    return {
      message: 'Success',
      token: 'local-token-12345',
      user,
    };
  }
  if (endpoint.startsWith('/auth/me')) {
    return localStore.getUser();
  }

  // Accounts
  if (endpoint.startsWith('/accounts/transfer') && method === 'POST') {
    const accounts = localStore.getAccounts();
    const from = accounts.find((a) => a.id === body.fromAccountId);
    const to = accounts.find((a) => a.id === body.toAccountId);
    if (from && to) {
      from.currentBalance = (from.currentBalance || from.openingBalance) - body.amount;
      to.currentBalance = (to.currentBalance || to.openingBalance) + body.amount;
      localStore.setAccounts(accounts);
    }
    const txs = localStore.getTransactions();
    const newTx = {
      id: `tx-${Date.now()}`,
      userId: 'demo-user-1',
      accountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      account: from,
      toAccount: to,
      type: 'TRANSFER' as const,
      amount: body.amount,
      date: body.date || new Date().toISOString(),
      description: body.description || 'Internal Account Transfer',
      isRecurring: false,
      createdAt: new Date().toISOString(),
    };
    localStore.setTransactions([newTx, ...txs]);
    return { message: 'Transfer completed', transaction: newTx };
  }

  if (endpoint.startsWith('/accounts')) {
    if (method === 'POST') {
      const accounts = localStore.getAccounts();
      const newAcc = {
        id: `acc-${Date.now()}`,
        userId: 'demo-user-1',
        ...body,
        currentBalance: body.openingBalance,
        isArchived: false,
        createdAt: new Date().toISOString(),
      };
      localStore.setAccounts([...accounts, newAcc]);
      return newAcc;
    }
    return localStore.getAccounts();
  }

  // Categories
  if (endpoint.startsWith('/categories')) {
    return localStore.getCategories();
  }

  // Transactions Summary
  if (endpoint.startsWith('/transactions/summary')) {
    const txs = localStore.getTransactions();
    const income = txs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    const accounts = localStore.getAccounts();
    const totalBalance = accounts
      .filter((a) => !a.isExcludedFromSummary)
      .reduce((s, a) => s + (a.currentBalance || a.openingBalance), 0);
    const bills = localStore.getBills();
    const unpaidBills = bills.filter((b) => b.status === 'UNPAID').reduce((s, b) => s + b.expectedAmount, 0);

    return {
      totalBalance,
      income,
      expenses,
      netCashFlow: income - expenses,
      savingsTotal: 485000,
      availableToSpend: Math.max(0, totalBalance - unpaidBills - 15000),
      availableToSpendBreakdown: {
        totalBalance,
        unpaidBills,
        budgetCommitments: 15000,
        explanation: `Calculated as Total Balance (${totalBalance}) minus upcoming bills (${unpaidBills}) and planned budget reserve (15,000).`,
      },
      previousPeriod: { income: 175000, expenses: 32000, netCashFlow: 143000, balanceChange: 5000 },
    };
  }

  // Transactions List & Create
  if (endpoint.startsWith('/transactions')) {
    if (method === 'POST') {
      const txs = localStore.getTransactions();
      const cats = localStore.getCategories();
      const accs = localStore.getAccounts();
      const cat = cats.find((c) => c.id === body.categoryId);
      const acc = accs.find((a) => a.id === body.accountId);

      const newTx = {
        id: `tx-${Date.now()}`,
        userId: 'demo-user-1',
        ...body,
        category: cat,
        account: acc,
        createdAt: new Date().toISOString(),
      };
      localStore.setTransactions([newTx, ...txs]);

      // Update account balance
      if (acc) {
        if (body.type === 'INCOME') acc.currentBalance = (acc.currentBalance || acc.openingBalance) + body.amount;
        if (body.type === 'EXPENSE') acc.currentBalance = (acc.currentBalance || acc.openingBalance) - body.amount;
        localStore.setAccounts(accs);
      }
      return { message: 'Recorded successfully', transaction: newTx };
    }

    if (method === 'DELETE') {
      const id = endpoint.split('/')[2];
      const txs = localStore.getTransactions().filter((t) => t.id !== id);
      localStore.setTransactions(txs);
      return { message: 'Deleted' };
    }

    const txs = localStore.getTransactions();
    return { data: txs, pagination: { total: txs.length, page: 1, limit: 50, totalPages: 1 } };
  }

  // Budgets
  if (endpoint.startsWith('/budgets')) {
    if (method === 'POST') {
      const budgets = localStore.getBudgets();
      const cats = localStore.getCategories();
      const cat = cats.find((c) => c.id === body.categoryId);
      const newBudget = {
        id: `bg-${Date.now()}`,
        userId: 'demo-user-1',
        ...body,
        category: cat,
        spent: 0,
        remaining: body.amount,
        percentUsed: 0,
        isExceeded: false,
        isNearLimit: false,
      };
      localStore.setBudgets([newBudget, ...budgets]);
      return { message: 'Budget saved', budget: newBudget };
    }
    return { month: new Date().getMonth() + 1, year: new Date().getFullYear(), budgets: localStore.getBudgets() };
  }

  // Savings Goals
  if (endpoint.startsWith('/savings')) {
    if (endpoint.includes('/contribute') && method === 'POST') {
      const id = endpoint.split('/')[2];
      const goals = localStore.getGoals();
      const g = goals.find((item) => item.id === id);
      if (g) {
        g.currentAmount = Math.max(0, g.currentAmount + body.amount);
        g.progressPercentage = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
        localStore.setGoals(goals);
      }
      return { message: 'Updated goal', goal: g };
    }
    if (method === 'POST') {
      const goals = localStore.getGoals();
      const newGoal = {
        id: `goal-${Date.now()}`,
        userId: 'demo-user-1',
        ...body,
        progressPercentage: Math.round((body.currentAmount / body.targetAmount) * 100),
      };
      localStore.setGoals([...goals, newGoal]);
      return { message: 'Goal created', goal: newGoal };
    }
    return localStore.getGoals();
  }

  // Bills
  if (endpoint.startsWith('/bills')) {
    if (endpoint.includes('/pay') && method === 'POST') {
      const id = endpoint.split('/')[2];
      const bills = localStore.getBills();
      const b = bills.find((item) => item.id === id);
      if (b) {
        b.status = 'PAID';
        b.lastPaidDate = new Date().toISOString();
        localStore.setBills(bills);
      }
      return { message: 'Bill marked as paid', bill: b };
    }
    if (method === 'POST') {
      const bills = localStore.getBills();
      const newBill = {
        id: `bill-${Date.now()}`,
        userId: 'demo-user-1',
        ...body,
      };
      localStore.setBills([...bills, newBill]);
      return { message: 'Bill created', bill: newBill };
    }
    return localStore.getBills();
  }

  // Reports
  if (endpoint.startsWith('/reports')) {
    const txs = localStore.getTransactions();
    const expenseTxs = txs.filter((t) => t.type === 'EXPENSE');
    const incomeTxs = txs.filter((t) => t.type === 'INCOME');

    return {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      categoryBreakdown: [
        { name: 'Food and groceries', amount: 27250, count: 3, color: '#EF4444', icon: 'shopping-cart' },
        { name: 'Transportation', amount: 9000, count: 2, color: '#F97316', icon: 'car' },
        { name: 'Entertainment', amount: 3200, count: 1, color: '#06B6D4', icon: 'film' },
      ],
      incomeBreakdown: [
        { name: 'Salary', amount: 185000, count: 1, color: '#10B981', icon: 'briefcase' },
        { name: 'Freelance work', amount: 45000, count: 1, color: '#059669', icon: 'laptop' },
      ],
      monthlyTrends: [
        { monthLabel: 'May', income: 160000, expenses: 31000, net: 129000 },
        { monthLabel: 'Jun', income: 165000, expenses: 35000, net: 130000 },
        { monthLabel: 'Jul', income: 170000, expenses: 34000, net: 136000 },
        { monthLabel: 'Aug', income: 175000, expenses: 38000, net: 137000 },
        { monthLabel: 'Sep', income: 175000, expenses: 36000, net: 139000 },
        { monthLabel: 'Oct', income: 230000, expenses: 39450, net: 190550 },
      ],
      insights: [
        {
          id: 'ins-1',
          type: 'positive' as const,
          title: 'Positive Cash Flow',
          description: 'Your recorded income this month is higher than your spending by Rs. 190,550.',
        },
        {
          id: 'ins-2',
          type: 'info' as const,
          title: 'Top Expense Category',
          description: 'Food and groceries is your largest spending category this month (69% of spending).',
        },
      ],
    };
  }

  // Settings
  if (endpoint.startsWith('/settings')) {
    if (method === 'PUT') {
      const u = localStore.getUser();
      u.preferences = { ...u.preferences, ...body };
      localStore.setUser(u);
      return { message: 'Updated', preferences: u.preferences };
    }
    return localStore.getUser();
  }

  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pennywise_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // If 404 on Vercel preview (backend not hosted separately), fall back seamlessly
      if (response.status === 404 || response.status === 502) {
        return (await handleLocalFallback(endpoint, options)) as T;
      }
      let errorMessage = 'An error occurred. Please try again.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (_) {}
      throw new ApiError(errorMessage, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      return (await response.text()) as unknown as T;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err: any) {
    // If Network failure or offline (e.g., static Vercel deployment), fall back seamlessly!
    if (
      err.name === 'TypeError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError')
    ) {
      return (await handleLocalFallback(endpoint, options)) as T;
    }
    throw err;
  }
}

export const api = {
  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  demoLogin: () => request<any>('/auth/demo', { method: 'POST' }),
  getProfile: () => request<any>('/auth/me'),

  // Accounts
  getAccounts: (includeArchived = false) => request<any[]>(`/accounts?includeArchived=${includeArchived}`),
  createAccount: (data: any) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) => request<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveAccount: (id: string) => request<any>(`/accounts/${id}/archive`, { method: 'PATCH' }),
  transfer: (data: any) => request<any>('/accounts/transfer', { method: 'POST', body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val.toString());
      }
    });
    return request<{ data: any[]; pagination: any }>(`/transactions?${query.toString()}`);
  },
  getSummary: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return request<any>(`/transactions/summary?${query.toString()}`);
  },
  createTransaction: (data: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) => request<any>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => request<any>(`/transactions/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: (type?: string) => request<any[]>(`/categories${type ? `?type=${type}` : ''}`),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (month?: number, year?: number) => {
    const query = new URLSearchParams();
    if (month) query.append('month', month.toString());
    if (year) query.append('year', year.toString());
    return request<{ month: number; year: number; budgets: any[] }>(`/budgets?${query.toString()}`);
  },
  saveBudget: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  copyBudgets: (data: any) => request<any>('/budgets/copy', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id: string) => request<any>(`/budgets/${id}`, { method: 'DELETE' }),

  // Savings Goals
  getGoals: () => request<any[]>('/savings'),
  createGoal: (data: any) => request<any>('/savings', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, data: any) => request<any>(`/savings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  contributeGoal: (id: string, data: any) => request<any>(`/savings/${id}/contribute`, { method: 'POST', body: JSON.stringify(data) }),
  deleteGoal: (id: string) => request<any>(`/savings/${id}`, { method: 'DELETE' }),

  // Bills
  getBills: () => request<any[]>('/bills'),
  createBill: (data: any) => request<any>('/bills', { method: 'POST', body: JSON.stringify(data) }),
  updateBill: (id: string, data: any) => request<any>(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  payBill: (id: string, data: any) => request<any>(`/bills/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),
  deleteBill: (id: string) => request<any>(`/bills/${id}`, { method: 'DELETE' }),

  // Reports
  getReports: (startDate?: string, endDate?: string, accountId?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (accountId) query.append('accountId', accountId);
    return request<any>(`/reports?${query.toString()}`);
  },
  exportCsvUrl: (startDate?: string, endDate?: string, type?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (type) query.append('type', type);
    return `/api/reports/export-csv?${query.toString()}`;
  },

  // Settings
  getSettings: () => request<any>('/settings'),
  updatePreferences: (data: any) => request<any>('/settings/preferences', { method: 'PUT', body: JSON.stringify(data) }),
  exportAllUrl: () => '/api/settings/export-all',
};

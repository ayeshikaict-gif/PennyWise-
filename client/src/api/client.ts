const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred. Please try again.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (_) {
      // response wasn't JSON
    }
    throw new ApiError(errorMessage, response.status);
  }

  // If response is CSV or plain text
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as unknown as T;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
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

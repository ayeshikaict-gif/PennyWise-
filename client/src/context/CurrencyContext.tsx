import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { formatCurrency } from '../utils/formatters';

interface CurrencyContextType {
  currency: string;
  setCurrency: (c: string) => void;
  formatMoney: (amount: number | undefined | null) => string;
  availableCurrencies: Array<{ code: string; label: string; symbol: string }>;
}

const AVAILABLE_CURRENCIES = [
  { code: 'LKR', label: 'Sri Lankan Rupee (Rs.)', symbol: 'Rs.' },
  { code: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', label: 'Euro (€)', symbol: '€' },
  { code: 'GBP', label: 'British Pound (£)', symbol: '£' },
  { code: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
  { code: 'AUD', label: 'Australian Dollar (A$)', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar (C$)', symbol: 'C$' },
];

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserPreferences } = useAuth();
  const [currency, setCurrencyState] = useState<string>(user?.preferences?.currency || 'LKR');

  useEffect(() => {
    if (user?.preferences?.currency) {
      setCurrencyState(user.preferences.currency);
    }
  }, [user?.preferences?.currency]);

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    if (user) {
      updateUserPreferences({ currency: newCurrency });
    }
  };

  const formatMoney = (amount: number | undefined | null) => {
    return formatCurrency(amount, currency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatMoney,
        availableCurrencies: AVAILABLE_CURRENCIES,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

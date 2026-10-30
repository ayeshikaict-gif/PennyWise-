import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'BILL_DUE' | 'BUDGET_WARNING' | 'GOAL_MILESTONE' | 'SYSTEM';
  date: string;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const generateDynamicNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const items: AppNotification[] = [];

      // Check upcoming bills
      const bills = await api.getBills();
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      bills.forEach((b: any) => {
        const dueDate = new Date(b.dueDate);
        if (b.status === 'OVERDUE') {
          items.push({
            id: `bill-overdue-${b.id}`,
            title: 'Bill Overdue',
            message: `${b.name} (${b.expectedAmount}) was due on ${dueDate.toLocaleDateString()}.`,
            type: 'BILL_DUE',
            date: new Date().toISOString(),
            isRead: false,
          });
        } else if (b.status === 'UNPAID' && dueDate <= sevenDaysFromNow) {
          items.push({
            id: `bill-due-${b.id}`,
            title: 'Upcoming Bill Payment',
            message: `${b.name} is due soon on ${dueDate.toLocaleDateString()}.`,
            type: 'BILL_DUE',
            date: new Date().toISOString(),
            isRead: false,
          });
        }
      });

      // Check budget warnings
      const budgetData = await api.getBudgets();
      budgetData.budgets?.forEach((bg: any) => {
        if (bg.isExceeded) {
          items.push({
            id: `budget-exc-${bg.id}`,
            title: 'Budget Limit Exceeded',
            message: `Spending for ${bg.category?.name || 'Overall'} has exceeded its planned limit.`,
            type: 'BUDGET_WARNING',
            date: new Date().toISOString(),
            isRead: false,
          });
        } else if (bg.isNearLimit) {
          items.push({
            id: `budget-warn-${bg.id}`,
            title: 'Budget Approaching Limit',
            message: `You have reached ${bg.percentUsed}% of your ${bg.category?.name || 'Overall'} budget.`,
            type: 'BUDGET_WARNING',
            date: new Date().toISOString(),
            isRead: false,
          });
        }
      });

      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    generateDynamicNotifications();
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: generateDynamicNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

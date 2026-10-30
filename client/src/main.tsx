import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CurrencyProvider>
        <AccessibilityProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AccessibilityProvider>
      </CurrencyProvider>
    </AuthProvider>
  </React.StrictMode>
);

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AccessibilityContextType {
  largeTextMode: boolean;
  setLargeTextMode: (val: boolean) => void;
  simplifiedMode: boolean;
  setSimplifiedMode: (val: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserPreferences } = useAuth();

  const [largeTextMode, setLargeTextModeState] = useState<boolean>(
    user?.preferences?.largeTextMode || false
  );
  const [simplifiedMode, setSimplifiedModeState] = useState<boolean>(
    user?.preferences?.simplifiedMode || false
  );
  const [theme, setThemeState] = useState<'light' | 'dark'>(
    (user?.preferences?.theme as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.largeTextMode !== undefined) {
        setLargeTextModeState(user.preferences.largeTextMode);
      }
      if (user.preferences.simplifiedMode !== undefined) {
        setSimplifiedModeState(user.preferences.simplifiedMode);
      }
      if (user.preferences.theme) {
        setThemeState(user.preferences.theme as 'light' | 'dark');
      }
    }
  }, [user?.preferences]);

  // Sync DOM classes for theme and text sizing
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (largeTextMode) {
      root.classList.add('text-lg');
      root.classList.add('large-text-active');
    } else {
      root.classList.remove('text-lg');
      root.classList.remove('large-text-active');
    }
  }, [theme, largeTextMode]);

  const setLargeTextMode = (val: boolean) => {
    setLargeTextModeState(val);
    if (user) {
      updateUserPreferences({ largeTextMode: val });
    }
  };

  const setSimplifiedMode = (val: boolean) => {
    setSimplifiedModeState(val);
    if (user) {
      updateUserPreferences({ simplifiedMode: val });
    }
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (user) {
      updateUserPreferences({ theme: newTheme });
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        largeTextMode,
        setLargeTextMode,
        simplifiedMode,
        setSimplifiedMode,
        theme,
        setTheme,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

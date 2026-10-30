import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Sparkles, ShieldCheck, ArrowRight, Lock, Mail, User, PlayCircle } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register, demoLogin } = useAuth();
  const { availableCurrencies } = useCurrency();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('LKR');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'REGISTER' && !name) {
      setError('Please provide your name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'LOGIN') {
        await login(email, password);
      } else {
        await register(name, email, password, currency);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError('');
    setIsDemoLoading(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to start demo sandbox.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 to-emerald-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/20 mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Penny<span className="text-brand-600 dark:text-brand-400">Wise</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Personal Finance for Everyone — simple as sending a message.
        </p>
      </div>

      {/* Main Auth Card */}
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-xl border-slate-200/90 dark:border-slate-800">
        {/* 1-Click Demo Sandbox Pill */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-emerald-50 dark:from-brand-950/40 dark:to-emerald-950/30 border border-brand-200 dark:border-brand-800 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-brand-700 dark:text-brand-300 font-extrabold text-xs uppercase tracking-wider">
            <PlayCircle className="w-4 h-4" />
            <span>Instant Demo Mode</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Want to test PennyWise immediately without creating an account? Explore pre-loaded Sri Lankan accounts, budgets, and bills!
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDemoClick}
            isLoading={isDemoLoading}
            className="w-full shadow-md"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Launch 1-Click Demo Sandbox
          </Button>
        </div>

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-slate-400">
            or sign into your private account
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5 select-none">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError('');
            }}
            className={`py-2 rounded-lg font-bold text-xs transition-all ${
              mode === 'LOGIN'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError('');
            }}
            className={`py-2 rounded-lg font-bold text-xs transition-all ${
              mode === 'REGISTER'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'REGISTER' && (
            <Input
              label="Your Name *"
              placeholder="e.g. Kasun or Sunethra"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
          )}

          <Input
            type="email"
            label="Email Address *"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            type="password"
            label="Password *"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
          />

          {mode === 'REGISTER' && (
            <Select
              label="Preferred Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={availableCurrencies.map((c) => ({
                value: c.code,
                label: c.label,
              }))}
            />
          )}

          <Button type="submit" size="md" className="w-full mt-2" isLoading={isLoading}>
            {mode === 'LOGIN' ? 'Sign In to PennyWise' : 'Complete Registration'}
          </Button>
        </form>

        {/* Privacy Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" />
          <span>Private, self-hosted finance. Never requests bank passwords or PINs.</span>
        </div>
      </Card>
    </div>
  );
};

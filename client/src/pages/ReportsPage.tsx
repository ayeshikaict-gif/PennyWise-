import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart';
import { CategoryPieChart } from '../components/charts/CategoryPieChart';
import { SpendingTrendChart } from '../components/charts/SpendingTrendChart';
import { api } from '../api/client';
import { Account, ReportData, Insight } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import {
  FileBarChart,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from 'lucide-react';

export interface ReportsPageProps {
  accounts: Account[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ accounts }) => {
  const { formatMoney } = useCurrency();

  const now = new Date();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  );

  const [report, setReport] = useState<ReportData | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const [repData, sumData] = await Promise.all([
        api.getReports(startDate, endDate, selectedAccountId || undefined),
        api.getSummary(startDate, endDate),
      ]);
      setReport(repData);
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [startDate, endDate, selectedAccountId]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    window.open(api.exportCsvUrl(startDate, endDate), '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:space-y-4">
      {/* Header & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-brand-600" />
            <span>Reports & Financial Insights</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Export statement data, review trends, and read plain-language spending observations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Print / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Printable Report Header (Visible only when printed) */}
      <div className="hidden print:block border-b border-slate-300 pb-4 mb-4">
        <h1 className="text-2xl font-black text-slate-900">PennyWise Financial Statement</h1>
        <p className="text-xs text-slate-500">
          Reporting Window: {startDate} to {endDate} • Generated on {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Filter Toolbar (Hidden on print) */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
          />

          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs ml-2 font-medium"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <Button size="sm" variant="ghost" onClick={loadReport}>
          Refresh
        </Button>
      </Card>

      {/* Plain-Language Automated Insights Strip */}
      {report?.insights && report.insights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Smart Financial Observations
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.insights.map((ins: Insight) => (
              <Card
                key={ins.id}
                className={`p-4 flex items-start gap-3 border ${
                  ins.type === 'positive'
                    ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : ins.type === 'warning'
                    ? 'border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-sky-200 dark:border-sky-900 bg-sky-50/40 dark:bg-sky-950/20'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {ins.type === 'positive' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : ins.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Info className="w-5 h-5 text-sky-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {ins.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {ins.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary Scorecard Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Money In</span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">
            +{formatMoney(summary?.income)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Total Money Out</span>
          <p className="text-xl font-black text-rose-600 mt-0.5">
            -{formatMoney(summary?.expenses)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Net Surplus / Flow</span>
          <p
            className={`text-xl font-black mt-0.5 ${
              (summary?.netCashFlow || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatMoney(summary?.netCashFlow)}
          </p>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-bold uppercase text-slate-400">Available to Spend</span>
          <p className="text-xl font-black text-sky-600 mt-0.5">
            {formatMoney(summary?.availableToSpend)}
          </p>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Spending by Category
          </h3>
          <CategoryPieChart
            data={report?.categoryBreakdown || []}
            totalAmount={summary?.expenses || 0}
          />
        </Card>

        <Card>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Income by Category
          </h3>
          <CategoryPieChart
            data={report?.incomeBreakdown || []}
            totalAmount={summary?.income || 0}
          />
        </Card>
      </div>

      {/* 6-Month Trend */}
      <Card>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
          Historical Cash Flow Trend
        </h3>
        <SpendingTrendChart data={report?.monthlyTrends || []} />
      </Card>
    </div>
  );
};

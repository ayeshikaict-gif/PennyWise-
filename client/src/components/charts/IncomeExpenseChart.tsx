import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';

export interface IncomeExpenseDataPoint {
  period: string;
  income: number;
  expenses: number;
}

export interface IncomeExpenseChartProps {
  data: IncomeExpenseDataPoint[];
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data }) => {
  const { formatMoney } = useCurrency();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Income: {formatMoney(payload[0]?.value)}
          </p>
          <p className="text-rose-600 dark:text-rose-400 font-semibold">
            Expenses: {formatMoney(payload[1]?.value)}
          </p>
          <p className="text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            Net: {formatMoney((payload[0]?.value || 0) - (payload[1]?.value || 0))}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
          <XAxis
            dataKey="period"
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
          />
          <Bar
            name="Money In (Income)"
            dataKey="income"
            fill="#10B981"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            name="Money Out (Expenses)"
            dataKey="expenses"
            fill="#F43F5E"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

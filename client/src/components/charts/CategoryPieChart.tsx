import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCurrency } from '../../context/CurrencyContext';

export interface CategoryDataPoint {
  name: string;
  amount: number;
  color?: string;
  count?: number;
}

export interface CategoryPieChartProps {
  data: CategoryDataPoint[];
  totalAmount: number;
}

const DEFAULT_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#64748B', '#14B8A6'
];

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, totalAmount }) => {
  const { formatMoney } = useCurrency();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = totalAmount > 0 ? Math.round((item.value / totalAmount) * 100) : 0;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
          <p className="font-extrabold text-slate-900 dark:text-white">
            {formatMoney(item.value)} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0 || totalAmount <= 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 text-center p-4">
        No spending recorded for this period yet.
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 py-2">
      <div className="w-48 h-48 sm:w-56 sm:h-56 shrink-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="amount"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-100">
            {formatMoney(totalAmount)}
          </span>
        </div>
      </div>

      {/* Category Legend list */}
      <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {data.slice(0, 6).map((item, index) => {
          const color = item.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
          const percent = totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-600 dark:text-slate-300 truncate font-medium">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 shrink-0">
                <span>{formatMoney(item.amount)}</span>
                <span className="text-[10px] text-slate-400 font-semibold w-8 text-right">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

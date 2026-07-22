'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays, 
  Coins, 
  CheckCircle2, 
  RefreshCw,
  Info
} from 'lucide-react';

export default function CashFlowMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCashFlowData = async () => {
    setLoading(true);
    const res = await api.get('/dashboard/cashflow');
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setData(res);
    }
  };

  useEffect(() => {
    fetchCashFlowData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading cash flow data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
        Failed to load cash flow monitor: {error}
      </div>
    );
  }

  const {
    previousDayBalance = 0,
    totalDueToday = 0,
    todayDueBalance = 0,
    collectedToday = 0,
    outstandingBalanceToday = 0
  } = data || {};

  // Custom User Formula requested:
  // outstanding balance for today = previous day balance + Collected Today
  const userOutstandingBalanceToday = previousDayBalance + collectedToday;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Cash Flow Monitor</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time daily collection metrics and outstanding debt balances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Previous Day Balance */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prev Day Outstanding</span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            ₭{parseFloat(previousDayBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Unpaid schedules from previous days
          </p>
        </div>

        {/* Today Due Balance */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today Due Balance</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            ₭{parseFloat(todayDueBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-2 font-medium">
            = Prev Day (₭{parseFloat(previousDayBalance).toLocaleString('en-US')}) + Today Due (₭{parseFloat(totalDueToday).toLocaleString('en-US')})
          </p>
        </div>

        {/* Collected Today */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collected Today</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₭{parseFloat(collectedToday).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            Total payments recorded today
          </p>
        </div>

        {/* Outstanding Balance for Today */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-blue-500/30 dark:border-blue-500/20 shadow-sm transition-colors hover:shadow-md bg-gradient-to-br from-white to-blue-500/5 dark:to-blue-950/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Today Outstanding</span>
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-white">
            ₭{parseFloat(userOutstandingBalanceToday).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-2 font-medium">
            = Prev Day (₭{parseFloat(previousDayBalance).toLocaleString('en-US')}) + Collected Today (₭{parseFloat(collectedToday).toLocaleString('en-US')})
          </p>
        </div>

      </div>

      {/* Cash Flow Summary details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">Daily Balance Formulas Breakdown</h2>
        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-350">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">1. Today Due Balance</h3>
            <p className="text-xs text-slate-500 mt-1">This represents the total debt amount due today, including all rollover unpaid balances from yesterday plus new installments starting today.</p>
            <div className="mt-2 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/5 px-3 py-1.5 rounded-lg inline-block">
              Today Due Balance = Previous Day Balance (₭{parseFloat(previousDayBalance).toLocaleString('en-US')}) + Total Due Today (₭{parseFloat(totalDueToday).toLocaleString('en-US')}) = ₭{parseFloat(todayDueBalance).toLocaleString('en-US')}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">2. Outstanding Balance for Today</h3>
            <p className="text-xs text-slate-500 mt-1">This represents the outstanding balance calculated using the customer's preferred custom cash-flow metric.</p>
            <div className="mt-2 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 px-3 py-1.5 rounded-lg inline-block">
              Today Outstanding = Previous Day Balance (₭{parseFloat(previousDayBalance).toLocaleString('en-US')}) + Collected Today (₭{parseFloat(collectedToday).toLocaleString('en-US')}) = ₭{parseFloat(userOutstandingBalanceToday).toLocaleString('en-US')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

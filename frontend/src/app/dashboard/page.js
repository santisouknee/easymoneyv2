'use client';

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  CalendarDays, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Phone,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function DailyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDailyData = async () => {
    setLoading(true);
    const res = await api.get('/dashboard/daily');
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setData(res);
      setError('');
    }
  };

  useEffect(() => {
    fetchDailyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading daily dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
        Failed to load dashboard: {error}
      </div>
    );
  }

  const { todayDue = [], collectionSummary = {}, overdue = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Due Today</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(collectionSummary.totalDueToday || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Expected installments due date today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collected Today</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(collectionSummary.totalCollectedToday || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total collections recorded today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Remaining Due</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(collectionSummary.remainingAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Outstanding amount remaining today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collection Rate</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">
            {collectionSummary.collectionPercentage}%
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${collectionSummary.collectionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Due Payments List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Today's Scheduled Installments</h2>
            <span className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-500 font-semibold rounded-full">
              {todayDue.length} Due
            </span>
          </div>

          {todayDue.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No payments scheduled for today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold uppercase">
                    <th className="py-3 pr-4">Customer</th>
                    <th className="py-3 px-4">Contract No</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 pl-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {todayDue.map((item, index) => (
                    <tr key={index} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3.5 pr-4 font-semibold text-slate-800 dark:text-slate-100">{item.customer_name}</td>
                      <td className="py-3.5 px-4 font-mono text-xs">{item.contract_number}</td>
                      <td className="py-3.5 px-4 text-right font-semibold">
                        ₭{parseFloat(item.amount_due).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 pl-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          item.payment_status === 'paid' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : item.payment_status === 'partial' 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {item.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue Payments Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Overdue Payments</span>
            </h2>
            <span className="text-xs px-2.5 py-1 bg-rose-500/10 text-rose-500 font-semibold rounded-full">
              {overdue.length} Action Needed
            </span>
          </div>

          {overdue.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Great! No outstanding overdue payments.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[350px] space-y-3 pr-1">
              {overdue.map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">{item.customer_name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Contract: {item.contract_number}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {item.phone_number}
                      </span>
                      <span className="text-rose-500 font-semibold">{item.daysLate} days late</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-500">
                      ₭{parseFloat(item.amount_due - item.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Outstanding</p>
                    
                    <Link 
                      href={`/contracts/${item.contract_id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 font-semibold mt-2"
                    >
                      <span>Collect</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

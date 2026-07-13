'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { 
  FileCheck, 
  Files, 
  CalendarRange, 
  CheckSquare, 
  Coins, 
  AlertCircle,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { 
  CollectionTrendChart, 
  OutstandingBalanceChart, 
  PaymentStatusChart 
} from '../../../components/DashboardCharts';

export default function MonthlyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMonthlyData = async () => {
    setLoading(true);
    const res = await api.get('/dashboard/monthly');
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setData(res);
      setError('');
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading monthly dashboard data...</p>
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

  const { kpis = {}, charts = {} } = data || {};

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contracts</span>
            <Files className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{kpis.totalContracts}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Registered overall</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Contracts</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">{kpis.activeContracts}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Currently paying</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Due</span>
            <CalendarRange className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(kpis.monthlyDueAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Due this month</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Collected</span>
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(kpis.monthlyCollectedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Received this month</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(kpis.outstandingAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Overall balance</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-white">
            ₭{parseFloat(kpis.overdueAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Pending overdue</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Collection Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Collection Trend (Last 12 Months)</h2>
          <div className="h-64 flex items-center justify-center">
            {charts.collectionsTrend && charts.collectionsTrend.length > 0 ? (
              <CollectionTrendChart data={charts.collectionsTrend} />
            ) : (
              <p className="text-slate-500 text-sm">No trend data available.</p>
            )}
          </div>
        </div>

        {/* Outstanding Balance Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Outstanding Balance by Month</h2>
          <div className="h-64 flex items-center justify-center">
            {charts.outstandingTrend && charts.outstandingTrend.length > 0 ? (
              <OutstandingBalanceChart data={charts.outstandingTrend} />
            ) : (
              <p className="text-slate-500 text-sm">No outstanding trend data.</p>
            )}
          </div>
        </div>

        {/* Payment Status Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Payment Status Distribution</h2>
          <div className="h-64 flex items-center justify-center">
            {charts.statusDistribution && charts.statusDistribution.length > 0 ? (
              <PaymentStatusChart data={charts.statusDistribution} />
            ) : (
              <p className="text-slate-500 text-sm">No distribution metrics.</p>
            )}
          </div>
        </div>

        {/* Top Customers by Outstanding Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-colors flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">Top Customers by Outstanding Balance</h2>
            <div className="space-y-3">
              {charts.topCustomers && charts.topCustomers.length > 0 ? (
                charts.topCustomers.map((cust, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/20">
                        {index + 1}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cust.customer_name}</span>
                    </div>
                    <span className="text-sm font-bold text-amber-500">
                      ₭{parseFloat(cust.outstanding).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-10">No customer lists with outstanding balances.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

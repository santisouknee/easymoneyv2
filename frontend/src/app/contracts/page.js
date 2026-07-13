'use client';

import { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../utils/api';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  RefreshCw, 
  FilePlus, 
  Eye,
  Calendar,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

const formatInputNumber = (val) => {
  if (!val) return '';
  // Remove all characters except digits and decimal point
  let clean = val.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';
  if (integerPart) {
    integerPart = parseInt(integerPart, 10).toLocaleString('en-US');
  }
  return integerPart + decimalPart;
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [contractNumber, setContractNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [productService, setProductService] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [downPaymentAmount, setDownPaymentAmount] = useState('');
  const [installmentPeriod, setInstallmentPeriod] = useState('12');
  const [startDate, setStartDate] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [paymentType, setPaymentType] = useState('daily_payment');

  const fetchContracts = async (searchVal = '', statusVal = '') => {
    setLoading(true);
    let url = `/contracts?search=${encodeURIComponent(searchVal)}`;
    if (statusVal) url += `&status=${statusVal}`;
    
    const res = await api.get(url);
    setLoading(false);
    if (!res.error) {
      setContracts(res);
    }
  };

  const fetchCustomers = async () => {
    const res = await api.get('/customers');
    if (!res.error) {
      setCustomers(res);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    fetchContracts();
    fetchCustomers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchContracts(search, statusFilter);
  };

  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchContracts(search, val);
  };

  const openAddModal = () => {
    setContractNumber(`CON-${Date.now().toString().slice(-6)}`);
    setCustomerId(customers[0]?.id || '');
    setProductService('');
    setContractDate(new Date().toISOString().split('T')[0]);
    setTotalAmount('');
    setPaymentType('daily_payment');
    setDownPaymentAmount('');
    setInstallmentPeriod('30');
    setStartDate(new Date().toISOString().split('T')[0]);
    setInterestRate('5');
    setError('');
    setShowModal(true);
  };

  const handlePaymentTypeChange = (type) => {
    setPaymentType(type);
    setDownPaymentAmount('');
    setInstallmentPeriod('30');
    setInterestRate('5');
  };

  const handlePeriodChange = (period) => {
    setInstallmentPeriod(period);
    const p = parseInt(period);
    if (paymentType === 'daily_payment') {
      if (p === 30) setInterestRate('5');
      else if (p === 60) setInterestRate('10');
      else if (p >= 90) setInterestRate('15');
    } else {
      if (p === 30) setInterestRate('5');
      else if (p === 60) setInterestRate('10');
      else if (p === 90) setInterestRate('15');
      else if (p === 120) setInterestRate('20');
      else if (p === 150) setInterestRate('25');
      else if (p === 180) setInterestRate('30');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contract? All generated payment schedules will be deleted.')) return;
    const res = await api.delete(`/contracts/${id}`);
    if (res.error) {
      alert(res.error);
    } else {
      fetchContracts(search, statusFilter);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractNumber || !customerId || !productService || !contractDate || !totalAmount || !installmentPeriod || !startDate) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await api.post('/contracts', {
      contractNumber,
      customerId: parseInt(customerId),
      productService,
      contractDate,
      totalAmount: parseFloat(String(totalAmount || 0).replace(/,/g, '')),
      downPaymentAmount: 0,
      installmentPeriod: parseInt(installmentPeriod),
      startDate,
      interestRate: parseFloat(interestRate || 0)
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      fetchContracts(search, statusFilter);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-lg flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contract no., customer..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="overdue">Overdue</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Filter
          </button>
        </form>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
        >
          <FilePlus className="w-4.5 h-4.5" />
          <span>New Contract</span>
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No contracts found. Click "New Contract" to record one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">Contract No</th>
                  <th className="py-3.5 px-6">Customer Name</th>
                  <th className="py-3.5 px-6">Product / Service</th>
                  <th className="py-3.5 px-6 text-right">Total Amount</th>
                  <th className="py-3.5 px-6 text-right">Remaining Balance</th>
                  <th className="py-3.5 px-6">Period</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {contracts.map((con) => (
                  <tr key={con.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{con.contract_number}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 dark:text-white">{con.customer_name}</div>
                      <span className="text-[10px] text-slate-500">{con.phone_number}</span>
                    </td>
                    <td className="py-4 px-6 text-xs max-w-xs truncate">{con.product_service}</td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-slate-100">
                      ₭{parseFloat(con.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-slate-100">
                      <span className={parseFloat(con.remaining_balance) > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                        ₭{parseFloat(con.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">{con.installment_period} Days</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        con.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : con.status === 'active' 
                          ? 'bg-blue-500/10 text-blue-500' 
                          : con.status === 'overdue' 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {con.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/contracts/${con.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors"
                          title="View Installment Schedule"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(con.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Contract"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Contract Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl z-10 overflow-hidden transition-colors">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-500" />
                <span>Create New Installment Contract</span>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Contract Number *
                  </label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Select Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  >
                    <option value="" disabled>-- Choose Customer --</option>
                    {customers.map(cust => (
                      <option key={cust.id} value={cust.id}>
                        {cust.customer_name} ({cust.customer_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Product / Service Description *
                </label>
                <input
                  type="text"
                  value={productService}
                  onChange={(e) => setProductService(e.target.value)}
                  placeholder="e.g. ERP Software Subscription, Solar Panel Hardware"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Total Amount *
                  </label>
                  <input
                    type="text"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(formatInputNumber(e.target.value))}
                    placeholder="120,000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Payment Type *
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => handlePaymentTypeChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  >
                    <option value="daily_payment">Daily Payment</option>
                    <option value="down_payment">Down Payment</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase font-bold text-blue-500">
                    Interest Rate (%)
                  </label>
                  <input
                    type="text"
                    value={`${interestRate}%`}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed font-semibold"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Installments (Days) *
                  </label>
                  <select
                    value={installmentPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  >
                    {paymentType === 'daily_payment' ? (
                      <>
                        <option value="30">30 Days (Interest: 5%)</option>
                        <option value="60">60 Days (Interest: 10%)</option>
                        <option value="90">90 Days (Interest: 15%)</option>
                        <option value="100">100 Days (Interest: 15%)</option>
                      </>
                    ) : (
                      <>
                        <option value="30">30 Days (Interest: 5%)</option>
                        <option value="60">60 Days (Interest: 10%)</option>
                        <option value="90">90 Days (Interest: 15%)</option>
                        <option value="120">120 Days (Interest: 20%)</option>
                        <option value="150">150 Days (Interest: 25%)</option>
                        <option value="180">180 Days (Interest: 30%)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>



              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contract Date *</span>
                  </label>
                  <input
                    type="date"
                    value={contractDate}
                    onChange={(e) => setContractDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>First Installment Due *</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              {(() => {
                const total = parseFloat(String(totalAmount || 0).replace(/,/g, ''));
                const down = parseFloat(String(downPaymentAmount || 0).replace(/,/g, ''));
                const rate = parseFloat(interestRate || 0);
                const period = parseInt(installmentPeriod || 1);
                
                if (!totalAmount && !downPaymentAmount) return null;
                
                const principal = total - down;
                const interest = principal * (rate / 100) * (period / 365);
                const balance = principal + interest;
                const dailyPay = balance / period;

                return (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sales Price:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ₭{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Down Payment:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ₭{down.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Principal Loan:</span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        ₭{principal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Interest ({interestRate}% Flat Rate):</span>
                      <span className="font-bold text-rose-500">
                        ₭{interest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold text-sm">
                      <span className="text-slate-700 dark:text-slate-200">Total Balance (Installments):</span>
                      <span className="font-bold text-slate-800 dark:text-white">
                        ₭{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Daily Payment:</span>
                      <span className="font-bold text-blue-500">
                        ₭{dailyPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Installment preview list */}
              {(() => {
                const period = parseInt(installmentPeriod) || 0;
                const total = parseFloat(String(totalAmount || 0).replace(/,/g, '')) || 0;
                const down = parseFloat(String(downPaymentAmount || 0).replace(/,/g, '')) || 0;
                const rate = parseFloat(interestRate) || 0;
                const start = startDate;

                if (period <= 0 || total <= 0 || !start) return null;

                const principal = total - down;
                const interest = principal * (rate / 100) * (period / 365);
                const balance = principal + interest;
                
                const baseInstallmentAmount = Math.floor((balance / period) * 100) / 100;
                let sumGenerated = 0;
                const previews = [];

                const addDays = (dateStr, days) => {
                  const d = new Date(dateStr);
                  d.setDate(d.getDate() + days);
                  return d.toISOString().split('T')[0];
                };

                for (let i = 1; i <= period; i++) {
                  let amountDue = baseInstallmentAmount;
                  if (i === period) {
                    amountDue = Math.round((balance - sumGenerated) * 100) / 100;
                  } else {
                    sumGenerated += baseInstallmentAmount;
                  }
                  const dueDate = addDays(start, i);
                  previews.push({
                    installmentNumber: i,
                    dueDate,
                    amountDue
                  });
                }

                return (
                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Live Customer Installment Preview

                    </span>
                    <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40 text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <th className="pb-1 pr-2">Month</th>
                            <th className="pb-1 px-2">Due Date</th>
                            <th className="pb-1 text-right">Payment Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previews.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-800/40 last:border-0 text-slate-600 dark:text-slate-300">
                              <td className="py-1.5 pr-2 font-mono">#{item.installmentNumber}</td>
                              <td className="py-1.5 px-2 font-mono">{item.dueDate}</td>
                              <td className="py-1.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                                ₭{item.amountDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Generating Schedules...' : 'Create Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

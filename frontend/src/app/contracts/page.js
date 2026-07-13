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
    setDownPaymentAmount('');
    setInstallmentPeriod('12');
    setStartDate(new Date().toISOString().split('T')[0]);
    setError('');
    setShowModal(true);
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
    if (!contractNumber || !customerId || !productService || !contractDate || !totalAmount || downPaymentAmount === undefined || !installmentPeriod || !startDate) {
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
      totalAmount: parseFloat(totalAmount),
      downPaymentAmount: parseFloat(downPaymentAmount),
      installmentPeriod: parseInt(installmentPeriod),
      startDate
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
                      ฿{parseFloat(con.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-800 dark:text-slate-100">
                      <span className={parseFloat(con.remaining_balance) > 0 ? 'text-amber-500' : 'text-emerald-500'}>
                        ฿{parseFloat(con.remaining_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs">{con.installment_period} Months</td>
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="12000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Down Payment *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={downPaymentAmount}
                    onChange={(e) => setDownPaymentAmount(e.target.value)}
                    placeholder="2000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Installments (Months) *
                  </label>
                  <input
                    type="number"
                    value={installmentPeriod}
                    onChange={(e) => setInstallmentPeriod(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
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

              {totalAmount && downPaymentAmount && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining Balance:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      ฿{(parseFloat(totalAmount) - parseFloat(downPaymentAmount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Approx. Monthly Payment:</span>
                    <span className="font-bold text-blue-500">
                      ฿{((parseFloat(totalAmount) - parseFloat(downPaymentAmount)) / parseInt(installmentPeriod || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })} / month
                    </span>
                  </div>
                </div>
              )}

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

'use client';

import { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../utils/api';
import { 
  Search, 
  Trash2, 
  X, 
  RefreshCw, 
  DollarSign,
  Plus,
  Coins,
  FileCheck,
  Calendar,
  CreditCard
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]); // Contracts for the selected customer in modal
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [receiptNumber, setReceiptNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [contractId, setContractId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchPayments = async (searchVal = '') => {
    setLoading(true);
    const res = await api.get(`/payments?search=${encodeURIComponent(searchVal)}`);
    setLoading(false);
    if (!res.error) {
      setPayments(res);
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
    fetchPayments();
    fetchCustomers();
  }, []);

  // Fetch contracts when customer is selected in modal
  useEffect(() => {
    if (!customerId) {
      setContracts([]);
      return;
    }
    
    const fetchCustomerContracts = async () => {
      const res = await api.get(`/reports/statement/${customerId}`);
      if (!res.error && res.statements) {
        // filter active contracts
        const activeCons = res.statements
          .map(st => st.contract)
          .filter(c => c.status === 'active' || c.status === 'overdue');
        setContracts(activeCons);
        if (activeCons.length > 0) {
          setContractId(activeCons[0].id.toString());
          // Auto populate outstanding due on the first active contract
          const firstConDetails = res.statements[0];
          const unpaid = firstConDetails.schedules?.find(s => s.payment_status !== 'paid');
          if (unpaid) {
            setAmountPaid((parseFloat(unpaid.amount_due) - parseFloat(unpaid.amount_paid)).toString());
          } else {
            setAmountPaid(firstConDetails.contract.remaining_balance.toString());
          }
        } else {
          setContractId('');
          setAmountPaid('');
        }
      }
    };

    fetchCustomerContracts();
  }, [customerId]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayments(search);
  };

  const openAddModal = () => {
    setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
    setCustomerId(customers[0]?.id?.toString() || '');
    setContractId('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setAmountPaid('');
    setPaymentMethod('bank_transfer');
    setReferenceNumber('');
    setRemarks('');
    setError('');
    setShowModal(true);
  };

  const handleVoid = async (id) => {
    if (!confirm('Are you sure you want to void this payment? The payment schedules will be recalculated.')) return;
    const res = await api.delete(`/payments/${id}`);
    if (res.error) {
      alert(res.error);
    } else {
      fetchPayments(search);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receiptNumber || !customerId || !contractId || !paymentDate || !amountPaid || !paymentMethod) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    const res = await api.post('/payments', {
      receiptNumber,
      customerId: parseInt(customerId),
      contractId: parseInt(contractId),
      paymentDate,
      amountPaid: parseFloat(amountPaid),
      paymentMethod,
      referenceNumber,
      remarks
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      fetchPayments(search);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt no., customer, contract..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Record Collection</span>
        </button>
      </div>

      {/* Receipts Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading receipt logs...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No payments collected. Click "Record Collection" to log one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">Receipt No</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Contract No</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6 text-right">Amount Paid</th>
                  <th className="py-3.5 px-6">Method</th>
                  <th className="py-3.5 px-6">Recorded By</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{pay.receipt_number}</td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{pay.customer_name}</td>
                    <td className="py-4 px-6 font-mono text-xs">{pay.contract_number}</td>
                    <td className="py-4 px-6 text-xs">{pay.payment_date}</td>
                    <td className="py-4 px-6 text-right font-bold text-emerald-500">
                      ฿{parseFloat(pay.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-slate-800">
                        {pay.payment_method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">{pay.recorder_name || '-'}</td>
                    <td className="py-4 px-6 text-center">
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => handleVoid(pay.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Void Receipt"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden transition-colors">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                <span>Record Customer Payment Collection</span>
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Receipt Number *
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Select Contract *
                  </label>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                    disabled={contracts.length === 0}
                  >
                    <option value="" disabled>-- Choose Contract --</option>
                    {contracts.map(con => (
                      <option key={con.id} value={con.id}>
                        {con.contract_number} (Bal: ฿{parseFloat(con.remaining_balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Amount Collected (฿) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="qr_payment">QR Payment</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Reference / Txn ID
                  </label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Transaction reference ID"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Remarks / Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional remarks..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none resize-none"
                />
              </div>

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
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

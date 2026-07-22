'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../../utils/api';
import { 
  ArrowLeft, 
  RefreshCw, 
  Coins, 
  Calendar, 
  FileText,
  DollarSign, 
  User, 
  Phone,
  Trash2,
  X,
  CreditCard,
  CheckCircle,
  FileCheck
} from 'lucide-react';

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

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contractId] = useState(params.id);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Record Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payError, setPayError] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  
  // Payment Form State
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedScheduleIds, setSelectedScheduleIds] = useState([]);

  const fetchDetails = async () => {
    setLoading(true);
    const res = await api.get(`/contracts/${contractId}`);
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDetails(res);
      setError('');
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    fetchDetails();
  }, [contractId]);

  const openPayModal = () => {
    setReceiptNumber(`REC-${Date.now().toString().slice(-6)}`);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    
    // Auto populate remaining balance
    const remBalance = details?.contract?.remaining_balance || 0;
    
    // Auto populate typical installment amount if balance > 0
    let typicalDue = remBalance;
    const unpaid = details?.schedules?.find(s => s.payment_status !== 'paid');
    
    if (unpaid) {
      typicalDue = parseFloat(unpaid.amount_due) - parseFloat(unpaid.amount_paid);
      setSelectedScheduleIds([unpaid.id]);
    } else {
      setSelectedScheduleIds([]);
    }

    setAmountPaid(formatInputNumber(typicalDue.toString()));
    setReferenceNumber('');
    setRemarks('');
    setPayError('');
    setShowPayModal(true);
  };

  const handleToggleSchedule = (id) => {
    let updated;
    if (selectedScheduleIds.includes(id)) {
      updated = selectedScheduleIds.filter(x => x !== id);
    } else {
      updated = [...selectedScheduleIds, id];
    }
    setSelectedScheduleIds(updated);

    const sum = (schedules || [])
      .filter(s => updated.includes(s.id))
      .reduce((acc, s) => acc + (parseFloat(s.amount_due) - parseFloat(s.amount_paid)), 0);

    setAmountPaid(formatInputNumber(sum.toString()));
  };

  const handleVoidPayment = async (paymentId) => {
    if (!confirm('Are you sure you want to void this payment? The payment schedule will be recalculated.')) return;
    const res = await api.delete(`/payments/${paymentId}`);
    if (res.error) {
      alert(res.error);
    } else {
      fetchDetails();
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!receiptNumber || !paymentDate || !amountPaid || !paymentMethod) {
      setPayError('Please fill in all required fields');
      return;
    }

    setPaySubmitting(true);
    setPayError('');

    const res = await api.post('/payments', {
      receiptNumber,
      customerId: details.contract.customer_id,
      contractId: parseInt(contractId),
      paymentDate,
      amountPaid: parseFloat(String(amountPaid || 0).replace(/,/g, '')),
      paymentMethod,
      referenceNumber,
      remarks
    });

    setPaySubmitting(false);

    if (res.error) {
      setPayError(res.error);
    } else {
      setShowPayModal(false);
      fetchDetails();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          Failed to load contract: {error || 'Not found'}
        </div>
      </div>
    );
  }

  const { contract = {}, schedules = [], payments = [] } = details;

  return (
    <div className="space-y-6">
      
      {/* Back button & Action buttons */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.push('/contracts')} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 
          <span>Back to Contracts</span>
        </button>

        {parseFloat(contract.remaining_balance) > 0 && (
          <button
            onClick={openPayModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <DollarSign className="w-4.5 h-4.5" />
            <span>Record Collection</span>
          </button>
        )}
      </div>

      {/* Contract & Customer Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-slate-400" />
            <span>Customer Profile</span>
          </h2>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">{contract.customer_name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Code: {contract.customer_code}</p>
          </div>
          <div className="text-sm space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{contract.phone_number}</span>
            </div>
          </div>
        </div>

        {/* Contract Specifics */}
        {(() => {
          const schedules = details?.schedules || [];
          const initialTotalBalance = schedules.reduce((sum, s) => sum + parseFloat(s.amount_due), 0);
          const interestAmount = Math.max(0, initialTotalBalance - parseFloat(contract.total_amount));

          return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-slate-400" />
                <span>Contract Terms</span>
              </h2>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-mono">{contract.contract_number}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{contract.product_service}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-500 block">Total Amount</span>
                  <span className="font-bold text-slate-800 dark:text-white">₭{parseFloat(contract.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Down Payment</span>
                  <span className="font-bold text-slate-800 dark:text-white">₭{parseFloat(contract.down_payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Interest Amount</span>
                  <span className="font-bold text-rose-500">₭{interestAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total + Interest</span>
                  <span className="font-bold text-blue-500">₭{initialTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Term (Days)</span>
                  <span className="font-semibold">{contract.installment_period} Days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Start Date</span>
                  <span className="font-semibold">{contract.start_date}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Balance KPI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4.5 h-4.5 text-amber-500" />
              <span>Outstanding Balance</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              contract.status === 'completed' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              {contract.status}
            </span>
          </div>

          <div className="my-4">
            <p className="text-3xl font-black text-slate-800 dark:text-white">
              ₭{parseFloat(contract.remaining_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">Remaining out of ₭{parseFloat(contract.total_amount - contract.down_payment_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} balance</p>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${100 - (parseFloat(contract.remaining_balance) / parseFloat(contract.total_amount - contract.down_payment_amount || 1)) * 100}%` 
              }}
            ></div>
          </div>
        </div>

      </div>

      {/* Installment Schedules and Payments History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Installment Schedules List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Installment Schedules</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3 pr-4">No.</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount Due</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4 text-right">Remaining</th>
                  <th className="py-3 pl-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                    <td className="py-3.5 pr-4 font-mono text-xs">{sch.installment_number}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{sch.due_date}</td>
                    <td className="py-3.5 px-4 text-right font-semibold">₭{parseFloat(sch.amount_due).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-500">₭{parseFloat(sch.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-500">₭{parseFloat(sch.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3.5 pl-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        sch.payment_status === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : sch.payment_status === 'partial' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {sch.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl transition-colors">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white mb-4 uppercase tracking-wider">Receipt Ledger</h2>
          
          {payments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No payments collected yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
              {payments.map((pay) => (
                <div 
                  key={pay.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800/80 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{pay.receipt_number}</span>
                      <span className="text-[10px] text-slate-500 block">{pay.payment_date}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleVoidPayment(pay.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Void Receipt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-bold text-emerald-500">₭{parseFloat(pay.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Method</span>
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{pay.payment_method.replace('_', ' ')}</span>
                  </div>
                  {pay.reference_number && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      Ref: {pay.reference_number}
                    </div>
                  )}
                  {pay.remarks && (
                    <div className="text-[10px] text-slate-400 italic">
                      Remarks: {pay.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden transition-colors">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <span>Record Customer Collection</span>
              </h3>
              <button 
                onClick={() => setShowPayModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl">
                {payError}
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                    Payment Date *
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
                    Amount Collected (₭) *
                  </label>
                  <input
                    type="text"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(formatInputNumber(e.target.value))}
                    placeholder="10,000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Payment Method *
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
                    placeholder="Txn reference number"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox Days Selector */}
              {schedules && schedules.some(s => s.payment_status !== 'paid') && (
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Select Days to Pay (Optional Checkbox Mode)
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                    {schedules
                      .filter(s => s.payment_status !== 'paid')
                      .map((sch) => {
                        const isChecked = selectedScheduleIds.includes(sch.id);
                        const outstanding = parseFloat(sch.amount_due) - parseFloat(sch.amount_paid);
                        return (
                          <label key={sch.id} className="flex items-center justify-between p-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded cursor-pointer">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSchedule(sch.id)}
                                className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">Day #{sch.installment_number}</span>
                              <span className="text-[10px] text-slate-500">({sch.due_date})</span>
                            </div>
                            <span className="font-mono text-slate-700 dark:text-slate-350">
                              ₭{outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Remarks / Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Additional collection detail notes..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none resize-none"
                />
              </div>

              {/* Payment Allocation Preview */}
              {(() => {
                const amt = parseFloat(String(amountPaid || 0).replace(/,/g, ''));
                if (amt <= 0 || !schedules) return null;

                let remaining = amt;
                const previewList = [];
                const unpaid = schedules
                  .filter(s => s.payment_status !== 'paid')
                  .map(s => ({ ...s }));

                for (const schedule of unpaid) {
                  if (remaining <= 0) break;
                  const due = parseFloat(schedule.amount_due);
                  const paid = parseFloat(schedule.amount_paid);
                  const needed = due - paid;

                  let allocated = 0;
                  let newStatus = 'pending';
                  
                  if (remaining >= needed) {
                    allocated = needed;
                    remaining -= needed;
                    newStatus = 'paid';
                  } else {
                    allocated = remaining;
                    remaining = 0;
                    newStatus = 'partial';
                  }

                  previewList.push({
                    installmentNumber: schedule.installment_number,
                    dueDate: schedule.due_date,
                    due,
                    paid,
                    allocated,
                    newStatus
                  });
                }

                if (previewList.length === 0) return null;

                return (
                  <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Live Collection Distribution Preview
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1.5 p-3.5 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                      {previewList.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 last:border-0 pb-1.5 last:pb-0 text-slate-600 dark:text-slate-350">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">Month #{item.installmentNumber}</span>
                            <span className="text-[10px] text-slate-500 block">Due: {item.dueDate}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-500">+₭{item.allocated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className={`text-[9px] ml-2 px-1.5 py-0.5 rounded font-bold uppercase ${
                              item.newStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>{item.newStatus}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-5050 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {paySubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  Download, 
  Search, 
  RefreshCw, 
  Calendar, 
  FileSpreadsheet,
  FileText,
  User,
  Activity
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('daily');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [statementData, setStatementData] = useState(null);

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const fetchCustomers = async () => {
    const res = await api.get('/customers');
    if (!res.error) {
      setCustomers(res);
      if (res.length > 0) {
        setSelectedCustomerId(res[0].id.toString());
      }
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setReportData([]);
    setStatementData(null);

    let res;
    if (activeTab === 'daily') {
      res = await api.get(`/reports/daily?date=${filterDate}`);
      if (!res.error) setReportData(res);
    } else if (activeTab === 'monthly') {
      res = await api.get(`/reports/monthly?year=${filterYear}&month=${filterMonth}`);
      if (!res.error) setReportData(res.details || []);
    } else if (activeTab === 'overdue') {
      res = await api.get('/reports/overdue');
      if (!res.error) setReportData(res);
    } else if (activeTab === 'statement' && selectedCustomerId) {
      res = await api.get(`/reports/statement/${selectedCustomerId}`);
      if (!res.error) setStatementData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab, filterDate, filterYear, filterMonth, selectedCustomerId]);

  // Export data helper
  const exportToCSV = (dataToExport, filename) => {
    if (!dataToExport || dataToExport.length === 0) return;
    
    // Get headers dynamically
    const headers = Object.keys(dataToExport[0]).join(',');
    const rows = dataToExport.map(row => 
      Object.values(row).map(val => {
        const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        // escape double quotes
        return `"${strVal.replace(/"/g, '""')}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (activeTab === 'statement') {
      if (!statementData || statementData.statements.length === 0) return;
      // Export payments ledger
      const flatStatement = statementData.statements.flatMap(st => 
        st.payments.map(p => ({
          ContractNumber: st.contract.contract_number,
          ReceiptNumber: p.receipt_number,
          Date: p.payment_date,
          AmountCollected: p.amount_paid,
          Method: p.payment_method,
          Reference: p.reference_number || '',
          Remarks: p.remarks || ''
        }))
      );
      exportToCSV(flatStatement, `statement_${statementData.customer.customer_code}`);
    } else {
      exportToCSV(reportData, `${activeTab}_report_${Date.now()}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Tabs list selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'daily', label: 'Daily Collections' },
          { id: 'monthly', label: 'Monthly Summary' },
          { id: 'overdue', label: 'Overdue Balances' },
          { id: 'statement', label: 'Customer Statement' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'border-blue-500 text-blue-500' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter panel */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-colors">
        <div className="flex-1 flex flex-wrap items-center gap-3">
          {activeTab === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">Select Date:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Year:</span>
                <input
                  type="number"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Month:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'statement' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 uppercase font-semibold">Customer:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customer_name}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'overdue' && (
            <span className="text-xs text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Activity className="w-4 h-4 text-rose-500" />
              <span>Real-time Aging Overdue accounts list</span>
            </span>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={loading || (activeTab === 'statement' ? !statementData : reportData.length === 0)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-md cursor-pointer transition-colors"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Reports Grid Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Compiling data tables...</p>
          </div>
        ) : activeTab === 'statement' ? (
          /* Statement details */
          !statementData ? (
            <div className="py-20 text-center text-slate-500 text-sm">Select a customer to view statement.</div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    <span>{statementData.customer.customer_name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Code: {statementData.customer.customer_code} | Phone: {statementData.customer.phone_number}</p>
                </div>
                {statementData.customer.address && (
                  <div className="text-xs text-slate-500 text-right">
                    <span>Address: {statementData.customer.address}</span>
                  </div>
                )}
              </div>

              {statementData.statements.length === 0 ? (
                <p className="text-slate-500 text-sm py-10 text-center">No active or historical contracts recorded for this customer.</p>
              ) : (
                statementData.statements.map((st, sIdx) => (
                  <div key={sIdx} className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800/80 rounded-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800 pb-2">
                      <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">Contract: {st.contract.contract_number}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-200 dark:bg-slate-800">{st.contract.status}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Product / Service</span>
                        <span className="font-semibold text-slate-800 dark:text-white">{st.contract.product_service}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Contract Value</span>
                        <span className="font-semibold text-slate-800 dark:text-white">฿{parseFloat(st.contract.total_amount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Down Payment</span>
                        <span className="font-semibold text-slate-800 dark:text-white">฿{parseFloat(st.contract.down_payment_amount).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Remaining Balance</span>
                        <span className="font-bold text-amber-500">฿{parseFloat(st.contract.remaining_balance).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Upcoming schedules */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Installments Schedule Overview</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase">
                              <th className="py-2 pr-3">Inst No</th>
                              <th className="py-2 px-3">Due Date</th>
                              <th className="py-2 px-3 text-right">Amount Due</th>
                              <th className="py-2 px-3 text-right">Amount Paid</th>
                              <th className="py-2 pl-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {st.schedules.map((sch, schIdx) => (
                              <tr key={schIdx} className="text-slate-700 dark:text-slate-300">
                                <td className="py-2 pr-3 font-mono">{sch.installment_number}</td>
                                <td className="py-2 px-3 font-mono">{sch.due_date}</td>
                                <td className="py-2 px-3 text-right font-semibold">฿{parseFloat(sch.amount_due).toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-semibold text-emerald-500">฿{parseFloat(sch.amount_paid).toLocaleString()}</td>
                                <td className="py-2 pl-3">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                    sch.payment_status === 'paid' 
                                      ? 'bg-emerald-500/10 text-emerald-500' 
                                      : 'bg-rose-500/10 text-rose-500'
                                  }`}>{sch.payment_status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        ) : (
          /* Report table view */
          reportData.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">No collection records found for this period.</div>
          ) : (
            <div className="overflow-x-auto animate-fade-in">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                    {activeTab === 'daily' && (
                      <>
                        <th className="py-3.5 px-6">Receipt No</th>
                        <th className="py-3.5 px-6">Customer Name</th>
                        <th className="py-3.5 px-6">Contract No</th>
                        <th className="py-3.5 px-6 text-right">Collected Amount</th>
                        <th className="py-3.5 px-6">Payment Method</th>
                      </>
                    )}
                    {activeTab === 'monthly' && (
                      <>
                        <th className="py-3.5 px-6">Installment No</th>
                        <th className="py-3.5 px-6">Customer Name</th>
                        <th className="py-3.5 px-6">Contract No</th>
                        <th className="py-3.5 px-6">Due Date</th>
                        <th className="py-3.5 px-6 text-right">Amount Due</th>
                        <th className="py-3.5 px-6 text-right">Collected</th>
                        <th className="py-3.5 px-6">Status</th>
                      </>
                    )}
                    {activeTab === 'overdue' && (
                      <>
                        <th className="py-3.5 px-6">Customer Name</th>
                        <th className="py-3.5 px-6">Contract No</th>
                        <th className="py-3.5 px-6">Due Date</th>
                        <th className="py-3.5 px-6 text-right">Outstanding Amount</th>
                        <th className="py-3.5 px-6">Days Overdue</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {reportData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                      {activeTab === 'daily' && (
                        <>
                          <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{row.receipt_number}</td>
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{row.customer_name}</td>
                          <td className="py-4 px-6 font-mono text-xs">{row.contract_number}</td>
                          <td className="py-4 px-6 text-right font-bold text-emerald-500">
                            ฿{parseFloat(row.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 capitalize text-xs">{row.payment_method.replace('_', ' ')}</td>
                        </>
                      )}
                      
                      {activeTab === 'monthly' && (
                        <>
                          <td className="py-4 px-6 font-mono text-xs">{row.installment_number}</td>
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{row.customer_name}</td>
                          <td className="py-4 px-6 font-mono text-xs">{row.contract_number}</td>
                          <td className="py-4 px-6 font-mono text-xs">{row.due_date}</td>
                          <td className="py-4 px-6 text-right font-semibold">
                            ฿{parseFloat(row.amount_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-emerald-500">
                            ฿{parseFloat(row.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              row.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>{row.payment_status}</span>
                          </td>
                        </>
                      )}

                      {activeTab === 'overdue' && (
                        <>
                          <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{row.customer_name}</td>
                          <td className="py-4 px-6 font-mono text-xs">{row.contract_number}</td>
                          <td className="py-4 px-6 font-mono text-xs text-rose-500">{row.due_date}</td>
                          <td className="py-4 px-6 text-right font-bold text-rose-500">
                            ฿{parseFloat(row.amountOutstanding).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-6 text-xs text-rose-500 font-bold">{row.daysOverdue} Days Late</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

    </div>
  );
}

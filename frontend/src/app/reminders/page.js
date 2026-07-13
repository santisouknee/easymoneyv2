'use client';

import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  Bell, 
  MessageSquare, 
  Send, 
  PhoneCall, 
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

export default function RemindersPage() {
  const [reminders, setReminders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notif, setNotif] = useState('');

  const fetchReminders = async () => {
    setLoading(true);
    const res = await api.get('/reminders');
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setReminders(res);
      setError('');
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const triggerSimulation = (type, item) => {
    let msg = '';
    const dateText = item.due_date;
    const balanceDue = parseFloat(item.amount_due - item.amount_paid).toLocaleString();
    
    if (type === 'WhatsApp') {
      msg = `💬 WhatsApp simulator: Reminder sent to ${item.customer_name} (${item.phone_number}). Text: "Dear Customer, your payment of ฿${balanceDue} for Contract ${item.contract_number} is due on ${dateText}. Please make payment. Thank you."`;
    } else if (type === 'SMS') {
      msg = `📲 SMS simulator: Text alert sent to ${item.phone_number}. Text: "Easy Money: Reminder: ฿${balanceDue} due on ${dateText} for ${item.contract_number}."`;
    } else if (type === 'Email') {
      msg = `📧 Email simulator: Invoice reminder sent to ${item.email || 'customer@example.com'} successfully!`;
    }
    
    setNotif(msg);
    setTimeout(() => {
      setNotif('');
    }, 6000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 text-sm">Scanning installment schedules for alerts...</p>
        </div>
      </div>
    );
  }

  if (error || !reminders) {
    return (
      <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
        Failed to load alerts: {error}
      </div>
    );
  }

  const { overdue = [], dueToday = [], dueIn3Days = [], dueIn7Days = [] } = reminders;

  const sections = [
    { title: 'Overdue Alert', color: 'rose', icon: AlertTriangle, list: overdue },
    { title: 'Due Today', color: 'blue', icon: CalendarDays, list: dueToday },
    { title: 'Due in 3 Days', color: 'amber', icon: Clock, list: dueIn3Days },
    { title: 'Due in 7 Days', color: 'slate', icon: Bell, list: dueIn7Days }
  ];

  return (
    <div className="space-y-6">
      
      {/* Alert Banner */}
      {notif && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-sm rounded-xl animate-fade-in flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span>{notif}</span>
        </div>
      )}

      {/* Reminder Cards Lists */}
      <div className="space-y-8">
        {sections.map((sec, sIdx) => {
          const Icon = sec.icon;
          const count = sec.list.length;
          
          let colorClass = '';
          let bgClass = '';
          if (sec.color === 'rose') { colorClass = 'text-rose-500'; bgClass = 'bg-rose-500/10 border-rose-500/20'; }
          else if (sec.color === 'blue') { colorClass = 'text-blue-500'; bgClass = 'bg-blue-500/10 border-blue-500/20'; }
          else if (sec.color === 'amber') { colorClass = 'text-amber-500'; bgClass = 'bg-amber-500/10 border-amber-500/20'; }
          else { colorClass = 'text-slate-500'; bgClass = 'bg-slate-500/10 border-slate-500/20'; }

          return (
            <div key={sIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-colors space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`p-2 rounded-lg ${bgClass} ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <h2 className="text-base font-bold text-slate-800 dark:text-white">{sec.title}</h2>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${bgClass} ${colorClass}`}>
                  {count} Accounts
                </span>
              </div>

              {count === 0 ? (
                <p className="text-slate-500 text-xs py-4">No schedules matching this alert state.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sec.list.map((item, idx) => {
                    const balance = parseFloat(item.amount_due - item.amount_paid);
                    return (
                      <div 
                        key={idx}
                        className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{item.customer_name}</h4>
                          <p className="text-xs text-slate-500 font-mono">Contract: {item.contract_number}</p>
                          <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                            <div>Due Date: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.due_date}</span></div>
                            <div>Phone: <span className="font-semibold text-slate-600 dark:text-slate-300">{item.phone_number}</span></div>
                          </div>
                        </div>
                        <div className="text-right space-y-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">฿{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            <span className="text-[10px] text-slate-500">Remaining</span>
                          </div>
                          
                          {/* Send Options */}
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => triggerSimulation('SMS', item)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-500 dark:text-slate-400 transition-all text-xs font-semibold cursor-pointer flex items-center gap-1"
                              title="Send SMS Reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="sr-only">SMS</span>
                            </button>
                            <button
                              onClick={() => triggerSimulation('WhatsApp', item)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-500 dark:text-slate-400 transition-all text-xs font-semibold cursor-pointer flex items-center gap-1"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="sr-only">WA</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../utils/api';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  RefreshCw, 
  UserPlus, 
  Phone, 
  Mail, 
  FileText,
  MapPin
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [status, setStatus] = useState('active');

  const fetchCustomers = async (searchVal = '') => {
    setLoading(true);
    const res = await api.get(`/customers?search=${encodeURIComponent(searchVal)}`);
    setLoading(false);
    if (!res.error) {
      setCustomers(res);
    }
  };

  useEffect(() => {
    setUser(getCurrentUser());
    fetchCustomers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const openAddModal = () => {
    setEditId(null);
    setCustomerCode(`CUST-${Date.now().toString().slice(-6)}`);
    setCustomerName('');
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setNationalId('');
    setStatus('active');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (cust) => {
    setEditId(cust.id);
    setCustomerCode(cust.customer_code);
    setCustomerName(cust.customer_name);
    setPhoneNumber(cust.phone_number);
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setNationalId(cust.national_id || '');
    setStatus(cust.status);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    const res = await api.delete(`/customers/${id}`);
    if (res.error) {
      alert(res.error);
    } else {
      fetchCustomers(search);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerCode || !customerName || !phoneNumber) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      customerCode,
      customerName,
      phoneNumber,
      email,
      address,
      nationalId,
      status
    };

    let res;
    if (editId) {
      res = await api.put(`/customers/${editId}`, payload);
    } else {
      res = await api.post('/customers', payload);
    }

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      fetchCustomers(search);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, code..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Add Customer Button */}
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading customer accounts...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No customers found. Click "Add Customer" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Customer Name</th>
                  <th className="py-3.5 px-6">Contact Info</th>
                  <th className="py-3.5 px-6">National ID</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{cust.customer_code}</td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{cust.customer_name}</td>
                    <td className="py-4 px-6 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.phone_number}</span>
                      </div>
                      {cust.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cust.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">{cust.national_id || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        cust.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(cust.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Customer"
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

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden transition-colors">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editId ? 'Edit Customer' : 'Add New Customer'}
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
                    Customer Code *
                  </label>
                  <input
                    type="text"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    National ID
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="ID card or passport no."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 020XXXXXXXX"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Billing Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full physical mailing/billing address"
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {submitting ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

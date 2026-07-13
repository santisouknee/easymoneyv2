'use client';

import { useState, useEffect } from 'react';
import { api, getCurrentUser } from '../../utils/api';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert,
  Mail,
  UserPlus
} from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [status, setStatus] = useState('active');

  const fetchUsers = async () => {
    setLoading(true);
    const res = await api.get('/users');
    setLoading(false);
    if (res.error) {
      alert(res.error);
      router.push('/dashboard');
    } else {
      setUsers(res);
    }
  };

  useEffect(() => {
    const curUser = getCurrentUser();
    setCurrentUser(curUser);
    if (!curUser || curUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditId(null);
    setUsername('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('staff');
    setStatus('active');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (usr) => {
    setEditId(usr.id);
    setUsername(usr.username);
    setFullName(usr.full_name);
    setEmail(usr.email || '');
    setPassword(''); // leave blank if no password update
    setRole(usr.role);
    setStatus(usr.status);
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!confirm('Are you sure you want to delete this user account?')) return;
    const res = await api.delete(`/users/${id}`);
    if (res.error) {
      alert(res.error);
    } else {
      fetchUsers();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !fullName || !role) {
      setError('Please fill in all required fields');
      return;
    }
    if (!editId && !password) {
      setError('Password is required for new users');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      username,
      fullName,
      email,
      role,
      status,
      ...(password ? { password } : {})
    };

    let res;
    if (editId) {
      res = await api.put(`/users/${editId}`, payload);
    } else {
      res = await api.post('/users', payload);
    }

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header action */}
      <div className="flex items-center justify-end">
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
        >
          <UserPlus className="w-4.5 h-4.5" />
          <span>Add User Account</span>
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-7 h-7 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading users list...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 text-xs font-bold uppercase">
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Username</th>
                  <th className="py-3.5 px-6">Full Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 text-slate-700 dark:text-slate-300">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{usr.id}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-250">{usr.username}</td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{usr.full_name}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {usr.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{usr.email}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-4 px-6 capitalize">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        usr.role === 'admin' 
                          ? 'bg-indigo-500/10 text-indigo-500' 
                          : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                      }`}>
                        {usr.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        usr.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {usr.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(usr)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {usr.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(usr.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete User"
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

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden transition-colors">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editId ? 'Edit User Account' : 'Add New User'}
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
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!!editId}
                  placeholder="e.g. jsmith"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
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
                  placeholder="jsmith@example.com"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                  Password {editId ? '(Leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                  required={!editId}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                    required
                  >
                    <option value="admin">Administrator</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
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
                  {submitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

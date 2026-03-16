import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import AnimatedModal from '../components/AnimatedModal';
import DataTable from '../components/DataTable';
import PaymentSlip from '../components/PaymentSlip';
import {
  FiPlus, FiEye, FiSearch, FiDollarSign, FiCalendar, FiCreditCard,
  FiMoreVertical, FiFilter, FiTrash2, FiPrinter
} from 'react-icons/fi';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState({});
  const [stats, setStats] = useState({ total: 0, today: 0, thisMonth: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [slipPayment, setSlipPayment] = useState(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [methodFilter, setMethodFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({ memberId: '', amount: '', method: 'CASH', notes: '', autoPrintSlip: true });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchPayments();
    fetchMembers();
    fetchSettings();
  }, [searchTerm, dateFilter, methodFilter]);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data.id) setSettings(data);
    } catch {}
  };

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);
      if (methodFilter !== 'all') params.append('method', methodFilter);
      const { data } = await axios.get(`/api/payments?${params}`);
      const filtered = data.filter(p =>
        p.membership?.member?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setPayments(filtered);
      const total = data.reduce((sum, p) => sum + Number(p.amount), 0);
      const today = data.filter(p => new Date(p.paymentDate).toDateString() === new Date().toDateString())
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const thisMonth = data.filter(p => {
        const d = new Date(p.paymentDate), n = new Date();
        return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
      }).reduce((sum, p) => sum + Number(p.amount), 0);
      setStats({ total, today, thisMonth });
    } catch { addAlert('Failed to load payments', 'error'); }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/members');
      setMembers(data.members || data);
    } catch { addAlert('Failed to load members', 'error'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { autoPrintSlip, ...payload } = formData;
      const { data } = await axios.post('/api/payments', payload);
      addAlert('Payment recorded successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ memberId: '', amount: '', method: 'CASH', notes: '', autoPrintSlip: true });
      await fetchPayments();
      // fetch full payment with member details for slip
      if (autoPrintSlip) {
        try {
          const { data: full } = await axios.get(`/api/payments/${data.id}`);
          setAutoPrint(true);
          setSlipPayment(full);
        } catch {}
      }
    } catch (error) {
      addAlert(error.response?.data?.error || 'Payment failed', 'error');
    }
  };

  const handleView = async (payment) => {
    try {
      const { data } = await axios.get(`/api/payments/${payment.id}`);
      setViewingPayment(data);
      setIsViewModalOpen(true);
    } catch { addAlert('Failed to load payment details', 'error'); }
  };

  const handlePrintSlip = async (payment) => {
    try {
      const { data } = await axios.get(`/api/payments/${payment.id}`);
      setAutoPrint(false);
      setSlipPayment(data);
    } catch { addAlert('Failed to load payment details', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await axios.delete(`/api/payments/${id}`);
      addAlert('Payment deleted successfully!', 'success');
      fetchPayments();
    } catch { addAlert('Failed to delete payment', 'error'); }
  };

  const sym = settings.currencySymbol || 'Rs';

  const getMethodBadge = (method) => {
    const colors = {
      CASH: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      CARD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      ONLINE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      UPI: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method] || colors.CASH}`}>
        {method?.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    {
      header: 'Member',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
            {row.membership?.member?.name?.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.membership?.member?.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.membership?.member?.phone}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Amount',
      render: (row) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {sym} {Number(row.amount).toLocaleString()}
        </span>
      )
    },
    { header: 'Method', render: (row) => getMethodBadge(row.method) },
    {
      header: 'Date',
      render: (row) => (
        <div>
          <div className="dark:text-white text-sm">{new Date(row.paymentDate).toLocaleDateString()}</div>
          <div className="text-xs text-gray-400">{new Date(row.paymentDate).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === row.id ? null : row.id); }}
            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>
          {dropdownOpen === row.id && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48" onClick={e => e.stopPropagation()}>
              <button onClick={() => { handleView(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm dark:text-white">
                <FiEye className="w-4 h-4" /> View Details
              </button>
              <button onClick={() => { handlePrintSlip(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <FiPrinter className="w-4 h-4" /> Print Slip
              </button>
              <button onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 border-t dark:border-gray-600">
                <FiTrash2 className="w-4 h-4" /> Delete Payment
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" onClick={() => setDropdownOpen(null)}>
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2">
            <FiDollarSign className="text-green-500" /> Payments Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Total: {payments.length} payments</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors">
          <FiPlus /> Record Payment
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue', value: stats.total, color: 'green', icon: FiDollarSign },
          { label: "Today's Collection", value: stats.today, color: 'blue', icon: FiCalendar },
          { label: 'This Month', value: stats.thisMonth, color: 'purple', icon: FiCreditCard },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
                <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400`}>
                  {sym} {value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900/20 rounded-full flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Payment History</h2>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">
            <FiFilter /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search member..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <input type="date" value={dateFilter.startDate}
              onChange={e => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" />
            <input type="date" value={dateFilter.endDate}
              onChange={e => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" />
            <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="all">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={payments} />
      </div>

      {/* Record Payment Modal */}
      <AnimatedModal isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFormData({ memberId: '', amount: '', method: 'CASH', notes: '', autoPrintSlip: true }); }}
        title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Member</label>
            <select value={formData.memberId}
              onChange={e => {
                const member = members.find(m => m.id === e.target.value);
                setFormData({ ...formData, memberId: e.target.value, amount: member?.monthlyFee || '' });
              }}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required>
              <option value="">Select Member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {sym} {m.monthlyFee}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Amount ({sym})</label>
            <input type="number" value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Payment Method</label>
            <select value={formData.method}
              onChange={e => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Notes (Optional)</label>
            <textarea value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="2" placeholder="Add any notes..." />
          </div>
          {/* Auto-print toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <FiPrinter /> Auto-Print Slip After Payment
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Slip will open automatically for printing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={formData.autoPrintSlip}
                onChange={e => setFormData({ ...formData, autoPrintSlip: e.target.checked })}
                className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <button type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium">
            Record Payment
          </button>
        </form>
      </AnimatedModal>

      {/* View Payment Modal */}
      <AnimatedModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Payment Details">
        {viewingPayment && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingPayment.membership?.member?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingPayment.membership?.member?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingPayment.membership?.member?.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Amount', `${sym} ${Number(viewingPayment.amount).toLocaleString()}`, 'text-green-600 dark:text-green-400 text-2xl font-bold'],
                ['Date', new Date(viewingPayment.paymentDate).toLocaleDateString()],
                ['Time', new Date(viewingPayment.paymentDate).toLocaleTimeString()],
                ['Plan', viewingPayment.membership?.planType],
              ].map(([label, value, cls]) => (
                <div key={label}>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={cls || 'font-semibold dark:text-white'}>{value}</p>
                </div>
              ))}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Method</p>
                <div className="mt-1">{getMethodBadge(viewingPayment.method)}</div>
              </div>
            </div>
            {viewingPayment.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
                <p className="dark:text-white mt-1">{viewingPayment.notes}</p>
              </div>
            )}
            <button onClick={() => { setIsViewModalOpen(false); handlePrintSlip(viewingPayment); }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              <FiPrinter /> Print Payment Slip
            </button>
          </div>
        )}
      </AnimatedModal>

      {/* Payment Slip Modal */}
      {slipPayment && (
        <PaymentSlip
          payment={slipPayment}
          settings={settings}
          autoPrint={autoPrint}
          onClose={() => { setSlipPayment(null); setAutoPrint(false); }}
        />
      )}
    </div>
  );
};

export default Payments;

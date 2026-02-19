import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import AnimatedModal from '../components/AnimatedModal';
import DataTable from '../components/DataTable';
import { 
  FiPlus, FiEye, FiSearch, FiDollarSign, FiCalendar, FiCreditCard,
  FiMoreVertical, FiDownload, FiFilter, FiTrash2
} from 'react-icons/fi';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, thisMonth: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [methodFilter, setMethodFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData] = useState({ memberId: '', amount: '', method: 'CASH', notes: '' });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, [searchTerm, dateFilter, methodFilter]);

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
      
      // Calculate stats
      const total = data.reduce((sum, p) => sum + Number(p.amount), 0);
      const today = data.filter(p => new Date(p.paymentDate).toDateString() === new Date().toDateString())
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const thisMonth = data.filter(p => {
        const date = new Date(p.paymentDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).reduce((sum, p) => sum + Number(p.amount), 0);
      
      setStats({ total, today, thisMonth });
    } catch (error) {
      addAlert('Failed to load payments', 'error');
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/members');
      setMembers(data.members || data);
    } catch (error) {
      addAlert('Failed to load members', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments', formData);
      addAlert('Payment recorded successfully!', 'success');
      setIsModalOpen(false);
      setFormData({ memberId: '', amount: '', method: 'CASH', notes: '' });
      fetchPayments();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Payment failed', 'error');
    }
  };

  const handleView = async (payment) => {
    try {
      const { data } = await axios.get(`/api/payments/${payment.id}`);
      setViewingPayment(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load payment details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    try {
      await axios.delete(`/api/payments/${id}`);
      addAlert('Payment deleted successfully!', 'success');
      fetchPayments();
    } catch (error) {
      addAlert('Failed to delete payment', 'error');
    }
  };

  const getMethodBadge = (method) => {
    const colors = {
      CASH: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      CARD: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      BANK_TRANSFER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      ONLINE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      UPI: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method] || colors.CASH}`}>
        {method}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Member', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
            {row.membership?.member?.name.charAt(0)}
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
        <div className="flex items-center gap-2">
          <FiDollarSign className="w-4 h-4 text-green-500" />
          <span className="font-semibold text-green-600 dark:text-green-400">Rs {Number(row.amount).toLocaleString()}</span>
        </div>
      )
    },
    { 
      header: 'Method', 
      render: (row) => getMethodBadge(row.method)
    },
    { 
      header: 'Date', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <span className="dark:text-white">{new Date(row.paymentDate).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      header: 'Time', 
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(row.paymentDate).toLocaleTimeString()}</span>
      )
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === row.id ? null : row.id);
            }}
            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>
          {dropdownOpen === row.id && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { handleView(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" /> View Details
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center space-x-2">
            <FiDollarSign className="text-green-500" />
            <span>Payments Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {payments.length} payments
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
        >
          <FiPlus /> Record Payment
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">Rs {stats.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Collection</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">Rs {stats.today.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <FiCalendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">Rs {stats.thisMonth.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <FiCreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Payment History</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiFilter /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
            <div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={payments} />
      </div>

      {/* Record Payment Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setFormData({ memberId: '', amount: '', method: 'CASH', notes: '' });
        }} 
        title="Record Payment"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Member</label>
            <select
              value={formData.memberId}
              onChange={(e) => {
                const member = members.find(m => m.id === e.target.value);
                setFormData({ ...formData, memberId: e.target.value, amount: member?.monthlyFee || '' });
              }}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} - Rs {m.monthlyFee}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Amount (Rs)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Payment Method</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add any notes..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Record Payment
          </button>
        </form>
      </AnimatedModal>

      {/* View Payment Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Payment Details"
      >
        {viewingPayment && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingPayment.membership?.member?.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingPayment.membership?.member?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingPayment.membership?.member?.phone}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">Rs {Number(viewingPayment.amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                <div className="mt-1">{getMethodBadge(viewingPayment.method)}</div>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-semibold dark:text-white">{new Date(viewingPayment.paymentDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                <p className="font-semibold dark:text-white">{new Date(viewingPayment.paymentDate).toLocaleTimeString()}</p>
              </div>
            </div>

            {viewingPayment.notes && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                <p className="dark:text-white mt-1">{viewingPayment.notes}</p>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default Payments;

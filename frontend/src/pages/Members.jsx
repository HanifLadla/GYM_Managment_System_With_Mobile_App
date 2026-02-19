import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiCreditCard, FiEdit, FiTrash2, FiEye, FiDownload, 
  FiFilter, FiSearch, FiUser, FiPhone, FiMail, FiCalendar,
  FiDollarSign, FiActivity, FiClock, FiMapPin, FiUsers,
  FiLock, FiMessageSquare, FiRefreshCw, FiBarChart, FiFileText,
  FiMoreVertical, FiUnlock
} from 'react-icons/fi';

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH', notes: '' });
  const [messageType, setMessageType] = useState('due');
  const [reportType, setReportType] = useState('payment');
  const [selectedMember, setSelectedMember] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', planType: 'all' });
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', phone: '', address: '', dob: '',
    gender: '', monthlyFee: 3000, planId: '', planType: 'BASIC', cnic: ''
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchMembers();
    fetchPlans();
  }, [pagination.page, searchTerm, filters]);

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get('/api/plans');
      setPlans(data);
    } catch (error) {
      addAlert('Failed to load plans', 'error');
    }
  };

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        search: searchTerm,
        ...filters
      });
      const { data } = await axios.get(`/api/members?${params}`);
      setMembers(data.members);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (error) {
      addAlert('Failed to load members', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await axios.put(`/api/members/${editingMember.id}`, formData);
        addAlert('Member updated successfully!', 'success');
      } else {
        await axios.post('/api/members', formData);
        addAlert('Member added successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingMember(null);
      fetchMembers();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save member', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '', password: '', name: '', phone: '', address: '', dob: '',
      gender: '', monthlyFee: 3000, planId: '', planType: 'BASIC', cnic: ''
    });
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    const membership = member.memberships?.[0];
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.user?.email || '',
      password: '',
      address: member.address || '',
      dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
      gender: member.gender || '',
      monthlyFee: member.monthlyFee,
      planId: membership?.planId || '',
      planType: membership?.planType || 'BASIC',
      cnic: member.cnic || ''
    });
    setIsModalOpen(true);
  };

  const handleView = async (member) => {
    try {
      const { data } = await axios.get(`/api/members/${member.id}`);
      setViewingMember(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load member details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`/api/members/${id}`);
      addAlert('Member deleted successfully!', 'success');
      fetchMembers();
    } catch (error) {
      addAlert('Failed to delete member', 'error');
    }
  };

  const handleBlock = async (id) => {
    if (!confirm('Are you sure you want to block this member?')) return;
    try {
      await axios.put(`/api/members/${id}/block`);
      addAlert('Member blocked successfully!', 'success');
      fetchMembers();
    } catch (error) {
      addAlert('Failed to block member', 'error');
    }
  };

  const handleUnblock = async (id) => {
    if (!confirm('Are you sure you want to unblock this member?')) return;
    try {
      await axios.put(`/api/members/${id}`, { status: 'active' });
      addAlert('Member unblocked successfully!', 'success');
      fetchMembers();
    } catch (error) {
      addAlert('Failed to unblock member', 'error');
    }
  };

  const handleSendMessage = async (method) => {
    try {
      const endpoint = messageType === 'due' ? 'send-due' : 'send-renewal';
      await axios.post(`/api/members/${selectedMember.id}/${endpoint}`, { method });
      addAlert(`${messageType} message sent via ${method}!`, 'success');
      setIsMessageModalOpen(false);
    } catch (error) {
      addAlert('Failed to send message', 'error');
    }
  };

  const openMessageModal = (member, type) => {
    setSelectedMember(member);
    setMessageType(type);
    setIsMessageModalOpen(true);
  };

  const openReportModal = async (member, type) => {
    setSelectedMember(member);
    setReportType(type);
    setIsReportModalOpen(true);
    setLoadingReport(true);
    
    try {
      const endpoint = type === 'payment' ? 'payment-report' : 'attendance-report';
      const { data } = await axios.get(`/api/members/${member.id}/${endpoint}`);
      setReportData(data);
    } catch (error) {
      addAlert('Failed to load report', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const openPaymentModal = (member) => {
    setSelectedMember(member);
    setPaymentData({ amount: member.monthlyFee, method: 'CASH', notes: '' });
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments', {
        memberId: selectedMember.id,
        amount: paymentData.amount,
        method: paymentData.method,
        notes: paymentData.notes
      });
      addAlert('Payment recorded successfully!', 'success');
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: '', method: 'CASH', notes: '' });
      fetchMembers();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to record payment', 'error');
    }
  };

  const generateCard = async (memberId) => {
    try {
      await axios.post(`/api/members/${memberId}/card`);
      addAlert('Member card generated successfully!', 'success');
    } catch (error) {
      addAlert('Failed to generate card', 'error');
    }
  };

  const exportMembers = async () => {
    try {
      const response = await axios.get('/api/members/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'members.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addAlert('Members exported successfully!', 'success');
    } catch (error) {
      addAlert('Failed to export members', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
        {status}
      </span>
    );
  };

  const getPlanBadge = (planType) => {
    const colors = {
      BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      PREMIUM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[planType] || colors.BASIC}`}>
        {planType}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Member', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {row.name.charAt(0)}
            </div>
            {row.status === 'active' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
            {row.status === 'blocked' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <FiLock className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiMail className="w-3 h-3" />
              {row.user?.email}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
              <FiPhone className="w-3 h-3" />
              {row.phone}
            </div>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone', render: (row) => (
      <div className="flex items-center gap-2">
        <FiPhone className="w-4 h-4 text-gray-400" />
        <span className="dark:text-white">{row.phone}</span>
      </div>
    )},
    { header: 'CNIC', accessor: 'cnic' },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    { 
      header: 'Plan & Fee', 
      render: (row) => {
        const membership = row.memberships?.[0];
        const planName = membership?.plan?.name || 'No Plan';
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{planName}</div>
            <div className="flex items-center gap-1">
              <FiDollarSign className="w-3 h-3 text-green-500" />
              <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                Rs {Number(row.monthlyFee).toLocaleString()}
              </span>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Join Date', 
      render: (row) => new Date(row.joinDate).toLocaleDateString()
    },
    { 
      header: 'Expiry', 
      render: (row) => {
        const expiry = new Date(row.expiryDate);
        const isExpired = expiry < new Date();
        return (
          <span className={isExpired ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}>
            {expiry.toLocaleDateString()}
          </span>
        );
      }
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
                onClick={() => { navigate(`/member-card/${row.id}`); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600"
              >
                <FiCreditCard className="w-4 h-4" /> View Card
              </button>
              <button
                onClick={() => { handleEdit(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Edit Member
              </button>
              <button
                onClick={() => { generateCard(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiCreditCard className="w-4 h-4" /> Generate Card
              </button>
              <button
                onClick={() => { openPaymentModal(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
              >
                <FiDollarSign className="w-4 h-4" /> Add Payment
              </button>
              {row.status === 'blocked' ? (
                <button
                  onClick={() => { handleUnblock(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                >
                  <FiUnlock className="w-4 h-4" /> Unblock Member
                </button>
              ) : (
                <button
                  onClick={() => { handleBlock(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
                >
                  <FiLock className="w-4 h-4" /> Block Member
                </button>
              )}
              <button
                onClick={() => { openMessageModal(row, 'due'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiMessageSquare className="w-4 h-4" /> Send Due Message
              </button>
              <button
                onClick={() => { openMessageModal(row, 'renewal'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" /> Send Renewal Message
              </button>
              <button
                onClick={() => { openReportModal(row, 'payment'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiBarChart className="w-4 h-4" /> Payment Report
              </button>
              <button
                onClick={() => { openReportModal(row, 'attendance'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiFileText className="w-4 h-4" /> Attendance Report
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Member
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
            <FiUsers className="text-blue-500" />
            <span>Members Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {pagination.total} members
          </p>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportMembers}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FiDownload /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Add Member
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <select
              value={filters.planType}
              onChange={(e) => setFilters({ ...filters, planType: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={members}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>

      {/* Add/Edit Member Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingMember(null); 
          resetForm();
        }} 
        title={editingMember ? "Edit Member" : "Add New Member"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiUser className="w-4 h-4" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiMail className="w-4 h-4" />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Password {editingMember && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required={!editingMember}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiPhone className="w-4 h-4" />
                <span>Phone</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">CNIC</label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="12345-1234567-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiCalendar className="w-4 h-4" />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiDollarSign className="w-4 h-4" />
                <span>Monthly Fee (Rs)</span>
              </label>
              <input
                type="number"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
              <FiMapPin className="w-4 h-4" />
              <span>Address</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Membership Plan</label>
            <select
              value={formData.planId}
              onChange={(e) => {
                const selectedPlan = plans.find(p => p.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  planId: e.target.value,
                  planType: selectedPlan?.type || 'BASIC',
                  monthlyFee: selectedPlan ? selectedPlan.price : formData.monthlyFee
                });
              }}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a plan (optional)</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.type}) - Rs {Number(plan.price).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingMember ? 'Update Member' : 'Add Member'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Member Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Member Details"
      >
        {viewingMember && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingMember.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingMember.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingMember.user?.email}</p>
                {getStatusBadge(viewingMember.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingMember.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">
                    {viewingMember.dob ? new Date(viewingMember.dob).toLocaleDateString() : 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingMember.address || 'Not provided'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white font-medium">Rs {Number(viewingMember.monthlyFee).toLocaleString()}/month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Joined: {new Date(viewingMember.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiActivity className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Expires: {new Date(viewingMember.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {viewingMember.attendance?.length > 0 && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Recent Attendance</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {viewingMember.attendance.slice(0, 5).map((att, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="dark:text-white">{new Date(att.date).toLocaleDateString()}</span>
                      <span className="text-gray-500">{new Date(att.checkInTime).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* Message Modal */}
      <AnimatedModal 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)} 
        title={`Send ${messageType === 'due' ? 'Due' : 'Renewal'} Message`}
      >
        <div className="space-y-4">
          <p className="dark:text-white">
            Send {messageType === 'due' ? 'payment due' : 'renewal'} reminder to {selectedMember?.name}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleSendMessage('sms')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FiMessageSquare /> SMS
            </button>
            <button
              onClick={() => handleSendMessage('whatsapp')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <FiMessageSquare /> WhatsApp
            </button>
            <button
              onClick={() => handleSendMessage('email')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiMail /> Email
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Report Modal */}
      <AnimatedModal 
        isOpen={isReportModalOpen} 
        onClose={() => {
          setIsReportModalOpen(false);
          setReportData(null);
        }} 
        title={`${reportType === 'payment' ? 'Payment' : 'Attendance'} Report - ${selectedMember?.name}`}
      >
        <div className="space-y-4">
          {loadingReport ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading report...</p>
            </div>
          ) : reportData ? (
            <div>
              {reportType === 'payment' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{reportData.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">Rs {Number(reportData.totalPaid).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Amount</th>
                          <th className="px-3 py-2 text-left">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.payments.map((payment, idx) => (
                          <tr key={idx} className="border-b dark:border-gray-600">
                            <td className="px-3 py-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-green-600 dark:text-green-400">Rs {Number(payment.amount).toLocaleString()}</td>
                            <td className="px-3 py-2">{payment.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Days</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{reportData.totalDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hours</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{reportData.avgHours}h</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Check In</th>
                          <th className="px-3 py-2 text-left">Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.attendance.map((att, idx) => (
                          <tr key={idx} className="border-b dark:border-gray-600">
                            <td className="px-3 py-2">{new Date(att.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{new Date(att.checkInTime).toLocaleTimeString()}</td>
                            <td className="px-3 py-2">{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : 'Not checked out'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No data available</p>
          )}
        </div>
      </AnimatedModal>

      {/* Payment Modal */}
      <AnimatedModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentData({ amount: '', method: 'CASH', notes: '' });
        }} 
        title={`Record Payment - ${selectedMember?.name}`}
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
              <FiDollarSign className="w-4 h-4" />
              <span>Amount (Rs)</span>
            </label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Payment Method</label>
            <select
              value={paymentData.method}
              onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
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
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add any notes about this payment..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiDollarSign /> Record Payment
          </button>
        </form>
      </AnimatedModal>
    </div>
  );
};

export default Members;

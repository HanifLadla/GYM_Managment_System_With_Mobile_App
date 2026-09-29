import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiUser, 
  FiPhone, FiMail, FiAward, FiUsers, FiMoreVertical, FiCreditCard,
  FiLock, FiUnlock, FiDollarSign, FiCheckCircle, FiAlertCircle, FiActivity
} from 'react-icons/fi';

const Trainers = () => {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [viewingTrainer, setViewingTrainer] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formData, setFormData] = useState({ 
    email: '', password: '', name: '', specialization: '', phone: '', 
    address: '', dob: '', gender: '', cnic: '', salary: 0, status: 'active'
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => { fetchTrainers(); }, []);

  const fetchTrainers = async () => {
    try {
      const { data } = await axios.get('/api/trainers');
      setTrainers(data);
    } catch {
      addAlert('Failed to load trainers', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrainer) {
        await axios.put(`/api/trainers/${editingTrainer.id}`, formData);
        addAlert('Trainer updated successfully!', 'success');
      } else {
        await axios.post('/api/trainers', formData);
        addAlert('Trainer added successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingTrainer(null);
      fetchTrainers();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save trainer', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '', specialization: '', phone: '', address: '', dob: '', gender: '', cnic: '', salary: 0, status: 'active' });
  };

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      phone: trainer.phone,
      email: trainer.user?.email || '',
      password: '',
      specialization: trainer.specialization || '',
      address: trainer.address || '',
      dob: trainer.dob ? new Date(trainer.dob).toISOString().split('T')[0] : '',
      gender: trainer.gender || '',
      cnic: trainer.cnic || '',
      salary: trainer.salary || 0,
      status: trainer.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleView = async (trainer) => {
    try {
      const { data } = await axios.get(`/api/trainers/${trainer.id}`);
      setViewingTrainer(data);
      setIsViewModalOpen(true);
    } catch {
      addAlert('Failed to load trainer details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this trainer?')) return;
    try {
      await axios.delete(`/api/trainers/${id}`);
      addAlert('Trainer deleted successfully!', 'success');
      fetchTrainers();
    } catch {
      addAlert('Failed to delete trainer', 'error');
    }
  };

  const handleStatusToggle = async (trainer) => {
    const newStatus = trainer.status === 'blocked' ? 'active' : 'blocked';
    const action = newStatus === 'blocked' ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} this trainer?`)) return;
    try {
      await axios.put(`/api/trainers/${trainer.id}`, { status: newStatus });
      addAlert(`Trainer ${action}ed successfully!`, 'success');
      fetchTrainers();
    } catch {
      addAlert(`Failed to ${action} trainer`, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>
        {status || 'active'}
      </span>
    );
  };

  const filteredTrainers = trainers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone?.includes(searchTerm) ||
      t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || (t.status || 'active') === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: trainers.length,
    active: trainers.filter(t => (t.status || 'active') === 'active').length,
    blocked: trainers.filter(t => t.status === 'blocked').length,
    totalClasses: trainers.reduce((sum, t) => sum + (t.classes?.length || 0), 0)
  };

  const statCards = [
    { label: 'Total Trainers', value: stats.total, icon: FiUsers, color: 'from-green-500 to-green-600' },
    { label: 'Active Trainers', value: stats.active, icon: FiCheckCircle, color: 'from-blue-500 to-blue-600' },
    { label: 'Blocked', value: stats.blocked, icon: FiAlertCircle, color: 'from-red-500 to-red-600' },
    { label: 'Total Classes', value: stats.totalClasses, icon: FiActivity, color: 'from-purple-500 to-purple-600' },
  ];

  const columns = [
    { 
      header: 'Trainer', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {row.name.charAt(0)}
            </div>
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${row.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'}`}></div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiMail className="w-3 h-3" />{row.user?.email}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
              <FiPhone className="w-3 h-3" />{row.phone}
            </div>
          </div>
        </div>
      )
    },
    { 
      header: 'Specialization', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiAward className="w-4 h-4 text-yellow-500" />
          <span className="dark:text-white">{row.specialization || 'General'}</span>
        </div>
      )
    },
    { 
      header: 'Salary', 
      render: (row) => (
        <div className="flex items-center gap-1">
          <FiDollarSign className="w-4 h-4 text-green-500" />
          <span className="font-semibold text-green-600 dark:text-green-400">
            Rs {Number(row.salary || 0).toLocaleString()}
          </span>
        </div>
      )
    },
    { 
      header: 'Classes', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiUsers className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">{row.classes?.length || 0}</span>
        </div>
      )
    },
    { header: 'Status', render: (row) => getStatusBadge(row.status || 'active') },
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
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { handleView(row); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <FiEye className="w-4 h-4" /> View Details
              </button>
              <button onClick={() => { navigate(`/trainer-card/${row.id}`); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600">
                <FiCreditCard className="w-4 h-4" /> View Card
              </button>
              <button onClick={() => { handleEdit(row); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <FiEdit className="w-4 h-4" /> Edit Trainer
              </button>
              {(row.status || 'active') === 'blocked' ? (
                <button onClick={() => { handleStatusToggle(row); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600">
                  <FiUnlock className="w-4 h-4" /> Unblock Trainer
                </button>
              ) : (
                <button onClick={() => { handleStatusToggle(row); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600">
                  <FiLock className="w-4 h-4" /> Block Trainer
                </button>
              )}
              <button onClick={() => { handleDelete(row.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600">
                <FiTrash2 className="w-4 h-4" /> Delete Trainer
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
            <FiUsers className="text-green-500" />
            <span>Trainers Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Total: {trainers.length} trainers</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add Trainer
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={filteredTrainers} />
      </div>

      {/* Add/Edit Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingTrainer(null); resetForm(); }} 
        title={editingTrainer ? "Edit Trainer" : "Add New Trainer"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Full Name</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Password {editingTrainer && '(leave blank to keep)'}
              </label>
              <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required={!editingTrainer} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Specialization</label>
              <input type="text" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Yoga, CrossFit, Boxing" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">CNIC</label>
              <input type="text" value={formData.cnic} onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="12345-1234567-1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Salary (Rs)</label>
              <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                min="0" />
            </div>
            {editingTrainer && (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            {editingTrainer ? 'Update Trainer' : 'Add Trainer'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Modal */}
      <AnimatedModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Trainer Details">
        {viewingTrainer && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingTrainer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingTrainer.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingTrainer.user?.email}</p>
                {getStatusBadge(viewingTrainer.status || 'active')}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingTrainer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiAward className="w-4 h-4 text-yellow-500" />
                  <span className="dark:text-white">{viewingTrainer.specialization || 'General'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-blue-500" />
                  <span className="dark:text-white font-medium">{viewingTrainer.classes?.length || 0} Classes</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Rs {Number(viewingTrainer.salary || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
            {viewingTrainer.classes?.length > 0 && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Assigned Classes</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {viewingTrainer.classes.map((cls, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="dark:text-white font-medium">{cls.name}</span>
                      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <span>{cls.schedule || 'No schedule'}</span>
                        <span className="flex items-center gap-1">
                          <FiUsers className="w-3 h-3" />
                          {cls.enrollment?.length || 0}/{cls.maxCapacity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default Trainers;

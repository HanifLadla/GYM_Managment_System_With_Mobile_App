import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, FiSearch, FiUser, 
  FiPhone, FiMail, FiAward, FiUsers, FiMoreVertical, FiCreditCard,
  FiLock, FiUnlock, FiMessageSquare, FiBarChart
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
  const [formData, setFormData] = useState({ 
    email: '', password: '', name: '', specialization: '', phone: '', 
    address: '', dob: '', gender: '', cnic: '', salary: 0, status: 'active'
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchTrainers();
  }, [searchTerm]);

  const fetchTrainers = async () => {
    try {
      const { data } = await axios.get('/api/trainers');
      const filtered = data.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phone?.includes(searchTerm) ||
        t.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setTrainers(filtered);
    } catch (error) {
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
    setFormData({ 
      email: '', password: '', name: '', specialization: '', phone: '',
      address: '', dob: '', gender: '', cnic: '', salary: 0, status: 'active'
    });
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
    } catch (error) {
      addAlert('Failed to load trainer details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this trainer?')) return;
    try {
      await axios.delete(`/api/trainers/${id}`);
      addAlert('Trainer deleted successfully!', 'success');
      fetchTrainers();
    } catch (error) {
      addAlert('Failed to delete trainer', 'error');
    }
  };

  const handleBlock = async (id) => {
    if (!confirm('Are you sure you want to block this trainer?')) return;
    try {
      await axios.put(`/api/trainers/${id}`, { status: 'blocked' });
      addAlert('Trainer blocked successfully!', 'success');
      fetchTrainers();
    } catch (error) {
      addAlert('Failed to block trainer', 'error');
    }
  };

  const handleUnblock = async (id) => {
    if (!confirm('Are you sure you want to unblock this trainer?')) return;
    try {
      await axios.put(`/api/trainers/${id}`, { status: 'active' });
      addAlert('Trainer unblocked successfully!', 'success');
      fetchTrainers();
    } catch (error) {
      addAlert('Failed to unblock trainer', 'error');
    }
  };

  const viewCard = (trainer) => {
    navigate(`/trainer-card/${trainer.id}`);
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>
        {status || 'active'}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Trainer', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
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
    { 
      header: 'Specialization', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiAward className="w-4 h-4 text-yellow-500" />
          <span className="dark:text-white">{row.specialization || 'General'}</span>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone', render: (row) => (
      <div className="flex items-center gap-2">
        <FiPhone className="w-4 h-4 text-gray-400" />
        <span className="dark:text-white">{row.phone}</span>
      </div>
    )},
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
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
                onClick={() => { viewCard(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600"
              >
                <FiCreditCard className="w-4 h-4" /> View Card
              </button>
              <button
                onClick={() => { handleEdit(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Edit Trainer
              </button>
              {row.status === 'blocked' ? (
                <button
                  onClick={() => { handleUnblock(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                >
                  <FiUnlock className="w-4 h-4" /> Unblock Trainer
                </button>
              ) : (
                <button
                  onClick={() => { handleBlock(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
                >
                  <FiLock className="w-4 h-4" /> Block Trainer
                </button>
              )}
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {trainers.length} trainers
          </p>
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search trainers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Trainers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={trainers} />
      </div>

      {/* Add/Edit Trainer Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingTrainer(null); 
          resetForm();
        }} 
        title={editingTrainer ? "Edit Trainer" : "Add New Trainer"}
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
                Password {editingTrainer && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required={!editingTrainer}
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
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiAward className="w-4 h-4" />
                <span>Specialization</span>
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Yoga, CrossFit, Boxing"
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
              <label className="block text-sm font-medium mb-2 dark:text-white">Salary (Rs)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingTrainer ? 'Update Trainer' : 'Add Trainer'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Trainer Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Trainer Details"
      >
        {viewingTrainer && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingTrainer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingTrainer.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingTrainer.user?.email}</p>
                {getStatusBadge(viewingTrainer.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingTrainer.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiAward className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingTrainer.specialization || 'General'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiUsers className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white font-medium">{viewingTrainer.classes?.length || 0} Classes</span>
                </div>
              </div>
            </div>
            
            {viewingTrainer.classes?.length > 0 && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Classes</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {viewingTrainer.classes.map((cls, idx) => (
                    <div key={idx} className="flex justify-between text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="dark:text-white">{cls.name}</span>
                      <span className="text-gray-500">{cls.schedule}</span>
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

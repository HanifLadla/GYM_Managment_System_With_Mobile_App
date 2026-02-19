import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiUsers, FiClock,
  FiMoreVertical, FiUserPlus, FiUserMinus, FiCalendar, FiAward,
  FiActivity, FiLock, FiUnlock
} from 'react-icons/fi';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [viewingClass, setViewingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', trainerId: '', maxCapacity: 20, schedule: '', 
    duration: 60, description: '', status: 'active', fee: 0
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchClasses();
    fetchTrainers();
    fetchMembers();
  }, [searchTerm]);

  const fetchClasses = async () => {
    try {
      const { data } = await axios.get('/api/classes');
      const filtered = data.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.trainer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setClasses(filtered);
    } catch (error) {
      addAlert('Failed to load classes', 'error');
    }
  };

  const fetchTrainers = async () => {
    try {
      const { data } = await axios.get('/api/trainers');
      setTrainers(data);
    } catch (error) {
      addAlert('Failed to load trainers', 'error');
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
      if (editingClass) {
        await axios.put(`/api/classes/${editingClass.id}`, formData);
        addAlert('Class updated successfully!', 'success');
      } else {
        await axios.post('/api/classes', formData);
        addAlert('Class added successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingClass(null);
      fetchClasses();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save class', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', trainerId: '', maxCapacity: 20, schedule: '', 
      duration: 60, description: '', status: 'active', fee: 0
    });
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      trainerId: classItem.trainerId,
      maxCapacity: classItem.maxCapacity,
      schedule: classItem.schedule || '',
      duration: classItem.duration || 60,
      description: classItem.description || '',
      status: classItem.status || 'active',
      fee: classItem.fee || 0
    });
    setIsModalOpen(true);
  };

  const handleView = async (classItem) => {
    try {
      const { data } = await axios.get(`/api/classes/${classItem.id}`);
      setViewingClass(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load class details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this class?')) return;
    try {
      await axios.delete(`/api/classes/${id}`);
      addAlert('Class deleted successfully!', 'success');
      fetchClasses();
    } catch (error) {
      addAlert('Failed to delete class', 'error');
    }
  };

  const handleStatusToggle = async (classItem) => {
    const newStatus = classItem.status === 'active' ? 'inactive' : 'active';
    try {
      await axios.put(`/api/classes/${classItem.id}`, { status: newStatus });
      addAlert(`Class ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
      fetchClasses();
    } catch (error) {
      addAlert('Failed to update class status', 'error');
    }
  };

  const openEnrollModal = (classItem) => {
    setSelectedClass(classItem);
    setIsEnrollModalOpen(true);
  };

  const handleEnroll = async (memberId) => {
    try {
      await axios.post(`/api/classes/${selectedClass.id}/enroll`, { memberId });
      addAlert('Member enrolled successfully!', 'success');
      setIsEnrollModalOpen(false);
      fetchClasses();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to enroll member', 'error');
    }
  };

  const handleUnenroll = async (memberId) => {
    if (!confirm('Are you sure you want to unenroll this member?')) return;
    try {
      await axios.post(`/api/classes/${viewingClass.id}/unenroll`, { memberId });
      addAlert('Member unenrolled successfully!', 'success');
      handleView(viewingClass);
      fetchClasses();
    } catch (error) {
      addAlert('Failed to unenroll member', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      full: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Class', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              {row.duration || 60} mins
            </div>
          </div>
        </div>
      )
    },
    { 
      header: 'Trainer', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiAward className="w-4 h-4 text-yellow-500" />
          <span className="dark:text-white">{row.trainer?.name || 'Not Assigned'}</span>
        </div>
      )
    },
    { 
      header: 'Schedule', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-blue-500" />
          <span className="dark:text-white text-sm">{row.schedule || 'Not Set'}</span>
        </div>
      )
    },
    { 
      header: 'Capacity', 
      render: (row) => {
        const enrolled = row.enrollments?.length || 0;
        const percentage = (enrolled / row.maxCapacity) * 100;
        const isFull = enrolled >= row.maxCapacity;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FiUsers className="w-4 h-4 text-gray-400" />
              <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-blue-600'} dark:text-blue-400`}>
                {enrolled}/{row.maxCapacity}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${isFull ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Status', 
      render: (row) => {
        const enrolled = row.enrollments?.length || 0;
        const isFull = enrolled >= row.maxCapacity;
        return getStatusBadge(isFull ? 'full' : row.status);
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
                onClick={() => { handleEdit(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Edit Class
              </button>
              <button
                onClick={() => { openEnrollModal(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
              >
                <FiUserPlus className="w-4 h-4" /> Enroll Member
              </button>
              {row.status === 'active' ? (
                <button
                  onClick={() => { handleStatusToggle(row); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
                >
                  <FiLock className="w-4 h-4" /> Deactivate Class
                </button>
              ) : (
                <button
                  onClick={() => { handleStatusToggle(row); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                >
                  <FiUnlock className="w-4 h-4" /> Activate Class
                </button>
              )}
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Class
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
            <FiActivity className="text-purple-500" />
            <span>Classes Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {classes.length} classes
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add Class
        </motion.button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes by name or trainer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={classes} />
      </div>

      {/* Add/Edit Class Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingClass(null); 
          resetForm();
        }} 
        title={editingClass ? "Edit Class" : "Add New Class"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Class Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., Yoga, CrossFit, Zumba"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Trainer</label>
              <select
                value={formData.trainerId}
                onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Trainer</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} - {t.specialization}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Max Capacity</label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                min="15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Schedule</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mon/Wed/Fri 6:00 AM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Fee (Rs)</label>
              <input
                type="number"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Class description..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingClass ? 'Update Class' : 'Add Class'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Class Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Class Details"
      >
        {viewingClass && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingClass.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingClass.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">Trainer: {viewingClass.trainer?.name}</p>
                {getStatusBadge(viewingClass.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingClass.duration || 60} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingClass.schedule || 'Not Set'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingClass.enrollments?.length || 0}/{viewingClass.maxCapacity}</span>
                </div>
              </div>
            </div>

            {viewingClass.description && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{viewingClass.description}</p>
              </div>
            )}
            
            {viewingClass.enrollments?.length > 0 && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Enrolled Members ({viewingClass.enrollments.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingClass.enrollments.map((enrollment, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="dark:text-white">{enrollment.member?.name}</span>
                      <button
                        onClick={() => handleUnenroll(enrollment.memberId)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <FiUserMinus className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* Enroll Member Modal */}
      <AnimatedModal 
        isOpen={isEnrollModalOpen} 
        onClose={() => setIsEnrollModalOpen(false)} 
        title={`Enroll Member - ${selectedClass?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a member to enroll in this class
          </p>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {members.filter(m => m.status === 'active').map(member => (
              <button
                key={member.id}
                onClick={() => handleEnroll(member.id)}
                className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <div className="font-medium dark:text-white">{member.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{member.phone}</div>
              </button>
            ))}
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
};

export default Classes;

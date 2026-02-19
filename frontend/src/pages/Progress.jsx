import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, FiSearch, FiFilter, FiUser, FiCalendar, FiActivity, FiMoreVertical } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import axios from 'axios';

const Progress = () => {
  const [progress, setProgress] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [viewingProgress, setViewingProgress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ memberId: 'all', dateRange: 'all' });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [formData, setFormData] = useState({
    memberId: '',
    weight: '',
    bmi: '',
    bodyFat: '',
    notes: ''
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchProgress();
    fetchMembers();
  }, [searchTerm, filters, pagination.page]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        search: searchTerm,
        memberId: filters.memberId
      });
      const response = await axios.get(`/api/progress?${params}`);
      let data = response.data.progress || [];
      
      // Apply date range filter on frontend
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        if (filters.dateRange === 'week') filterDate.setDate(now.getDate() - 7);
        else if (filters.dateRange === 'month') filterDate.setMonth(now.getMonth() - 1);
        else if (filters.dateRange === '3months') filterDate.setMonth(now.getMonth() - 3);
        data = data.filter(p => new Date(p.date) >= filterDate);
      }
      
      setProgress(data);
      setPagination({ 
        page: response.data.page, 
        pages: response.data.pages, 
        total: response.data.total 
      });
    } catch (error) {
      addAlert('Failed to load progress records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get('/api/members');
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProgress) {
        await axios.put(`/api/progress/${selectedProgress.id}`, formData);
        addAlert('Progress updated successfully!', 'success');
      } else {
        await axios.post('/api/progress', formData);
        addAlert('Progress added successfully!', 'success');
      }
      fetchProgress();
      setShowModal(false);
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save progress', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this progress record?')) return;
    try {
      await axios.delete(`/api/progress/${id}`);
      addAlert('Progress deleted successfully!', 'success');
      fetchProgress();
    } catch (error) {
      addAlert('Failed to delete progress', 'error');
    }
  };

  const handleView = (progressRecord) => {
    setViewingProgress(progressRecord);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      weight: '',
      bmi: '',
      bodyFat: '',
      notes: ''
    });
    setSelectedProgress(null);
  };

  const openModal = (progressRecord = null) => {
    if (progressRecord) {
      setSelectedProgress(progressRecord);
      setFormData({
        memberId: progressRecord.memberId,
        weight: progressRecord.weight,
        bmi: progressRecord.bmi || '',
        bodyFat: progressRecord.bodyFat || '',
        notes: progressRecord.notes || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const exportProgress = async () => {
    try {
      const csv = [
        'Member,Date,Weight (kg),BMI,Body Fat %,Notes',
        ...progress.map(p => [
          p.member?.name || 'N/A',
          new Date(p.date).toLocaleDateString(),
          p.weight,
          p.bmi || 'N/A',
          p.bodyFat || 'N/A',
          p.notes || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'progress-records.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addAlert('Progress records exported successfully!', 'success');
    } catch (error) {
      addAlert('Failed to export progress records', 'error');
    }
  };

  const getWeightTrend = (memberId) => {
    const memberProgress = progress.filter(p => p.memberId === memberId).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (memberProgress.length < 2) return 'neutral';
    const latest = memberProgress[memberProgress.length - 1].weight;
    const previous = memberProgress[memberProgress.length - 2].weight;
    return latest < previous ? 'down' : latest > previous ? 'up' : 'neutral';
  };

  const columns = [
    { 
      header: 'Member', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            {row.member?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.member?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">ID: {row.memberId.slice(0, 8)}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Date', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <span className="dark:text-white">{new Date(row.date).toLocaleDateString()}</span>
        </div>
      )
    },
    { 
      header: 'Weight', 
      render: (row) => {
        const trend = getWeightTrend(row.memberId);
        return (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">{row.weight} kg</span>
            {trend === 'down' && <span className="text-green-500">↓</span>}
            {trend === 'up' && <span className="text-red-500">↑</span>}
            {trend === 'neutral' && <span className="text-gray-400">→</span>}
          </div>
        );
      }
    },
    { 
      header: 'BMI', 
      render: (row) => {
        const bmi = row.bmi ? parseFloat(row.bmi) : null;
        let color = 'text-gray-600';
        let status = 'N/A';
        if (bmi) {
          if (bmi < 18.5) { color = 'text-blue-600'; status = 'Underweight'; }
          else if (bmi < 25) { color = 'text-green-600'; status = 'Normal'; }
          else if (bmi < 30) { color = 'text-yellow-600'; status = 'Overweight'; }
          else { color = 'text-red-600'; status = 'Obese'; }
        }
        return (
          <div>
            <div className={`font-semibold ${color}`}>{bmi ? bmi.toFixed(1) : 'N/A'}</div>
            {bmi && <div className="text-xs text-gray-500">{status}</div>}
          </div>
        );
      }
    },
    { 
      header: 'Body Fat %', 
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {row.bodyFat ? `${parseFloat(row.bodyFat).toFixed(1)}%` : 'N/A'}
        </span>
      )
    },
    { 
      header: 'Notes', 
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs block">
          {row.notes || '-'}
        </span>
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
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-40" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { handleView(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" /> View Details
              </button>
              <button
                onClick={() => { openModal(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Edit Record
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Record
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
            <FiTrendingUp className="text-green-500" />
            <span>Progress Tracking</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {pagination.total} records
          </p>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportProgress}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FiDownload /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Add Progress
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by member name or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.memberId}
              onChange={(e) => setFilters({ ...filters, memberId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Members</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="3months">Last 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Progress Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={progress}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>

      {/* Add/Edit Modal */}
      <AnimatedModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={selectedProgress ? 'Edit Progress Record' : 'Add Progress Record'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
              <FiUser className="w-4 h-4" />
              <span>Member</span>
            </label>
            <select
              value={formData.memberId}
              onChange={(e) => setFormData({...formData, memberId: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!selectedProgress}
            >
              <option value="">Select Member</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData({...formData, weight: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">BMI</label>
              <input
                type="number"
                step="0.1"
                value={formData.bmi}
                onChange={(e) => setFormData({...formData, bmi: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={formData.bodyFat}
                onChange={(e) => setFormData({...formData, bodyFat: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add any notes about this progress record..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {selectedProgress ? 'Update' : 'Add'} Progress
            </button>
          </div>
        </form>
      </AnimatedModal>

      {/* View Modal */}
      <AnimatedModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Progress Details"
      >
        {viewingProgress && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingProgress.member?.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingProgress.member?.name || 'Unknown'}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {new Date(viewingProgress.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Weight</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{viewingProgress.weight} kg</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">BMI</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {viewingProgress.bmi ? parseFloat(viewingProgress.bmi).toFixed(1) : 'N/A'}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Body Fat</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {viewingProgress.bodyFat ? `${parseFloat(viewingProgress.bodyFat).toFixed(1)}%` : 'N/A'}
                </div>
              </div>
            </div>
            
            {viewingProgress.notes && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Notes</h4>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {viewingProgress.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default Progress;

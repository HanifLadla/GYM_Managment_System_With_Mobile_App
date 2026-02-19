import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, FiSearch, FiUser, FiCalendar, FiActivity, FiMoreVertical, FiTarget } from 'react-icons/fi';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import axios from 'axios';

const DietPlans = () => {
  const [dietPlans, setDietPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ memberId: 'all', goal: 'all', status: 'all' });
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [formData, setFormData] = useState({
    memberId: '', trainerId: '', name: '', goal: 'WEIGHT_LOSS',
    targetCalories: '', targetProtein: '', targetCarbs: '', targetFats: '',
    endDate: '', notes: ''
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchDietPlans();
    fetchMembers();
    fetchTrainers();
  }, [searchTerm, filters]);

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.memberId !== 'all') params.append('memberId', filters.memberId);
      if (filters.status !== 'all') params.append('status', filters.status);
      
      const response = await axios.get(`/api/diet-plans?${params}`);
      let data = response.data || [];
      
      if (filters.goal !== 'all') data = data.filter(p => p.goal === filters.goal);
      if (searchTerm) {
        data = data.filter(p => 
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.member?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setDietPlans(data);
      setPagination(prev => ({ ...prev, total: data.length, pages: Math.ceil(data.length / 10) }));
    } catch (error) {
      addAlert('Failed to load diet plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/members');
      setMembers(data.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchTrainers = async () => {
    try {
      const { data } = await axios.get('/api/trainers');
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedPlan) {
        await axios.put(`/api/diet-plans/${selectedPlan.id}`, formData);
        addAlert('Diet plan updated successfully!', 'success');
      } else {
        await axios.post('/api/diet-plans', formData);
        addAlert('Diet plan created successfully!', 'success');
      }
      fetchDietPlans();
      setShowModal(false);
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save diet plan', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this diet plan?')) return;
    try {
      await axios.delete(`/api/diet-plans/${id}`);
      addAlert('Diet plan deleted successfully!', 'success');
      fetchDietPlans();
    } catch (error) {
      addAlert('Failed to delete diet plan', 'error');
    }
  };

  const handleView = async (plan) => {
    try {
      const { data } = await axios.get(`/api/diet-plans/${plan.id}`);
      setViewingPlan(data);
      setShowViewModal(true);
    } catch (error) {
      addAlert('Failed to load diet plan details', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      memberId: '', trainerId: '', name: '', goal: 'WEIGHT_LOSS',
      targetCalories: '', targetProtein: '', targetCarbs: '', targetFats: '',
      endDate: '', notes: ''
    });
    setSelectedPlan(null);
  };

  const openModal = (plan = null) => {
    if (plan) {
      setSelectedPlan(plan);
      setFormData({
        memberId: plan.memberId,
        trainerId: plan.trainerId || '',
        name: plan.name,
        goal: plan.goal,
        targetCalories: plan.targetCalories,
        targetProtein: plan.targetProtein,
        targetCarbs: plan.targetCarbs,
        targetFats: plan.targetFats,
        endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
        notes: plan.notes || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const exportDietPlans = async () => {
    try {
      const csv = [
        'Plan Name,Member,Trainer,Goal,Calories,Protein,Carbs,Fats,Status',
        ...dietPlans.map(p => [
          p.name, p.member?.name || 'N/A', p.trainer?.name || 'N/A',
          p.goal, p.targetCalories, p.targetProtein, p.targetCarbs, p.targetFats, p.status
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'diet-plans.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addAlert('Diet plans exported successfully!', 'success');
    } catch (error) {
      addAlert('Failed to export diet plans', 'error');
    }
  };

  const getGoalBadge = (goal) => {
    const colors = {
      WEIGHT_LOSS: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      WEIGHT_GAIN: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      MUSCLE_GAIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      MAINTENANCE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      ATHLETIC: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[goal]}`}>
        {goal.replace('_', ' ')}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Plan & Member', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
            <FiHeart />
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.member?.name || 'Unknown'}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Trainer', 
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.trainer?.name || 'Not Assigned'}
        </span>
      )
    },
    { header: 'Goal', render: (row) => getGoalBadge(row.goal) },
    { 
      header: 'Macros', 
      render: (row) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Cal:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{row.targetCalories}</span>
          </div>
          <div className="flex gap-2 text-gray-600 dark:text-gray-400">
            <span>P:{row.targetProtein}g</span>
            <span>C:{row.targetCarbs}g</span>
            <span>F:{row.targetFats}g</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Duration', 
      render: (row) => (
        <div className="text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            {new Date(row.startDate).toLocaleDateString()}
          </div>
          {row.endDate && (
            <div className="text-xs text-gray-500">
              to {new Date(row.endDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
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
                <FiEdit className="w-4 h-4" /> Edit Plan
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Plan
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
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center space-x-2">
            <FiHeart className="text-red-500" />
            <span>Diet Plans</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Total: {pagination.total} plans</p>
        </div>
        <div className="flex space-x-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={exportDietPlans}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FiDownload /> Export
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Add Diet Plan
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search diet plans..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select value={filters.memberId} onChange={(e) => setFilters({ ...filters, memberId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Members</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <select value={filters.goal} onChange={(e) => setFilters({ ...filters, goal: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Goals</option>
              <option value="WEIGHT_LOSS">Weight Loss</option>
              <option value="WEIGHT_GAIN">Weight Gain</option>
              <option value="MUSCLE_GAIN">Muscle Gain</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="ATHLETIC">Athletic</option>
            </select>
          </div>
          <div>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={dietPlans} loading={loading} />
      </div>

      <AnimatedModal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
        title={selectedPlan ? 'Edit Diet Plan' : 'Add Diet Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Member</label>
              <select value={formData.memberId} onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required
              >
                <option value="">Select Member</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Trainer</label>
              <select value={formData.trainerId} onChange={(e) => setFormData({...formData, trainerId: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Trainer</option>
                {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Plan Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Goal</label>
              <select value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="WEIGHT_LOSS">Weight Loss</option>
                <option value="WEIGHT_GAIN">Weight Gain</option>
                <option value="MUSCLE_GAIN">Muscle Gain</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ATHLETIC">Athletic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">End Date</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Calories</label>
              <input type="number" value={formData.targetCalories} onChange={(e) => setFormData({...formData, targetCalories: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Protein (g)</label>
              <input type="number" step="0.1" value={formData.targetProtein} onChange={(e) => setFormData({...formData, targetProtein: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Carbs (g)</label>
              <input type="number" step="0.1" value={formData.targetCarbs} onChange={(e) => setFormData({...formData, targetCarbs: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Fats (g)</label>
              <input type="number" step="0.1" value={formData.targetFats} onChange={(e) => setFormData({...formData, targetFats: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows="3"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {selectedPlan ? 'Update' : 'Create'} Plan
            </button>
          </div>
        </form>
      </AnimatedModal>

      <AnimatedModal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Diet Plan Details">
        {viewingPlan && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl">
                <FiHeart />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingPlan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingPlan.member?.name}</p>
                {getGoalBadge(viewingPlan.goal)}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{viewingPlan.targetCalories}</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{viewingPlan.targetProtein}g</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{viewingPlan.targetCarbs}g</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Fats</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{viewingPlan.targetFats}g</div>
              </div>
            </div>
            {viewingPlan.trainer && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Trainer</h4>
                <p className="text-gray-600 dark:text-gray-400">{viewingPlan.trainer.name}</p>
              </div>
            )}
            {viewingPlan.notes && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Notes</h4>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{viewingPlan.notes}</p>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default DietPlans;

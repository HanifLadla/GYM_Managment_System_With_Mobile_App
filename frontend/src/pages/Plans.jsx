import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiClock, FiCheck } from 'react-icons/fi';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', duration: 1, features: []
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get('/api/plans');
      setPlans(data);
    } catch (error) {
      addAlert('Failed to load plans', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await axios.put(`/api/plans/${editingPlan.id}`, formData);
        addAlert('Plan updated successfully!', 'success');
      } else {
        await axios.post('/api/plans', formData);
        addAlert('Plan created successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingPlan(null);
      fetchPlans();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save plan', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', duration: 1, features: [] });
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    let features = [];
    if (typeof plan.features === 'string') {
      try {
        features = JSON.parse(plan.features);
      } catch {
        features = plan.features.split('\n').filter(f => f.trim());
      }
    } else {
      features = plan.features || [];
    }
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      duration: plan.duration,
      features: features
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this plan?')) return;
    try {
      await axios.delete(`/api/plans/${id}`);
      addAlert('Plan deactivated successfully!', 'success');
      fetchPlans();
    } catch (error) {
      addAlert('Failed to deactivate plan', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Membership Plans</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiPlus /> Add Plan
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold dark:text-white">{plan.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FiEdit />
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <FiDollarSign className="text-green-500" />
                <span className="text-2xl font-bold text-green-600">Rs {Number(plan.price).toLocaleString()}</span>
                <span className="text-gray-500">/month</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiClock className="text-blue-500" />
                <span className="dark:text-white">{plan.duration} month(s)</span>
              </div>
            </div>

            {plan.features && (
              <div className="space-y-1">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Features:</h4>
                {(() => {
                  let features = [];
                  if (typeof plan.features === 'string') {
                    try {
                      features = JSON.parse(plan.features);
                    } catch {
                      features = plan.features.split('\n');
                    }
                  } else {
                    features = plan.features || [];
                  }
                  return features.filter(feature => feature && feature.trim()).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <FiCheck className="text-green-500 w-4 h-4" />
                      <span className="text-sm dark:text-white">{feature.trim()}</span>
                    </div>
                  ));
                })()}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500">
                {plan._count?.membership || 0} active memberships
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingPlan(null); resetForm(); }} 
        title={editingPlan ? "Edit Plan" : "Add New Plan"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Plan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Price (Rs)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Duration (months)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="1"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Features (one per line)</label>
            <textarea
              value={formData.features.join('\n')}
              onChange={(e) => setFormData({ ...formData, features: e.target.value.split('\n').filter(f => f.trim()) })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="4"
              placeholder="Treadmill&#10;Exercise Bike&#10;Cross Trainer&#10;Weight Machines (Chest Press, Leg Press, Lat Pulldown)&#10;Dumbbells (Up to 20kg)&#10;Barbell (Standard)"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            {editingPlan ? 'Update Plan' : 'Create Plan'}
          </button>
        </form>
      </AnimatedModal>
    </div>
  );
};

export default Plans;
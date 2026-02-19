import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiFilter, FiDownload,
  FiMoreVertical, FiDollarSign, FiCalendar, FiTag, FiTrendingUp
} from 'react-icons/fi';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    paymentMethod: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });
  const [formData, setFormData] = useState({
    category: 'OTHER',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    vendor: '',
    receiptUrl: '',
    tags: []
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  const categories = [
    { value: 'SALARY', label: 'Salary' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'UTILITY', label: 'Utility' },
    { value: 'RENT', label: 'Rent' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'INSURANCE', label: 'Insurance' },
    { value: 'OTHER', label: 'Other' }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'UPI', label: 'UPI' }
  ];

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      const { data } = await axios.get(`/api/expenses?${params}`);
      setExpenses(data.expenses || data);
    } catch (error) {
      addAlert('Failed to load expenses', 'error');
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/expenses/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await axios.put(`/api/expenses/${editingExpense.id}`, formData);
        addAlert('Expense updated successfully!', 'success');
      } else {
        await axios.post('/api/expenses', formData);
        addAlert('Expense added successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingExpense(null);
      fetchExpenses();
      fetchStats();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save expense', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'OTHER',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      vendor: '',
      receiptUrl: '',
      tags: []
    });
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      description: expense.description.split(' - Vendor:')[0],
      paymentMethod: expense.metadata?.paymentMethod || 'CASH',
      vendor: expense.metadata?.vendor || '',
      receiptUrl: expense.metadata?.receiptUrl || '',
      tags: expense.metadata?.tags || []
    });
    setIsModalOpen(true);
  };

  const handleView = async (expense) => {
    try {
      const { data } = await axios.get(`/api/expenses/${expense.id}`);
      setViewingExpense(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load expense details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      addAlert('Expense deleted successfully!', 'success');
      fetchExpenses();
      fetchStats();
    } catch (error) {
      addAlert('Failed to delete expense', 'error');
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      SALARY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      EQUIPMENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      UTILITY: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      RENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      MARKETING: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      INSURANCE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[category] || colors.OTHER}`}>
        {categories.find(c => c.value === category)?.label || category}
      </span>
    );
  };

  const columns = [
    {
      header: 'Description',
      render: (row) => {
        // Clean description by removing metadata
        let cleanDescription = row.description;
        if (cleanDescription.includes(' | META:')) {
          cleanDescription = cleanDescription.split(' | META:')[0];
        }
        // Remove vendor info if it's already in the vendor column
        if (cleanDescription.includes(' - Vendor:')) {
          cleanDescription = cleanDescription.split(' - Vendor:')[0];
        }
        
        return (
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              <FiDollarSign />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{cleanDescription}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(row.date).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Category',
      render: (row) => getCategoryBadge(row.category)
    },
    {
      header: 'Amount',
      render: (row) => (
        <div className="font-semibold text-red-600 dark:text-red-400">
          Rs {Number(row.amount).toLocaleString()}
        </div>
      )
    },
    {
      header: 'Payment Method',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.metadata?.paymentMethod || 'N/A'}
        </span>
      )
    },
    {
      header: 'Vendor',
      render: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {row.metadata?.vendor || 'N/A'}
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
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48">
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
                <FiEdit className="w-4 h-4" /> Edit Expense
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Expense
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
            <FiDollarSign className="text-red-500" />
            <span>Expense Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: Rs {stats.total?.toLocaleString() || 0}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors"
        >
          <FiPlus /> Add Expense
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Today</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                Rs {stats.today?.toLocaleString() || 0}
              </p>
            </div>
            <FiCalendar className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">This Month</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                Rs {stats.thisMonth?.toLocaleString() || 0}
              </p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">This Year</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Rs {stats.thisYear?.toLocaleString() || 0}
              </p>
            </div>
            <FiDollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalTransactions || 0}
              </p>
            </div>
            <FiTag className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Payment Methods</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
          
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Start Date"
          />
          
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="End Date"
          />
          
          <input
            type="number"
            value={filters.minAmount}
            onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Min Amount"
          />
          
          <input
            type="number"
            value={filters.maxAmount}
            onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Max Amount"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={expenses} />
      </div>

      {/* Add/Edit Expense Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingExpense(null); 
          resetForm();
        }} 
        title={editingExpense ? "Edit Expense" : "Add New Expense"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Amount (Rs)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 dark:text-white">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
                required
                placeholder="Describe the expense..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Vendor</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Vendor name (optional)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Receipt URL</label>
              <input
                type="url"
                value={formData.receiptUrl}
                onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Receipt URL (optional)"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {editingExpense ? 'Update Expense' : 'Add Expense'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Expense Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Expense Details"
      >
        {viewingExpense && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                <FiDollarSign />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">
                  {(() => {
                    let cleanDescription = viewingExpense.description;
                    if (cleanDescription.includes(' | META:')) {
                      cleanDescription = cleanDescription.split(' | META:')[0];
                    }
                    if (cleanDescription.includes(' - Vendor:')) {
                      cleanDescription = cleanDescription.split(' - Vendor:')[0];
                    }
                    return cleanDescription;
                  })()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">Rs {Number(viewingExpense.amount).toLocaleString()}</p>
                {getCategoryBadge(viewingExpense.category)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Date: {new Date(viewingExpense.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiTag className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Method: {viewingExpense.metadata?.paymentMethod || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="dark:text-white">Vendor: {viewingExpense.metadata?.vendor || 'N/A'}</span>
                </div>
                {viewingExpense.metadata?.receiptUrl && (
                  <div className="flex items-center gap-2">
                    <a 
                      href={viewingExpense.metadata.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default Expenses;
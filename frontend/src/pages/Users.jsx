import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, 
  FiSearch, FiUser, FiPhone, FiMail, FiShield,
  FiShieldOff, FiMoreVertical, FiUsers, FiLock, FiUnlock
} from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'MEMBER', isActive: true
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const params = new URLSearchParams({
        page: pagination.page,
        search: searchTerm,
        role: roleFilter
      });
      const { data } = await axios.get(`/api/users?${params}`);
      console.log('Users response:', data);
      setUsers(data.users || []);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (error) {
      console.error('Fetch users error:', error);
      addAlert('Failed to fetch users', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, formData);
        addAlert('User updated successfully!', 'success');
      } else {
        await axios.post('/api/users', formData);
        addAlert('User created successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save user', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: 'MEMBER', isActive: true });
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      isActive: user.status === 'active'
    });
    setIsModalOpen(true);
  };

  const handleView = async (user) => {
    try {
      const { data } = await axios.get(`/api/users/${user.id}`);
      setViewingUser(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load user details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      addAlert('User deleted successfully!', 'success');
      fetchUsers();
    } catch (error) {
      addAlert('Failed to delete user', 'error');
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await axios.put(`/api/users/${id}/status`, { isActive: currentStatus !== 'active' });
      addAlert(`User ${currentStatus !== 'active' ? 'activated' : 'deactivated'} successfully!`, 'success');
      fetchUsers();
    } catch (error) {
      addAlert('Failed to update user status', 'error');
    }
  };

  const exportUsers = async () => {
    try {
      // This would need to be implemented in backend
      addAlert('Export functionality coming soon!', 'info');
    } catch (error) {
      addAlert('Failed to export users', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
        {status}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      TRAINER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role] || colors.MEMBER}`}>
        {role}
      </span>
    );
  };

  const columns = [
    { 
      header: 'User', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {(row.name || row.email).charAt(0).toUpperCase()}
            </div>
            {row.status === 'active' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
            {row.status === 'inactive' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <FiLock className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name || 'N/A'}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiMail className="w-3 h-3" />
              {row.email}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
              <FiPhone className="w-3 h-3" />
              {row.phone || 'N/A'}
            </div>
          </div>
        </div>
      )
    },
    { header: 'Email', accessor: 'email', render: (row) => (
      <div className="flex items-center gap-2">
        <FiMail className="w-4 h-4 text-gray-400" />
        <span className="dark:text-white">{row.email}</span>
      </div>
    )},
    { header: 'Phone', accessor: 'phone', render: (row) => (
      <div className="flex items-center gap-2">
        <FiPhone className="w-4 h-4 text-gray-400" />
        <span className="dark:text-white">{row.phone || 'N/A'}</span>
      </div>
    )},
    { 
      header: 'Role', 
      render: (row) => getRoleBadge(row.role)
    },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    { 
      header: 'Created', 
      render: (row) => new Date(row.createdAt).toLocaleDateString()
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
                <FiEdit className="w-4 h-4" /> Edit User
              </button>
              {row.status === 'inactive' ? (
                <button
                  onClick={() => { toggleUserStatus(row.id, row.status); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                >
                  <FiUnlock className="w-4 h-4" /> Activate User
                </button>
              ) : (
                <button
                  onClick={() => { toggleUserStatus(row.id, row.status); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
                >
                  <FiLock className="w-4 h-4" /> Deactivate User
                </button>
              )}
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete User
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
            <span>User Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {pagination.total} users
          </p>
        </div>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportUsers}
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
            <FiPlus /> Add User
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="TRAINER">Trainer</option>
              <option value="MEMBER">Member</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable
          columns={columns}
          data={users}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>

      {/* Add/Edit User Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingUser(null); 
          resetForm();
        }} 
        title={editingUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Password {editingUser && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required={!editingUser}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="MEMBER">Member</option>
              <option value="TRAINER">Trainer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-white">Active</label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingUser ? 'Update User' : 'Add User'}
          </button>
        </form>
      </AnimatedModal>

      {/* View User Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="User Details"
      >
        {viewingUser && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(viewingUser.name || viewingUser.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingUser.name || 'N/A'}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingUser.email}</p>
                {getStatusBadge(viewingUser.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingUser.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiShield className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{getRoleBadge(viewingUser.role)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiUser className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Created: {new Date(viewingUser.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default Users;
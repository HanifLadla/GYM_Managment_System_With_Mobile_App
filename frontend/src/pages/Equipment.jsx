import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiTool, FiAlertTriangle,
  FiMoreVertical, FiPackage, FiActivity, FiCalendar, FiDollarSign
} from 'react-icons/fi';

const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [viewingEquipment, setViewingEquipment] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenanceData, setMaintenanceData] = useState({ date: '', description: '', cost: 0 });
  const [formData, setFormData] = useState({ 
    name: '', type: '', quantityAvailable: 0, purchaseDate: '', 
    purchasePrice: 0, condition: 'good', location: '', serialNumber: ''
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchEquipment();
    fetchLowStock();
  }, [searchTerm]);

  const fetchEquipment = async () => {
    try {
      const { data } = await axios.get('/api/equipment');
      const filtered = data.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setEquipment(filtered);
    } catch (error) {
      addAlert('Failed to load equipment', 'error');
    }
  };

  const fetchLowStock = async () => {
    try {
      const { data } = await axios.get('/api/equipment/low-stock?threshold=5');
      setLowStock(data);
      if (data.length > 0) {
        addAlert(`${data.length} items low on stock!`, 'warning', 10000);
      }
    } catch (error) {
      console.error('Failed to load low stock');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        await axios.put(`/api/equipment/${editingEquipment.id}`, formData);
        addAlert('Equipment updated successfully!', 'success');
      } else {
        await axios.post('/api/equipment', formData);
        addAlert('Equipment added successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingEquipment(null);
      fetchEquipment();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save equipment', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', type: '', quantityAvailable: 0, purchaseDate: '', 
      purchasePrice: 0, condition: 'good', location: '', serialNumber: ''
    });
  };

  const handleEdit = (equip) => {
    setEditingEquipment(equip);
    setFormData({
      name: equip.name,
      type: equip.type,
      quantityAvailable: equip.quantityAvailable,
      purchaseDate: equip.purchaseDate ? new Date(equip.purchaseDate).toISOString().split('T')[0] : '',
      purchasePrice: equip.purchasePrice || 0,
      condition: equip.condition || 'good',
      location: equip.location || '',
      serialNumber: equip.serialNumber || ''
    });
    setIsModalOpen(true);
  };

  const handleView = async (equip) => {
    try {
      const { data } = await axios.get(`/api/equipment/${equip.id}`);
      setViewingEquipment(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load equipment details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await axios.delete(`/api/equipment/${id}`);
      addAlert('Equipment deleted successfully!', 'success');
      fetchEquipment();
    } catch (error) {
      addAlert('Failed to delete equipment', 'error');
    }
  };

  const openMaintenanceModal = (equip) => {
    setSelectedEquipment(equip);
    setMaintenanceData({ date: new Date().toISOString().split('T')[0], description: '', cost: 0 });
    setIsMaintenanceModalOpen(true);
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/equipment/${selectedEquipment.id}/maintenance`, maintenanceData);
      addAlert('Maintenance log added successfully!', 'success');
      setIsMaintenanceModalOpen(false);
      fetchEquipment();
    } catch (error) {
      addAlert('Failed to add maintenance log', 'error');
    }
  };

  const getConditionBadge = (condition) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      fair: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      poor: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[condition] || colors.good}`}>
        {condition || 'good'}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Equipment', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiTool className="w-3 h-3" />
              {row.type}
            </div>
          </div>
        </div>
      )
    },
    { 
      header: 'Quantity', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiPackage className="w-4 h-4 text-gray-400" />
          <span className={`font-semibold ${row.quantityAvailable < 5 ? 'text-red-600' : 'text-green-600'} dark:text-blue-400`}>
            {row.quantityAvailable}
          </span>
        </div>
      )
    },
    { 
      header: 'Condition', 
      render: (row) => getConditionBadge(row.condition)
    },
    { 
      header: 'Location', 
      render: (row) => (
        <span className="dark:text-white text-sm">{row.location || 'Not Set'}</span>
      )
    },
    { 
      header: 'Status', 
      render: (row) => row.quantityAvailable < 5 ? (
        <span className="text-red-600 flex items-center gap-1 text-sm font-medium">
          <FiAlertTriangle className="w-4 h-4" /> Low Stock
        </span>
      ) : (
        <span className="text-green-600 flex items-center gap-1 text-sm font-medium">
          <FiActivity className="w-4 h-4" /> Available
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
                <FiEdit className="w-4 h-4" /> Edit Equipment
              </button>
              <button
                onClick={() => { openMaintenanceModal(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600"
              >
                <FiTool className="w-4 h-4" /> Add Maintenance
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Equipment
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
            <FiTool className="text-orange-500" />
            <span>Equipment Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {equipment.length} items
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add Equipment
        </motion.button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <FiAlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{lowStock.length} items are low on stock</span>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment by name or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <DataTable columns={columns} data={equipment} />
      </div>

      {/* Add/Edit Equipment Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingEquipment(null); 
          resetForm();
        }} 
        title={editingEquipment ? "Edit Equipment" : "Add New Equipment"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Equipment Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., Treadmill, Dumbbells"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Type</label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                placeholder="e.g., Cardio, Strength"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Quantity</label>
              <input
                type="number"
                value={formData.quantityAvailable}
                onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Floor 1, Zone A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Serial Number</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Purchase Price (Rs)</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingEquipment ? 'Update Equipment' : 'Add Equipment'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Equipment Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Equipment Details"
      >
        {viewingEquipment && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingEquipment.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingEquipment.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingEquipment.type}</p>
                {getConditionBadge(viewingEquipment.condition)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiPackage className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Quantity: {viewingEquipment.quantityAvailable}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">
                    {viewingEquipment.purchaseDate ? new Date(viewingEquipment.purchaseDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Rs {viewingEquipment.purchasePrice || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="dark:text-white text-sm">{viewingEquipment.location || 'Location not set'}</span>
                </div>
              </div>
            </div>

            {viewingEquipment.serialNumber && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Serial Number</h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-mono">{viewingEquipment.serialNumber}</p>
              </div>
            )}
            
            {viewingEquipment.maintenanceLog && Array.isArray(viewingEquipment.maintenanceLog) && viewingEquipment.maintenanceLog.length > 0 && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Maintenance History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingEquipment.maintenanceLog.map((log, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm dark:text-white">{log.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Rs {log.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* Maintenance Modal */}
      <AnimatedModal 
        isOpen={isMaintenanceModalOpen} 
        onClose={() => setIsMaintenanceModalOpen(false)} 
        title={`Add Maintenance - ${selectedEquipment?.name}`}
      >
        <form onSubmit={handleAddMaintenance} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Date</label>
            <input
              type="date"
              value={maintenanceData.date}
              onChange={(e) => setMaintenanceData({ ...maintenanceData, date: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Description</label>
            <textarea
              value={maintenanceData.description}
              onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
              placeholder="Describe the maintenance work..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Cost (Rs)</label>
            <input
              type="number"
              value={maintenanceData.cost}
              onChange={(e) => setMaintenanceData({ ...maintenanceData, cost: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required
              min="0"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Maintenance Log
          </button>
        </form>
      </AnimatedModal>
    </div>
  );
};

export default Equipment;

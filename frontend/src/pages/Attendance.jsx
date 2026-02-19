import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { 
  FiCheckCircle, FiLogOut, FiEye, FiSearch, FiCalendar, FiClock,
  FiMoreVertical, FiUsers, FiActivity, FiFilter
} from 'react-icons/fi';

const Attendance = () => {
  const [cardId, setCardId] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingAttendance, setViewingAttendance] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchTodayAttendance();
    fetchAllAttendance();
  }, [searchTerm, dateFilter]);

  const fetchTodayAttendance = async () => {
    try {
      const { data } = await axios.get('/api/attendance/today');
      setTodayAttendance(data);
      
      const active = data.filter(a => !a.checkOutTime).length;
      const completed = data.filter(a => a.checkOutTime).length;
      setStats({ total: data.length, active, completed });
    } catch (error) {
      addAlert('Failed to load attendance', 'error');
    }
  };

  const fetchAllAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);
      
      const { data } = await axios.get(`/api/attendance/all?${params}`);
      const filtered = data.filter(a => 
        a.member?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setAllAttendance(filtered);
    } catch (error) {
      addAlert('Failed to load attendance history', 'error');
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`/api/attendance/checkin/${cardId}`);
      
      if (data.gateAccess) {
        addAlert(data.message || 'Check-in successful!', 'success');
      }
      
      setCardId('');
      fetchTodayAttendance();
      fetchAllAttendance();
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData && !errorData.gateAccess) {
        addAlert(errorData.message || errorData.error || 'Check-in failed', 'error', 8000);
      } else {
        addAlert('Check-in failed', 'error');
      }
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await axios.post(`/api/attendance/checkout/${attendanceId}`);
      addAlert('Check-out successful!', 'success');
      fetchTodayAttendance();
      fetchAllAttendance();
    } catch (error) {
      addAlert('Check-out failed', 'error');
    }
  };

  const handleView = async (attendance) => {
    try {
      const { data } = await axios.get(`/api/attendance/${attendance.id}`);
      setViewingAttendance(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load attendance details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    try {
      await axios.delete(`/api/attendance/${id}`);
      addAlert('Attendance record deleted successfully!', 'success');
      fetchTodayAttendance();
      fetchAllAttendance();
    } catch (error) {
      addAlert('Failed to delete attendance record', 'error');
    }
  };

  const getStatusBadge = (row) => {
    if (row.checkOutTime) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Completed</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</span>;
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkOut) return 'Ongoing';
    const duration = new Date(checkOut) - new Date(checkIn);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const columns = [
    { 
      header: 'Member', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {row.member?.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.member?.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{row.cardId}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Check-in', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <FiClock className="w-4 h-4 text-green-500" />
          <span className="dark:text-white">{new Date(row.checkInTime).toLocaleTimeString()}</span>
        </div>
      )
    },
    { 
      header: 'Check-out', 
      render: (row) => row.checkOutTime ? (
        <div className="flex items-center gap-2">
          <FiClock className="w-4 h-4 text-red-500" />
          <span className="dark:text-white">{new Date(row.checkOutTime).toLocaleTimeString()}</span>
        </div>
      ) : (
        <span className="text-gray-400 dark:text-gray-500">-</span>
      )
    },
    { 
      header: 'Duration', 
      render: (row) => (
        <span className="dark:text-white font-medium">{calculateDuration(row.checkInTime, row.checkOutTime)}</span>
      )
    },
    { header: 'Status', render: (row) => getStatusBadge(row) },
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
              {!row.checkOutTime && (
                <button
                  onClick={() => { handleCheckOut(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                >
                  <FiLogOut className="w-4 h-4" /> Check-out
                </button>
              )}
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiLogOut className="w-4 h-4" /> Delete Record
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
            <FiActivity className="text-green-500" />
            <span>Attendance Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Today: {stats.total} members ({stats.active} active)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Today</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Currently Active</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Check-in Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2">
          <FiCheckCircle className="text-green-500" />
          Member Check-in
        </h2>
        <form onSubmit={handleCheckIn} className="flex gap-4">
          <input
            type="text"
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            placeholder="Scan or enter card ID"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
          >
            <FiCheckCircle /> Check-in
          </button>
        </form>
      </motion.div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold dark:text-white">Attendance History</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiFilter /> {showFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>
        
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by member name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Start Date"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="End Date"
              />
            </div>
          </div>
        )}
      </div>

      {/* Today's Attendance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">Today's Attendance</h3>
        </div>
        <DataTable columns={columns} data={todayAttendance} />
      </div>

      {/* View Attendance Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Attendance Details"
      >
        {viewingAttendance && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {viewingAttendance.member?.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingAttendance.member?.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">Card: {viewingAttendance.cardId}</p>
                {getStatusBadge(viewingAttendance)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-in Time</p>
                <p className="font-semibold dark:text-white">{new Date(viewingAttendance.checkInTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Check-out Time</p>
                <p className="font-semibold dark:text-white">
                  {viewingAttendance.checkOutTime ? new Date(viewingAttendance.checkOutTime).toLocaleString() : 'Still Active'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold dark:text-white">{calculateDuration(viewingAttendance.checkInTime, viewingAttendance.checkOutTime)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-semibold dark:text-white">{new Date(viewingAttendance.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default Attendance;

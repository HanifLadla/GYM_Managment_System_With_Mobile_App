import { useState, useEffect } from 'react'; // v2
import { motion } from 'framer-motion';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiEdit, FiTrash2, FiEye, FiUsers, FiCalendar, FiDollarSign,
  FiMoreVertical, FiUserCheck, FiClock, FiTrendingUp, FiFileText, FiDownload
} from 'react-icons/fi';

const HR = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staff, setStaff] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [trainerAttendance, setTrainerAttendance] = useState([]);
  const [attendanceSubTab, setAttendanceSubTab] = useState('staff'); // 'staff' | 'trainer'
  const [leaves, setLeaves] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [stats, setStats] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [modalType, setModalType] = useState('staff'); // staff, attendance, leave, payroll
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formData, setFormData] = useState({});
  const { alerts, addAlert, removeAlert } = useAlert();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiTrendingUp },
    { id: 'staff', label: 'Staff', icon: FiUsers },
    { id: 'trainers', label: 'Trainers', icon: FiUserCheck },
    { id: 'attendance', label: 'Attendance', icon: FiClock },
    { id: 'leaves', label: 'Leaves', icon: FiCalendar },
    { id: 'payroll', label: 'Payroll', icon: FiDollarSign }
  ];

  const departments = ['Management', 'Training', 'Reception', 'Maintenance', 'Security', 'Cleaning'];
  const designations = ['Manager', 'Trainer', 'Receptionist', 'Supervisor', 'Assistant', 'Guard', 'Cleaner'];

  useEffect(() => {
    fetchStats();
    if (activeTab === 'staff') fetchStaff();
    if (activeTab === 'trainers') fetchTrainers();
    if (activeTab === 'attendance') { fetchAttendance(); fetchTrainerAttendance(); }
    if (activeTab === 'leaves') fetchLeaves();
    if (activeTab === 'payroll') fetchPayrolls();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/hr/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats');
    }
  };

  const fetchStaff = async () => {
    try {
      const { data } = await axios.get('/api/hr/staff');
      setStaff(data);
    } catch (error) {
      addAlert('Failed to load staff', 'error');
    }
  };

  const fetchTrainers = async () => {
    try {
      const { data } = await axios.get('/api/hr/trainers');
      setTrainers(data);
    } catch (error) {
      addAlert('Failed to load trainers', 'error');
    }
  };

  const fetchTrainerAttendance = async () => {
    try {
      const { data } = await axios.get('/api/hr/trainer-attendance');
      setTrainerAttendance(data);
    } catch (error) {
      addAlert('Failed to load trainer attendance', 'error');
    }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await axios.get('/api/hr/attendance');
      setAttendance(data);
    } catch (error) {
      addAlert('Failed to load attendance', 'error');
    }
  };

  const fetchLeaves = async () => {
    try {
      const { data } = await axios.get('/api/hr/leaves');
      setLeaves(data);
    } catch (error) {
      addAlert('Failed to load leaves', 'error');
    }
  };

  const fetchPayrolls = async () => {
    try {
      const { data } = await axios.get('/api/hr/payroll');
      setPayrolls(data);
    } catch (error) {
      addAlert('Failed to load payrolls', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoints = {
        staff: '/api/hr/staff',
        attendance: '/api/hr/attendance',
        trainerAttendance: '/api/hr/trainer-attendance',
        leave: '/api/hr/leaves',
        payroll: '/api/hr/payroll'
      };

      let payload = { ...formData };
      if (modalType === 'staff') {
        const { emergencyContactName, emergencyContactPhone, ...rest } = payload;
        payload = {
          ...rest,
          ...(emergencyContactName || emergencyContactPhone
            ? { emergencyContact: JSON.stringify({ name: emergencyContactName, phone: emergencyContactPhone }) }
            : {})
        };
      }

      if (editingItem) {
        await axios.put(`${endpoints[modalType]}/${editingItem.id}`, payload);
        addAlert(`${modalType} updated successfully!`, 'success');
      } else {
        await axios.post(endpoints[modalType], payload);
        addAlert(`${modalType} added successfully!`, 'success');
      }

      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      
      // Refresh data
      if (modalType === 'staff') fetchStaff();
      if (modalType === 'attendance') fetchAttendance();
      if (modalType === 'trainerAttendance') fetchTrainerAttendance();
      if (modalType === 'leave') fetchLeaves();
      if (modalType === 'payroll') fetchPayrolls();
      fetchStats();
    } catch (error) {
      addAlert(error.response?.data?.error || `Failed to save ${modalType}`, 'error');
    }
  };

  const resetForm = () => {
    setFormData({});
  };

  const openModal = async (type, item = null) => {
    setModalType(type);
    setEditingItem(item);

    // Pre-load staff & trainers for dropdowns that need them
    if (['attendance', 'trainerAttendance', 'leave', 'payroll'].includes(type)) {
      const fetches = [];
      if (!staff.length) fetches.push(fetchStaff());
      if (!trainers.length) fetches.push(fetchTrainers());
      if (fetches.length) await Promise.all(fetches);
    }
    
    if (item) {
      if (type === 'staff') {
        const ec = item.emergencyContact ? (typeof item.emergencyContact === 'string' ? JSON.parse(item.emergencyContact) : item.emergencyContact) : {};
        setFormData({
          name: item.name,
          email: item.email,
          phone: item.phone,
          cnic: item.cnic || '',
          address: item.address || '',
          dob: item.dob ? new Date(item.dob).toISOString().split('T')[0] : '',
          gender: item.gender || '',
          joinDate: item.joinDate ? new Date(item.joinDate).toISOString().split('T')[0] : '',
          photo: item.photo || '',
          department: item.department,
          designation: item.designation,
          salary: item.salary,
          commission: item.commission || 0,
          bankAccount: item.bankAccount || '',
          emergencyContactName: ec.name || '',
          emergencyContactPhone: ec.phone || ''
        });
      } else if (type === 'payroll') {
        setFormData({
          staffId: item.staffId || '',
          month: item.month || new Date().getMonth() + 1,
          year: item.year || new Date().getFullYear(),
          allowances: item.allowances || 0,
          deductions: item.deductions || 0,
          overtime: 0,
          bonus: 0
        });
      }
    } else {
      if (type === 'staff') {
        setFormData({
          name: '', email: '', phone: '', cnic: '', address: '', dob: '', gender: '',
          joinDate: '', photo: '',
          department: departments[0], designation: designations[0],
          salary: '', commission: 0, bankAccount: '',
          emergencyContactName: '', emergencyContactPhone: ''
        });
      } else if (type === 'trainerAttendance') {
        setFormData({
          trainerId: item?.trainerId || '',
          date: item?.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          status: item?.status || 'PRESENT',
          checkIn: item?.checkIn ? new Date(item.checkIn).toTimeString().slice(0,5) : '',
          checkOut: item?.checkOut ? new Date(item.checkOut).toTimeString().slice(0,5) : '',
          notes: item?.notes || ''
        });
      } else if (type === 'trainerAttendance') {
        setFormData({
          trainerId: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT',
          checkIn: '', checkOut: '', notes: ''
        });
      } else if (type === 'attendance') {
        setFormData({
          staffId: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT',
          checkIn: '', checkOut: '', notes: ''
        });
      } else if (type === 'leave') {
        setFormData({
          staffId: '', type: 'CASUAL', startDate: '', endDate: '', reason: ''
        });
      } else if (type === 'payroll') {
        setFormData({
          staffId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
          allowances: 0, deductions: 0, overtime: 0, bonus: 0
        });
      }
    }
    
    setIsModalOpen(true);
  };

  const handleView = async (type, item) => {
    if (type === 'staff') {
      try {
        const { data } = await axios.get(`/api/hr/staff/${item.id}/performance`);
        setViewingItem(data);
        setIsViewModalOpen(true);
      } catch (error) {
        addAlert('Failed to load staff details', 'error');
      }
    } else {
      setViewingItem(item);
      setIsViewModalOpen(true);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await axios.delete(`/api/hr/${type}/${id}`);
      addAlert(`${type} deleted successfully!`, 'success');
      
      if (type === 'staff') fetchStaff();
      if (type === 'attendance') fetchAttendance();
      if (type === 'trainerAttendance') fetchTrainerAttendance();
      if (type === 'leave') fetchLeaves();
      if (type === 'payroll') fetchPayrolls();
      fetchStats();
    } catch (error) {
      addAlert(`Failed to delete ${type}`, 'error');
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await axios.put(`/api/hr/leaves/${leaveId}`, { status, approvedBy: 'Admin' });
      addAlert(`Leave ${status.toLowerCase()} successfully!`, 'success');
      fetchLeaves();
      fetchStats();
    } catch (error) {
      addAlert('Failed to update leave status', 'error');
    }
  };

  const handlePayrollPayment = async (payrollId) => {
    try {
      await axios.put(`/api/hr/payroll/${payrollId}`, { status: 'paid' });
      addAlert('Payroll marked as paid!', 'success');
      fetchPayrolls();
      fetchStats();
    } catch (error) {
      addAlert('Failed to update payroll status', 'error');
    }
  };

  const generateAllPayroll = async () => {
    try {
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const { data } = await axios.post('/api/hr/payroll/generate-all', { month, year });
      addAlert(data.message, 'success');
      fetchPayrolls();
      fetchStats();
    } catch (error) {
      addAlert('Failed to generate payroll', 'error');
    }
  };

  const getStatusBadge = (status, type = 'default') => {
    const colors = {
      PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      HALF_DAY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      LATE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status}
      </span>
    );
  };

  const staffColumns = [
    {
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl shadow-lg overflow-hidden flex items-center justify-center text-white font-bold text-lg ${!row.photo ? 'bg-gradient-to-br from-blue-500 to-purple-600' : ''}`}>
            {row.photo
              ? <img src={`${import.meta.env.VITE_API_URL || ''}${row.photo}`} alt={row.name} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              : row.name.charAt(0)
            }
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Salary', render: (row) => `Rs ${Number(row.salary).toLocaleString()}` },
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
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48">
              <button
                onClick={() => { handleView('staff', row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" /> View Performance
              </button>
              <button
                onClick={() => { openModal('staff', row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Edit Staff
              </button>
              <button
                onClick={() => { handleDelete('staff', row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Deactivate
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const trainerColumns = [
    {
      header: 'Trainer',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Specialization', accessor: 'specialization' },
    { header: 'Classes', render: (row) => row.classes || 0 },
    { header: 'Phone', accessor: 'phone' },
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
                onClick={() => { handleView('trainer', row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" /> View Details
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const attendanceColumns = [
    { header: 'Staff', render: (row) => row.staff?.name },
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { header: 'Check In', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'N/A' },
    { header: 'Check Out', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'N/A' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => openModal('attendance', row)}
            className="text-blue-600 hover:text-blue-800 p-1"><FiEdit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete('attendance', row.id)}
            className="text-red-600 hover:text-red-800 p-1"><FiTrash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  const trainerAttendanceColumns = [
    { header: 'Trainer', render: (row) => row.trainer?.name },
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { header: 'Check In', render: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'N/A' },
    { header: 'Check Out', render: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'N/A' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => openModal('trainerAttendance', row)}
            className="text-blue-600 hover:text-blue-800 p-1"><FiEdit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete('trainer-attendance', row.id)}
            className="text-red-600 hover:text-red-800 p-1"><FiTrash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  const leaveColumns = [
    { header: 'Staff', render: (row) => row.staff?.name },
    { header: 'Type', accessor: 'type' },
    { header: 'Start Date', render: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: 'End Date', render: (row) => new Date(row.endDate).toLocaleDateString() },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    {
      header: 'Actions',
      render: (row) => row.status === 'PENDING' ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleLeaveAction(row.id, 'APPROVED')}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => handleLeaveAction(row.id, 'REJECTED')}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      ) : null
    }
  ];

  const payrollColumns = [
    { header: 'Staff', render: (row) => row.staff?.name },
    { header: 'Month/Year', render: (row) => `${row.month}/${row.year}` },
    { header: 'Basic Salary', render: (row) => `Rs ${Number(row.basicSalary).toLocaleString()}` },
    { header: 'Net Salary', render: (row) => `Rs ${Number(row.netSalary).toLocaleString()}` },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    {
      header: 'Actions',
      render: (row) => row.status === 'pending' ? (
        <button
          onClick={() => handlePayrollPayment(row.id)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Mark Paid
        </button>
      ) : null
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
            <span>Human Resources</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage staff, attendance, leaves, and payroll
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition relative whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Total Staff</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalStaff || 0}
                  </p>
                </div>
                <FiUsers className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Trainers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.totalTrainers || 0}
                  </p>
                </div>
                <FiUserCheck className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Today's Attendance</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.todayAttendance || 0}
                  </p>
                </div>
                <FiClock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Leaves</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.pendingLeaves || 0}
                  </p>
                </div>
                <FiCalendar className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Actual Payroll</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    Rs {stats.monthlySalaryExpense?.toLocaleString() || 0}
                  </p>
                </div>
                <FiDollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Estimated Trainers</p>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    Rs {stats.estimatedTrainerSalaries?.toLocaleString() || 0}
                  </p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          {stats.departments && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold dark:text-white mb-4">Department Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.departments.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="dark:text-white">{dept.department}</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{dept._count.department}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold dark:text-white">Staff Management</h2>
            <button
              onClick={() => openModal('staff')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FiPlus /> Add Staff
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <DataTable columns={staffColumns} data={staff} />
          </div>
        </motion.div>
      )}

      {/* Trainers Tab */}
      {activeTab === 'trainers' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold dark:text-white">Trainers Management</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Trainers are managed in the main Trainers section
            </span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <DataTable columns={trainerColumns} data={trainers} />
          </div>
        </motion.div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold dark:text-white">Attendance Management</h2>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setAttendanceSubTab('staff')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                    attendanceSubTab === 'staff'
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Staff
                </button>
                <button
                  onClick={() => setAttendanceSubTab('trainer')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                    attendanceSubTab === 'trainer'
                      ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Trainers
                </button>
              </div>
            </div>
            <button
              onClick={() => openModal(attendanceSubTab === 'staff' ? 'attendance' : 'trainerAttendance')}
              className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 ${
                attendanceSubTab === 'staff' ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              <FiPlus /> Mark Attendance
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {attendanceSubTab === 'staff'
              ? <DataTable columns={attendanceColumns} data={attendance} />
              : <DataTable columns={trainerAttendanceColumns} data={trainerAttendance} />
            }
          </div>
        </motion.div>
      )}

      {/* Leaves Tab */}
      {activeTab === 'leaves' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold dark:text-white">Leave Management</h2>
            <button
              onClick={() => openModal('leave')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-700"
            >
              <FiPlus /> Apply Leave
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <DataTable columns={leaveColumns} data={leaves} />
          </div>
        </motion.div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold dark:text-white">Payroll Management</h2>
            <div className="flex gap-2">
              <button
                onClick={generateAllPayroll}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700"
              >
                <FiFileText /> Generate All
              </button>
              <button
                onClick={() => openModal('payroll')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <FiPlus /> Add Payroll
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <DataTable columns={payrollColumns} data={payrolls} />
          </div>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingItem(null); 
          resetForm();
        }} 
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalType === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Full Name *</label>
                <input type="text" value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Email *</label>
                <input type="email" value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Phone *</label>
                <input type="tel" value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">CNIC</label>
                <input type="text" value={formData.cnic || ''}
                  onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Gender</label>
                <select value={formData.gender || ''}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Date of Birth</label>
                <input type="date" value={formData.dob || ''}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Join Date</label>
                <input type="date" value={formData.joinDate || ''}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Photo</label>
                <div className="flex items-center gap-3">
                  {formData.photo && (
                    <img
                      src={`${import.meta.env.VITE_API_URL || ''}${formData.photo}`}
                      alt="preview"
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('photo', file);
                      try {
                        const { data } = await axios.post('/api/hr/staff/upload-photo', fd);
                        setFormData(prev => ({ ...prev, photo: data.url }));
                      } catch {
                        addAlert('Photo upload failed', 'error');
                      }
                    }}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 dark:text-white">Address</label>
                <input type="text" value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              {/* Job Info */}
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Department *</label>
                <select value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Designation *</label>
                <select value={formData.designation || ''}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                  {designations.map(des => <option key={des} value={des}>{des}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Salary (Rs) *</label>
                <input type="number" value={formData.salary || ''}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" required min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Commission (Rs)</label>
                <input type="number" value={formData.commission || 0}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Bank Account</label>
                <input type="text" value={formData.bankAccount || ''}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  placeholder="Account number"
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Emergency Contact Name</label>
                <input type="text"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Emergency Contact Phone</label>
                <input type="tel"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          )}

          {modalType === 'attendance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Staff</label>
                <select
                  value={formData.staffId || ''}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Date</label>
                <input
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Status</label>
                <select
                  value={formData.status || 'PRESENT'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LATE">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Check In Time</label>
                <input
                  type="time"
                  value={formData.checkIn || ''}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Check Out Time</label>
                <input
                  type="time"
                  value={formData.checkOut || ''}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 dark:text-white">Notes</label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          )}

          {modalType === 'trainerAttendance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Trainer</label>
                <select
                  value={formData.trainerId || ''}
                  onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Trainer</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Date</label>
                <input type="date" value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Status</label>
                <select value={formData.status || 'PRESENT'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LATE">Late</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Check In Time</label>
                <input type="time" value={formData.checkIn || ''}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Check Out Time</label>
                <input type="time" value={formData.checkOut || ''}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 dark:text-white">Notes</label>
                <input type="text" value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
          )}

          {modalType === 'leave' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Staff</label>
                <select
                  value={formData.staffId || ''}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Staff</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Type</label>
                <select
                  value={formData.type || 'CASUAL'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="CASUAL">Casual</option>
                  <option value="SICK">Sick</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">End Date</label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 dark:text-white">Reason</label>
                <textarea
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows="3"
                  required
                />
              </div>
            </div>
          )}

          {modalType === 'payroll' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Staff/Trainer</label>
                <select
                  value={formData.staffId || ''}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Select Staff/Trainer</option>
                  {staff.map(s => (
                    <option key={`staff-${s.id}`} value={s.id}>{s.name} (Staff) - Rs {Number(s.salary).toLocaleString()}</option>
                  ))}
                  {trainers.map(t => (
                    <option key={`trainer-${t.id}`} value={t.id}>{t.name} (Trainer) - Rs 50,000</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Month</label>
                <select
                  value={formData.month || ''}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Year</label>
                <input
                  type="number"
                  value={formData.year || new Date().getFullYear()}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  min="2020"
                  max="2030"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Allowances (Rs)</label>
                <input
                  type="number"
                  value={formData.allowances || 0}
                  onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Deductions (Rs)</label>
                <input
                  type="number"
                  value={formData.deductions || 0}
                  onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Overtime (Rs)</label>
                <input
                  type="number"
                  value={formData.overtime || 0}
                  onChange={(e) => setFormData({ ...formData, overtime: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Bonus (Rs)</label>
                <input
                  type="number"
                  value={formData.bonus || 0}
                  onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                />
              </div>
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingItem ? `Update ${modalType}` : `Add ${modalType}`}
          </button>
        </form>
      </AnimatedModal>

      {/* View Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Staff Performance Report"
      >
        {viewingItem && viewingItem.staff && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold ${!viewingItem.staff.photo ? 'bg-blue-500' : ''}`}>
                {viewingItem.staff.photo
                  ? <img src={`${import.meta.env.VITE_API_URL || ''}${viewingItem.staff.photo}`} alt={viewingItem.staff.name} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  : viewingItem.staff.name.charAt(0)
                }
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingItem.staff.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingItem.staff.department} - {viewingItem.staff.designation}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold dark:text-white mb-2">Attendance Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Present:</span>
                    <span className="text-green-600">{viewingItem.attendanceSummary?.present || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absent:</span>
                    <span className="text-red-600">{viewingItem.attendanceSummary?.absent || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Late:</span>
                    <span className="text-orange-600">{viewingItem.attendanceSummary?.late || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold dark:text-white mb-2">Leave Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{viewingItem.leaveSummary?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved:</span>
                    <span className="text-green-600">{viewingItem.leaveSummary?.approved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending:</span>
                    <span className="text-yellow-600">{viewingItem.leaveSummary?.pending || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold dark:text-white mb-2">Payroll Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Earnings:</span>
                    <span className="text-green-600">Rs {viewingItem.payrollSummary?.totalEarnings?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Salary:</span>
                    <span>Rs {viewingItem.payrollSummary?.averageSalary?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
};

export default HR;
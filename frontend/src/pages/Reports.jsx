import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiTrendingUp, FiUsers, FiDollarSign, FiActivity, FiDownload, 
  FiCalendar, FiRefreshCw, FiBarChart2,
  FiTrendingDown, FiUserCheck, FiClock, FiAward, FiCheckCircle, FiXCircle
} from 'react-icons/fi';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    analytics: null,
    financial: null,
    members: null,
    staff: null,
    trainers: null
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchReports();
  }, [dateRange, period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        period
      };

      const [analytics, financial, members, staff, trainers] = await Promise.all([
        axios.get('/api/reports/analytics', { params }),
        axios.get('/api/reports/financial', { params }),
        axios.get('/api/reports/members', { params }),
        axios.get('/api/reports/staff', { params }),
        axios.get('/api/reports/trainers', { params })
      ]);

      setData({
        analytics: analytics.data,
        financial: financial.data,
        members: members.data,
        staff: staff.data,
        trainers: trainers.data
      });
    } catch (error) {
      addAlert('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type, format = 'csv') => {
    try {
      const params = { ...dateRange, format };
      const response = await axios.get(`/api/reports/export/${type}`, { 
        params,
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_export.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      
      addAlert(`${type} data exported successfully!`, 'success');
    } catch (error) {
      addAlert('Export failed', 'error');
    }
  };

  const formatCurrency = (amount) => `Rs ${Number(amount).toLocaleString()}`;
  const formatPercentage = (value) => `${Number(value).toFixed(1)}%`;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
    { id: 'financial', label: 'Financial', icon: FiDollarSign },
    { id: 'members', label: 'Members', icon: FiUsers },
    { id: 'staff', label: 'Staff', icon: FiUserCheck },
    { id: 'trainers', label: 'Trainers', icon: FiAward }
  ];

  const OverviewTab = () => {
    if (!data.analytics || !data.financial) return <div>Loading...</div>;

    const kpiCards = [
      { 
        title: 'Total Revenue', 
        value: formatCurrency(data.financial.revenue), 
        change: '+12.5%', 
        icon: FiDollarSign, 
        color: 'bg-green-500',
        trend: 'up'
      },
      { 
        title: 'Net Profit', 
        value: formatCurrency(data.financial.netProfit), 
        change: formatPercentage(data.financial.profitMargin), 
        icon: FiTrendingUp, 
        color: 'bg-blue-500',
        trend: data.financial.netProfit > 0 ? 'up' : 'down'
      },
      { 
        title: 'Active Members', 
        value: data.members?.demographics?.reduce((sum, d) => sum + d._count.id, 0) || 0, 
        change: '+8.2%', 
        icon: FiUsers, 
        color: 'bg-purple-500',
        trend: 'up'
      },
      { 
        title: 'Overdue Payments', 
        value: data.financial.overduePayments, 
        change: '-5.1%', 
        icon: FiClock, 
        color: 'bg-red-500',
        trend: 'down'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold dark:text-white mt-1">{card.value}</p>
                  <div className="flex items-center mt-2">
                    {card.trend === 'up' ? 
                      <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" /> : 
                      <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    }
                    <span className={`text-sm font-medium ${
                      card.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.analytics.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="paymentDate" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="_sum.amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Member Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.analytics.memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="joinDate" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="_count.id" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    );
  };

  const FinancialTab = () => {
    if (!data.financial) return <div>Loading...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Revenue vs Expenses</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                <span className="font-semibold text-green-600">{formatCurrency(data.financial.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Expenses</span>
                <span className="font-semibold text-red-600">{formatCurrency(data.financial.expenses)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold dark:text-white">Net Profit</span>
                  <span className={`font-bold ${
                    data.financial.netProfit > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(data.financial.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Profit Margin</span>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(data.financial.profitMargin)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Avg Transaction</span>
                <p className="text-2xl font-bold dark:text-white">{formatCurrency(data.financial.avgTransactionValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Projections</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Projected Revenue</span>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.financial.projectedRevenue)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Overdue Payments</span>
                <p className="text-2xl font-bold text-red-600">{data.financial.overduePayments}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MembersTab = () => {
    if (!data.members) return <div>Loading...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Demographics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.members.demographics}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="_count.id"
                  nameKey="gender"
                >
                  {data.members.demographics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Plan Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.members.planDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="planType" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="_count.id" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Top Active Members</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 dark:text-white">Member</th>
                  <th className="text-left py-2 dark:text-white">Visits</th>
                  <th className="text-left py-2 dark:text-white">Activity Level</th>
                </tr>
              </thead>
              <tbody>
                {data.members.topMembers.map((member, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 dark:text-white">{member.name}</td>
                    <td className="py-2 dark:text-white">{member.visits}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.visits > 20 ? 'bg-green-100 text-green-800' :
                        member.visits > 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.visits > 20 ? 'High' : member.visits > 10 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const TrainersTab = () => {
    if (!data.trainers) return <div>Loading...</div>;
    const { trainers, specializationDist } = data.trainers;

    return (
      <div className="space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Trainers', value: trainers.length, color: 'blue' },
            { label: 'Total Classes', value: trainers.reduce((s, t) => s + t.totalClasses, 0), color: 'green' },
            { label: 'Total Enrollments', value: trainers.reduce((s, t) => s + t.totalEnrollments, 0), color: 'purple' },
            { label: 'Member Check-ins', value: trainers.reduce((s, t) => s + t.memberCheckIns, 0), color: 'orange' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
              <div className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Specialization distribution */}
        {specializationDist.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Specialization Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={specializationDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-trainer table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700">
            <h3 className="font-semibold dark:text-white">Trainer Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Trainer', 'Specialization', 'Classes', 'Enrollments', 'Check-ins', 'Attendance', 'Salary'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {trainers.map((t) => {
                  const attRate = t.attendanceDays > 0 ? Math.round((t.presentDays / t.attendanceDays) * 100) : null;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium dark:text-white">{t.name}</div>
                            <div className="text-xs text-gray-400">{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 dark:text-gray-300">
                          <FiAward className="w-3 h-3 text-yellow-500" />
                          {t.specialization || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 dark:text-white font-semibold">{t.totalClasses}</td>
                      <td className="px-4 py-3 dark:text-white">{t.totalEnrollments}</td>
                      <td className="px-4 py-3 dark:text-white">{t.memberCheckIns}</td>
                      <td className="px-4 py-3">
                        {attRate !== null ? (
                          <span className={`flex items-center gap-1 font-medium ${
                            attRate >= 80 ? 'text-green-600' : attRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attRate >= 80 ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                            {attRate}%
                          </span>
                        ) : <span className="text-gray-400 text-xs">No data</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                        Rs {Number(t.salary).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {trainers.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">No trainers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classes breakdown */}
        {trainers.some(t => t.classes.length > 0) && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="font-semibold dark:text-white mb-4">Classes Breakdown</h3>
            <div className="space-y-4">
              {trainers.filter(t => t.classes.length > 0).map(t => (
                <div key={t.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">{t.name.charAt(0)}</div>
                    <span className="font-medium dark:text-white text-sm">{t.name}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-8">
                    {t.classes.map(c => (
                      <div key={c.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs">
                        <div className="font-medium dark:text-white">{c.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 mt-1">{c.schedule || 'No schedule'}</div>
                        <div className="flex justify-between mt-1">
                          <span className="text-blue-600 dark:text-blue-400">{c.enrolled}/{c.capacity} enrolled</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            c.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                          }`}>{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const StaffTab = () => {
    if (!data.staff) return <div>Loading...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Payroll Summary</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Total Paid</span>
                <p className="text-xl font-bold text-green-600">{formatCurrency(data.staff.payroll.totalPaid)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 text-sm">Average Salary</span>
                <p className="text-xl font-bold dark:text-white">{formatCurrency(data.staff.payroll.avgSalary)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Department Overview</h3>
            <div className="space-y-2">
              {data.staff.departments.map((dept, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{dept.department}</span>
                  <span className="font-semibold dark:text-white">{dept._count.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Leave Summary</h3>
            <div className="space-y-2">
              {data.staff.leaves.map((leave, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{leave.type}</span>
                  <span className="font-semibold dark:text-white">{leave._count.id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-3xl font-bold dark:text-white">Advanced Reports & Analytics</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {/* Period Filter */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <FiDownload />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => exportData('members')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">Export Members</button>
              <button onClick={() => exportData('payments')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">Export Payments</button>
              <button onClick={() => exportData('attendance')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">Export Attendance</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'financial' && <FinancialTab />}
            {activeTab === 'members' && <MembersTab />}
            {activeTab === 'staff' && <StaffTab />}
            {activeTab === 'trainers' && <TrainersTab />}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;

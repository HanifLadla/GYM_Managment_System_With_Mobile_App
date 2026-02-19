import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  FiUsers, FiDollarSign, FiActivity, FiAlertCircle, FiTrendingUp, 
  FiTrendingDown, FiClock, FiUserCheck, FiSettings, FiPackage,
  FiCalendar, FiStar, FiTarget, FiAward, FiRefreshCw
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import StatsCard from '../components/StatsCard';
import ChartContainer from '../components/ChartContainer';
import NotificationWidget from '../components/NotificationWidget';
import WeatherWidget from '../components/WeatherWidget';
import { connectSocket, onAttendanceCheckin, onAlert } from '../utils/socket';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useContext(AuthContext);
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchDashboardData();
    connectSocket();
    
    onAttendanceCheckin((data) => {
      addAlert(`${data.member} checked in`, 'info');
      fetchDashboardData();
    });
    
    onAlert((data) => {
      addAlert(data.message, data.type);
    });

    // Refresh data every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const response = await axios.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      addAlert('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Members', 
      value: stats?.overview.totalMembers || 0, 
      icon: FiUsers, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      trend: '+12%',
      trendUp: true
    },
    { 
      title: 'Monthly Revenue', 
      value: `Rs ${(stats?.overview.thisMonthRevenue || 0).toLocaleString()}`, 
      icon: FiDollarSign, 
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      trend: `${stats?.overview.revenueGrowth > 0 ? '+' : ''}${stats?.overview.revenueGrowth || 0}%`,
      trendUp: stats?.overview.revenueGrowth >= 0
    },
    { 
      title: 'Today Attendance', 
      value: stats?.overview.todayAttendance || 0, 
      icon: FiActivity, 
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      trend: '+8%',
      trendUp: true
    },
    { 
      title: 'Active Staff', 
      value: stats?.overview.totalStaff || 0, 
      icon: FiUserCheck, 
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      trend: 'Stable',
      trendUp: true
    },
    { 
      title: 'Overdue Members', 
      value: stats?.overview.overdueMembers || 0, 
      icon: FiAlertCircle, 
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      trend: '-5%',
      trendUp: false
    },
    { 
      title: 'Equipment Items', 
      value: stats?.overview.totalEquipment || 0, 
      icon: FiPackage, 
      color: 'bg-gradient-to-r from-orange-500 to-orange-600',
      trend: `${stats?.overview.lowStockEquipment || 0} low stock`,
      trendUp: (stats?.overview.lowStockEquipment || 0) === 0
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {user?.email}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <FiClock className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statCards.map((card, idx) => (
          <StatsCard
            key={idx}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
            trendUp={card.trendUp}
            delay={idx * 0.1}
          />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Attendance */}
        <ChartContainer title="Weekly Attendance" icon={FiActivity} delay={0.6}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats?.charts.weeklyAttendance}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="attendance" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#colorAttendance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Monthly Revenue */}
        <ChartContainer title="Revenue Trend" icon={FiDollarSign} delay={0.7}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.charts.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Member Growth */}
        <ChartContainer title="Member Growth" icon={FiTrendingUp} delay={0.8} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.charts.memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="members" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Weather Widget */}
        <div className="space-y-6">
          <WeatherWidget />
          
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
          >
            <h3 className="text-lg font-semibold dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Active Members</span>
                <span className="font-semibold dark:text-white">{stats?.overview.activeMembers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Yearly Revenue</span>
                <span className="font-semibold dark:text-white">Rs {(stats?.overview.thisYearRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pending Payments</span>
                <span className="font-semibold text-red-500">{stats?.overview.pendingPayments || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Notifications */}
        <NotificationWidget notifications={stats?.notifications || []} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Members */}
        <ChartContainer title="Top Members This Month" icon={FiStar} delay={0.9}>
          <div className="space-y-4">
            {stats?.activities.topMembers?.slice(0, 5).map((member, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + idx * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                    idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 
                    idx === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' : 
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <span className="dark:text-white font-medium block">{member.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Member</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                  <FiTarget className="w-4 h-4" />
                  <span className="font-semibold">{member.visits}</span>
                  <span className="text-xs">visits</span>
                </div>
              </motion.div>
            ))}
          </div>
        </ChartContainer>

        {/* Quick Actions */}
        <ChartContainer title="Quick Actions" icon={FiSettings} delay={1.0}>
          <div className="space-y-3">
            {[
              { icon: FiUsers, label: 'Add New Member', color: 'blue', path: '/members' },
              { icon: FiDollarSign, label: 'Record Payment', color: 'green', path: '/payments' },
              { icon: FiPackage, label: 'Manage Equipment', color: 'purple', path: '/equipment' },
              { icon: FiCalendar, label: 'Schedule Class', color: 'orange', path: '/classes' }
            ].map((action, idx) => (
              <motion.button
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 + idx * 0.1 }}
                onClick={() => window.location.href = action.path}
                className={`w-full p-3 bg-${action.color}-50 dark:bg-${action.color}-900/20 text-${action.color}-600 dark:text-${action.color}-400 rounded-lg hover:bg-${action.color}-100 dark:hover:bg-${action.color}-900/30 transition-all duration-200 flex items-center space-x-3 group hover:scale-105`}
              >
                <action.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </ChartContainer>
      </div>

      {/* Recent Activities */}
      <ChartContainer title="Recent Activities" icon={FiActivity} delay={1.1}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Member</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.activities.recent?.slice(0, 8).map((activity, idx) => (
                <motion.tr 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + idx * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {activity.member.charAt(0)}
                      </div>
                      <span className="dark:text-white font-medium">{activity.member}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{activity.action}</td>
                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                    {new Date(activity.time).toLocaleTimeString()}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full text-xs font-medium">
                      Success
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartContainer>
    </div>
  );
};

export default Dashboard;

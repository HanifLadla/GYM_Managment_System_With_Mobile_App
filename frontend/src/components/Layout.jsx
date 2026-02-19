import { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { FiHome, FiUsers, FiActivity, FiDollarSign, FiSettings, FiLogOut, FiBook, FiUserCheck, FiCalendar, FiPackage, FiBarChart2, FiCpu, FiBriefcase, FiCreditCard, FiShield, FiChevronDown, FiChevronRight, FiHeart, FiMoon, FiSun } from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    members: true,
    operations: true,
    finance: false,
    system: false
  });

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuSections = {
    main: [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' }
    ],
    members: {
      title: 'Member Management',
      items: [
        { path: '/members', icon: FiUsers, label: 'Members', roles: ['ADMIN'] },
        { path: '/diet-plans', icon: FiHeart, label: 'Diet Plans', roles: ['ADMIN', 'TRAINER'] },
        { path: '/attendance', icon: FiActivity, label: 'Attendance' },
        { path: '/progress', icon: FiBarChart2, label: 'Progress' }
      ]
    },
    operations: {
      title: 'Operations',
      items: [
        { path: '/trainers', icon: FiUserCheck, label: 'Trainers', roles: ['ADMIN'] },
        { path: '/classes', icon: FiCalendar, label: 'Classes', roles: ['ADMIN'] },
        { path: '/equipment', icon: FiPackage, label: 'Equipment', roles: ['ADMIN'] },
        { path: '/plans', icon: FiCreditCard, label: 'Plans', roles: ['ADMIN'] }
      ]
    },
    finance: {
      title: 'Finance & Reports',
      items: [
        { path: '/payments', icon: FiCreditCard, label: 'Payments' },
        { path: '/expenses', icon: FiDollarSign, label: 'Expenses', roles: ['ADMIN'] },
        { path: '/accounting', icon: FiBook, label: 'Accounting', roles: ['ADMIN'] },
        { path: '/reports', icon: FiBarChart2, label: 'Reports', roles: ['ADMIN'] }
      ]
    },
    system: {
      title: 'System',
      items: [
        { path: '/users', icon: FiShield, label: 'Users', roles: ['ADMIN'] },
        { path: '/hr', icon: FiBriefcase, label: 'HR', roles: ['ADMIN'] },
        { path: '/devices', icon: FiCpu, label: 'Devices', roles: ['ADMIN'] },
        { path: '/settings', icon: FiSettings, label: 'Settings', roles: ['ADMIN'] }
      ]
    }
  };

  const filterItems = (items) => items.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-white dark:bg-gray-800 shadow-lg"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">GMS</h1>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FiSun className="w-5 h-5 text-yellow-500" /> : <FiMoon className="w-5 h-5 text-gray-700" />}
            </button>
          </div>
        </div>
        <nav className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Main Items */}
          {filterItems(menuSections.main).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Collapsible Sections */}
          {Object.entries(menuSections).filter(([key]) => key !== 'main').map(([sectionKey, section]) => {
            const filteredItems = filterItems(section.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={sectionKey} className="mt-4">
                <button
                  onClick={() => toggleSection(sectionKey)}
                  className="flex items-center justify-between w-full px-6 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
                >
                  <span>{section.title}</span>
                  {expandedSections[sectionKey] ? 
                    <FiChevronDown className="w-4 h-4" /> : 
                    <FiChevronRight className="w-4 h-4" />
                  }
                </button>
                
                {expandedSections[sectionKey] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {filteredItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-8 py-2 text-sm transition ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 transition w-full"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </motion.aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

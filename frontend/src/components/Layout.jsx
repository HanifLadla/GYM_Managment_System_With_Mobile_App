import { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import {
  FiHome, FiUsers, FiActivity, FiDollarSign, FiSettings, FiLogOut,
  FiBook, FiUserCheck, FiCalendar, FiPackage, FiBarChart2, FiCpu,
  FiBriefcase, FiCreditCard, FiShield, FiChevronDown, FiChevronRight,
  FiHeart, FiMoon, FiSun, FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(true);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [expandedSections, setExpandedSections] = useState({ members: true, operations: true, finance: false, system: false });
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'light') { setDarkMode(false); document.documentElement.classList.remove('dark'); }
    else { setDarkMode(true); document.documentElement.classList.add('dark'); }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); setDarkMode(false); }
    else { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); setDarkMode(true); }
  };

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next);
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  const menuSections = {
    main: [{ path: '/dashboard', icon: FiHome, label: 'Dashboard' }],
    members: {
      title: 'Members',
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
      title: 'Finance',
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

  const filterItems = (items) => items.filter(item => !item.roles || item.roles.includes(user?.role));

  const NavLink = ({ item, indent = false }) => {
    const isActive = location.pathname === item.path;
    return (
      <div className="relative" onMouseEnter={() => collapsed && setTooltip(item.label)} onMouseLeave={() => setTooltip(null)}>
        <Link
          to={item.path}
          className={`flex items-center gap-3 py-2.5 transition-all ${indent && !collapsed ? 'pl-10 pr-4' : 'px-4'} ${
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <item.icon className={indent && !collapsed ? 'w-4 h-4 flex-shrink-0' : 'w-5 h-5 flex-shrink-0'} />
          {!collapsed && <span className="text-sm truncate">{item.label}</span>}
        </Link>
        {collapsed && tooltip === item.label && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
            {item.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-shrink-0 bg-white dark:bg-gray-800 shadow-lg flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={`flex items-center border-b border-gray-200 dark:border-gray-700 h-16 flex-shrink-0 ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && <h1 className="text-xl font-bold text-blue-600 truncate">GMS</h1>}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'gap-2'}`}>
            <button onClick={toggleDarkMode} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition" title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              {darkMode ? <FiSun className="w-4 h-4 text-yellow-500" /> : <FiMoon className="w-4 h-4 text-gray-700" />}
            </button>
            {!collapsed && (
              <button onClick={toggleCollapsed} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition" title="Collapse sidebar">
                <FiChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button onClick={toggleCollapsed} className="flex justify-center py-2 text-gray-400 hover:text-blue-500 transition" title="Expand sidebar">
            <FiChevronsRight className="w-4 h-4" />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {/* Main */}
          {filterItems(menuSections.main).map(item => <NavLink key={item.path} item={item} />)}

          {/* Sections */}
          {Object.entries(menuSections).filter(([k]) => k !== 'main').map(([sectionKey, section]) => {
            const items = filterItems(section.items);
            if (!items.length) return null;
            return (
              <div key={sectionKey} className="mt-2">
                {!collapsed ? (
                  <>
                    <button
                      onClick={() => toggleSection(sectionKey)}
                      className="flex items-center justify-between w-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    >
                      <span>{section.title}</span>
                      {expandedSections[sectionKey] ? <FiChevronDown className="w-3 h-3" /> : <FiChevronRight className="w-3 h-3" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedSections[sectionKey] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          {items.map(item => <NavLink key={item.path} item={item} indent />)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1 pt-1">
                    {items.map(item => <NavLink key={item.path} item={item} />)}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {!collapsed && (
            <div className="px-4 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{user?.role}</p>
            </div>
          )}
          <div className="relative" onMouseEnter={() => collapsed && setTooltip('logout')} onMouseLeave={() => setTooltip(null)}>
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 py-3 w-full text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-red-600 transition ${collapsed ? 'justify-center px-4' : 'px-4'}`}
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Logout</span>}
            </button>
            {collapsed && tooltip === 'logout' && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
                Logout
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

import { motion } from 'framer-motion';
import { FiBell, FiAlertTriangle, FiInfo, FiCheckCircle } from 'react-icons/fi';

const NotificationWidget = ({ notifications = [] }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'warning': return FiAlertTriangle;
      case 'success': return FiCheckCircle;
      case 'info': return FiInfo;
      default: return FiBell;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'warning': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'success': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'info': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold dark:text-white">Notifications</h3>
        <FiBell className="w-5 h-5 text-gray-500" />
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No new notifications
          </p>
        ) : (
          notifications.map((notification, idx) => {
            const Icon = getIcon(notification.type);
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-3 rounded-lg ${getColor(notification.type)} border-l-4 border-current`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default NotificationWidget;
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

const AlertCard = ({ message, type = 'info', duration = 5000, onClose, icon }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variants = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  const icons = {
    success: <FiCheckCircle className="w-5 h-5" />,
    error: <FiAlertCircle className="w-5 h-5" />,
    warning: <FiAlertTriangle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`${variants[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
    >
      <div className="flex-shrink-0">
        {icon || icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export const AlertContainer = ({ alerts, removeAlert }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            message={alert.message}
            type={alert.type}
            duration={alert.duration}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AlertCard;

import { motion } from 'framer-motion';

const ChartContainer = ({ title, icon: Icon, children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold dark:text-white">{title}</h2>
        {Icon && <Icon className="w-5 h-5 text-blue-500" />}
      </div>
      {children}
    </motion.div>
  );
};

export default ChartContainer;
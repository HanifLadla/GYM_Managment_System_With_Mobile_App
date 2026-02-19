import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setAlerts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  return { alerts, addAlert, removeAlert };
};

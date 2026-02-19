import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { connectSocket, onAttendanceCheckin } from '../utils/socket';
import { FiWifi, FiWifiOff, FiUnlock, FiLock, FiMonitor, FiRefreshCw } from 'react-icons/fi';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [gateEvents, setGateEvents] = useState([]);
  const [testCardId, setTestCardId] = useState('');
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchDevices();
    connectSocket();
    
    // Listen for real-time gate events
    import('../utils/socket').then(({ default: socket }) => {
      socket.on('gate:granted', (data) => {
        addAlert(`✅ Access Granted: ${data.member}`, 'success');
        addGateEvent({ type: 'granted', member: data.member, time: new Date() });
      });
      
      socket.on('gate:denied', (data) => {
        addAlert(`❌ Access Denied: ${data.member} - ${data.reason}`, 'error');
        addGateEvent({ type: 'denied', member: data.member, reason: data.reason, time: new Date() });
      });
    });
  }, []);

  const fetchDevices = async () => {
    try {
      const { data } = await axios.get('/api/devices/devices/status');
      setDevices(data.devices);
    } catch (error) {
      addAlert('Failed to load devices', 'error');
    }
  };

  const addGateEvent = (event) => {
    setGateEvents(prev => [event, ...prev].slice(0, 10));
  };

  const handleManualGateControl = async (action) => {
    try {
      const { data } = await axios.post('/api/devices/gate/control', { action, duration: 5 });
      addAlert(data.message, 'success');
    } catch (error) {
      addAlert('Failed to control gate', 'error');
    }
  };

  const handleTestCardScan = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/devices/webhook/card-scan', {
        cardId: testCardId,
        deviceId: 'WEB-INTERFACE'
      });

      if (data.gateAccess) {
        addAlert(data.message, 'success');
      } else {
        addAlert(data.message, 'error', 8000);
      }
      
      setTestCardId('');
    } catch (error) {
      addAlert('Test scan failed', 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Device Management</h1>
        <button
          onClick={fetchDevices}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device, idx) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {device.status === 'online' ? (
                    <FiWifi className="w-6 h-6 text-white" />
                  ) : (
                    <FiWifiOff className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold dark:text-white">{device.type}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{device.id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {device.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>📍 Location: {device.location}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Manual Gate Control */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2">
          <FiMonitor /> Manual Gate Control
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => handleManualGateControl('open')}
            className="flex-1 bg-green-600 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition"
          >
            <FiUnlock className="w-5 h-5" />
            Open Gate (5s)
          </button>
          <button
            onClick={() => handleManualGateControl('close')}
            className="flex-1 bg-red-600 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition"
          >
            <FiLock className="w-5 h-5" />
            Close Gate
          </button>
        </div>
      </motion.div>

      {/* Test Card Scan */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Test Card Scan</h2>
        <form onSubmit={handleTestCardScan} className="flex gap-4">
          <input
            type="text"
            value={testCardId}
            onChange={(e) => setTestCardId(e.target.value)}
            placeholder="Enter Card ID (e.g., GYM-1708012345-ABC123)"
            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Test Scan
          </button>
        </form>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          💡 Tip: Copy a card ID from Members → Card page to test
        </p>
      </motion.div>

      {/* Real-time Gate Events */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow"
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Real-time Gate Events</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {gateEvents.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No events yet. Scan a card to see real-time updates.
            </p>
          ) : (
            gateEvents.map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-l-4 ${
                  event.type === 'granted'
                    ? 'bg-green-50 border-green-500 dark:bg-green-900/20'
                    : 'bg-red-50 border-red-500 dark:bg-red-900/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold dark:text-white">
                      {event.type === 'granted' ? '✅ Access Granted' : '❌ Access Denied'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Member: {event.member}
                      {event.reason && ` - ${event.reason}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(event.time).toLocaleTimeString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Integration Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          🔌 Device Integration Endpoint
        </h3>
        <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
          POST http://{window.location.hostname}:5001/api/devices/webhook/card-scan
        </code>
        <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
          Configure your RFID/Biometric device to send HTTP POST requests to this endpoint.
          See DEVICE_INTEGRATION.md for detailed setup instructions.
        </p>
      </motion.div>
    </div>
  );
};

export default Devices;

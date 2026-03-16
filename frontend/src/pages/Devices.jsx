import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import AnimatedModal from '../components/AnimatedModal';
import DataTable from '../components/DataTable';
import { connectSocket } from '../utils/socket';
import socket from '../utils/socket';
import {
  FiWifi, FiWifiOff, FiUnlock, FiLock, FiMonitor, FiRefreshCw,
  FiPlus, FiEdit, FiTrash2, FiMoreVertical, FiActivity, FiCpu,
  FiMapPin, FiClock, FiCheckCircle, FiXCircle, FiZap
} from 'react-icons/fi';

const DEVICE_TYPES = ['RFID_READER', 'BIOMETRIC', 'QR_SCANNER', 'GATE_CONTROLLER', 'DISPLAY'];
const STATUS_OPTIONS = ['online', 'offline', 'maintenance'];

const emptyForm = { name: '', type: 'RFID_READER', location: '', ipAddress: '', macAddress: '', status: 'online', notes: '' };

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({ total: 0, online: 0, offline: 0, todayScans: 0, totalScans: 0 });
  const [accessLog, setAccessLog] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [testCardId, setTestCardId] = useState('');
  const [logDate, setLogDate] = useState('');
  const [activeTab, setActiveTab] = useState('devices');
  const { alerts, addAlert, removeAlert } = useAlert();

  const fetchAll = useCallback(async () => {
    try {
      const [devRes, statsRes, logRes] = await Promise.all([
        axios.get('/api/devices'),
        axios.get('/api/devices/stats'),
        axios.get(`/api/devices/access-log?limit=50${logDate ? `&date=${logDate}` : ''}`)
      ]);
      setDevices(devRes.data);
      setStats(statsRes.data);
      setAccessLog(logRes.data);
    } catch {
      addAlert('Failed to load device data', 'error');
    }
  }, [logDate]);

  useEffect(() => {
    fetchAll();
    connectSocket();
    const onGranted = (data) => {
      addAlert(`✅ Access Granted: ${data.member}`, 'success');
      setLiveEvents(prev => [{ type: 'granted', ...data, time: new Date() }, ...prev].slice(0, 20));
    };
    const onDenied = (data) => {
      addAlert(`❌ Access Denied: ${data.member} — ${data.reason}`, 'error');
      setLiveEvents(prev => [{ type: 'denied', ...data, time: new Date() }, ...prev].slice(0, 20));
    };
    socket.on('gate:granted', onGranted);
    socket.on('gate:denied', onDenied);
    return () => { socket.off('gate:granted', onGranted); socket.off('gate:denied', onDenied); };
  }, [fetchAll]);

  // Re-fetch log when date changes
  useEffect(() => {
    if (activeTab === 'log') fetchAll();
  }, [logDate]);

  const openAdd = () => { setEditingDevice(null); setFormData(emptyForm); setIsModalOpen(true); };
  const openEdit = (d) => { setEditingDevice(d); setFormData({ name: d.name, type: d.type, location: d.location, ipAddress: d.ipAddress || '', macAddress: d.macAddress || '', status: d.status, notes: d.notes || '' }); setIsModalOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await axios.put(`/api/devices/${editingDevice.id}`, formData);
        addAlert('Device updated', 'success');
      } else {
        await axios.post('/api/devices', formData);
        addAlert('Device added', 'success');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      addAlert(err.response?.data?.error || 'Failed to save device', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this device?')) return;
    try {
      await axios.delete(`/api/devices/${id}`);
      addAlert('Device deleted', 'success');
      fetchAll();
    } catch {
      addAlert('Failed to delete device', 'error');
    }
  };

  const handleGateControl = async (action) => {
    try {
      const { data } = await axios.post('/api/devices/gate/control', { action, duration: 5 });
      addAlert(data.message, 'success');
    } catch {
      addAlert('Gate control failed', 'error');
    }
  };

  const handleTestScan = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/devices/webhook/card-scan', { cardId: testCardId, deviceId: 'WEB-INTERFACE' });
      addAlert(data.message, data.gateAccess ? 'success' : 'error', 8000);
      setTestCardId('');
      fetchAll();
    } catch {
      addAlert('Test scan failed', 'error');
    }
  };

  const statusBadge = (status) => {
    const map = { online: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', offline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status] || map.offline}`}>{status}</span>;
  };

  const columns = [
    {
      header: 'Device',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${row.status === 'online' ? 'bg-green-500' : row.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}`}>
            {row.status === 'online' ? <FiWifi className="w-4 h-4 text-white" /> : <FiWifiOff className="w-4 h-4 text-white" />}
          </div>
          <div>
            <div className="font-semibold dark:text-white">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><FiCpu className="w-3 h-3" />{row.type}</div>
          </div>
        </div>
      )
    },
    { header: 'Location', render: (row) => <span className="dark:text-white flex items-center gap-1"><FiMapPin className="w-3 h-3 text-gray-400" />{row.location}</span> },
    { header: 'IP Address', render: (row) => <span className="font-mono text-sm dark:text-gray-300">{row.ipAddress || '—'}</span> },
    { header: 'Status', render: (row) => statusBadge(row.status) },
    {
      header: 'Last Seen',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <FiClock className="w-3 h-3" />
          {row.lastSeen ? new Date(row.lastSeen).toLocaleString() : 'Never'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === row.id ? null : row.id); }} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <FiMoreVertical className="w-4 h-4 dark:text-gray-300" />
          </button>
          {dropdownOpen === row.id && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-40" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { openEdit(row); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm dark:text-white">
                <FiEdit className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => { handleDelete(row.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 border-t dark:border-gray-600">
                <FiTrash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const tabs = ['devices', 'log', 'gate', 'scan'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" onClick={() => setDropdownOpen(null)}>
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-2"><FiMonitor className="text-blue-500" /> Device Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{devices.length} devices registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-600 transition">
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
            <FiPlus /> Add Device
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Devices', value: stats.total, icon: FiCpu, color: 'blue' },
          { label: 'Online', value: stats.online, icon: FiWifi, color: 'green' },
          { label: 'Offline', value: stats.offline, icon: FiWifiOff, color: 'red' },
          { label: "Today's Scans", value: stats.todayScans, icon: FiZap, color: 'purple' },
          { label: 'Total Scans', value: stats.totalScans, icon: FiActivity, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
            <div className={`w-10 h-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-2`}>
              <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div className="text-2xl font-bold dark:text-white">{value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow w-fit">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            {tab === 'log' ? 'Access Log' : tab === 'gate' ? 'Gate Control' : tab === 'scan' ? 'Test Scan' : 'Devices'}
          </button>
        ))}
      </div>

      {/* Tab: Devices */}
      {activeTab === 'devices' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <DataTable columns={columns} data={devices} />
        </div>
      )}

      {/* Tab: Access Log */}
      {activeTab === 'log' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold dark:text-white">Access Log</h2>
            <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="divide-y dark:divide-gray-700 max-h-[500px] overflow-y-auto">
            {accessLog.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-12">No access records found.</p>
            ) : accessLog.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    {rec.member?.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-medium dark:text-white text-sm">{rec.member?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Card: {rec.cardId || '—'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 justify-end">
                    <FiClock className="w-3 h-3" />
                    {rec.checkInTime ? new Date(rec.checkInTime).toLocaleString() : new Date(rec.date).toLocaleDateString()}
                  </div>
                  {rec.checkOutTime && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">Out: {new Date(rec.checkOutTime).toLocaleTimeString()}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Gate Control */}
      {activeTab === 'gate' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2"><FiMonitor /> Manual Gate Control</h2>
            <div className="flex gap-4">
              <button onClick={() => handleGateControl('open')} className="flex-1 bg-green-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition font-medium text-lg">
                <FiUnlock className="w-6 h-6" /> Open Gate (5s)
              </button>
              <button onClick={() => handleGateControl('close')} className="flex-1 bg-red-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition font-medium text-lg">
                <FiLock className="w-6 h-6" /> Close Gate
              </button>
            </div>
          </div>

          {/* Live Events */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold dark:text-white mb-4 flex items-center gap-2"><FiActivity /> Live Gate Events</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {liveEvents.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No live events yet. Scan a card to see real-time updates.</p>
              ) : liveEvents.map((ev, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${ev.type === 'granted' ? 'bg-green-50 border-green-500 dark:bg-green-900/20' : 'bg-red-50 border-red-500 dark:bg-red-900/20'}`}>
                  <div className="flex items-center gap-2">
                    {ev.type === 'granted' ? <FiCheckCircle className="w-5 h-5 text-green-600" /> : <FiXCircle className="w-5 h-5 text-red-600" />}
                    <div>
                      <span className="font-medium dark:text-white text-sm">{ev.member}</span>
                      {ev.reason && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">— {ev.reason}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(ev.time).toLocaleTimeString()}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Test Scan */}
      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold dark:text-white mb-2">Test Card Scan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Simulate a card scan to test gate access logic without a physical device.</p>
            <form onSubmit={handleTestScan} className="flex gap-3">
              <input type="text" value={testCardId} onChange={(e) => setTestCardId(e.target.value)} placeholder="Enter Card ID (e.g., GYM-1708012345-ABC123)" className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" required />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">Scan</button>
            </form>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">💡 Copy a card ID from Members → Card page to test.</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">🔌 Device Webhook Endpoint</h3>
            <code className="block bg-white dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto text-gray-800 dark:text-gray-200">
              POST http://{window.location.hostname}:5000/api/devices/webhook/card-scan
            </code>
            <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">Configure your RFID/Biometric device to POST <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{ "cardId": "...", "deviceId": "..." }'}</code> to this endpoint.</p>
          </div>
        </div>
      )}

      {/* Add/Edit Device Modal */}
      <AnimatedModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDevice ? 'Edit Device' : 'Add New Device'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Device Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="e.g., Main Entrance RFID" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
                {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Location *</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" required placeholder="e.g., Main Entrance" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">IP Address</label>
              <input type="text" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="192.168.1.100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-white">MAC Address</label>
              <input type="text" value={formData.macAddress} onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" placeholder="Optional notes..." />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
            {editingDevice ? 'Update Device' : 'Add Device'}
          </button>
        </form>
      </AnimatedModal>
    </div>
  );
};

export default Devices;

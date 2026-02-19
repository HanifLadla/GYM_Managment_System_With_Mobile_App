import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { FiSave, FiMail, FiMessageSquare, FiSettings, FiMessageCircle, FiBell } from 'react-icons/fi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    gymName: '',
    monthlyFeeDefault: 50,
    lateFee: 10,
    workingHours: { open: '06:00', close: '22:00' },
    dueMessageTemplate: '',
    renewalMessageTemplate: '',
    enableSMS: true,
    enableEmail: true,
    enableWhatsApp: false,
    emailHost: 'smtp.gmail.com',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    twilioTestNumber: '',
    whatsappApiUrl: '',
    whatsappApiKey: '',
    whatsappPhoneId: ''
  });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data.id) setSettings(data);
    } catch (error) {
      addAlert('Failed to load settings', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/settings', settings);
      addAlert('Settings updated successfully!', 'success');
    } catch (error) {
      addAlert('Failed to update settings', 'error');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'email', label: 'Email', icon: FiMail },
    { id: 'sms', label: 'SMS', icon: FiMessageSquare },
    { id: 'whatsapp', label: 'WhatsApp', icon: FiMessageCircle },
    { id: 'templates', label: 'Templates', icon: FiMail }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      <div className="flex items-center space-x-3">
        <FiSettings className="text-3xl text-blue-500" />
        <h1 className="text-3xl font-bold dark:text-white">System Settings</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">General Settings</h2>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Gym Name</label>
                <input
                  type="text"
                  value={settings.gymName}
                  onChange={(e) => setSettings({ ...settings, gymName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Default Monthly Fee (Rs)</label>
                  <input
                    type="number"
                    value={settings.monthlyFeeDefault}
                    onChange={(e) => setSettings({ ...settings, monthlyFeeDefault: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Late Fee (Rs)</label>
                  <input
                    type="number"
                    value={settings.lateFee}
                    onChange={(e) => setSettings({ ...settings, lateFee: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Opening Time</label>
                  <input
                    type="time"
                    value={settings.workingHours?.open || '06:00'}
                    onChange={(e) => setSettings({ ...settings, workingHours: { ...settings.workingHours, open: e.target.value } })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">Closing Time</label>
                  <input
                    type="time"
                    value={settings.workingHours?.close || '22:00'}
                    onChange={(e) => setSettings({ ...settings, workingHours: { ...settings.workingHours, close: e.target.value } })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Notification Settings</h2>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium dark:text-white">Enable SMS Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send SMS to members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSMS}
                    onChange={(e) => setSettings({ ...settings, enableSMS: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium dark:text-white">Enable Email Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send emails to members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEmail}
                    onChange={(e) => setSettings({ ...settings, enableEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium dark:text-white">Enable WhatsApp Notifications</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Send WhatsApp messages to members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableWhatsApp}
                    onChange={(e) => setSettings({ ...settings, enableWhatsApp: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </motion.div>
          )}

          {/* Email Configuration Tab */}
          {activeTab === 'email' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Email Configuration (SMTP)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">SMTP Host</label>
                  <input
                    type="text"
                    value={settings.emailHost || ''}
                    onChange={(e) => setSettings({ ...settings, emailHost: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-white">SMTP Port</label>
                  <input
                    type="number"
                    value={settings.emailPort || ''}
                    onChange={(e) => setSettings({ ...settings, emailPort: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Email Address</label>
                <input
                  type="email"
                  value={settings.emailUser || ''}
                  onChange={(e) => setSettings({ ...settings, emailUser: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Email Password / App Password</label>
                <input
                  type="password"
                  value={settings.emailPass || ''}
                  onChange={(e) => setSettings({ ...settings, emailPass: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="App password for Gmail"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  For Gmail: Generate App Password at https://myaccount.google.com/apppasswords
                </p>
              </div>
            </motion.div>
          )}

          {/* SMS Configuration Tab */}
          {activeTab === 'sms' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">SMS Configuration (Twilio)</h2>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Twilio Account SID</label>
                <input
                  type="text"
                  value={settings.twilioAccountSid || ''}
                  onChange={(e) => setSettings({ ...settings, twilioAccountSid: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Twilio Auth Token</label>
                <input
                  type="password"
                  value={settings.twilioAuthToken || ''}
                  onChange={(e) => setSettings({ ...settings, twilioAuthToken: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Twilio Auth Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Twilio Phone Number</label>
                <input
                  type="text"
                  value={settings.twilioPhoneNumber || ''}
                  onChange={(e) => setSettings({ ...settings, twilioPhoneNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="+1234567890"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get Twilio credentials at https://www.twilio.com/console
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <label className="block text-sm font-medium mb-2 text-yellow-800 dark:text-yellow-400">Test Phone Number (Twilio Trial Only)</label>
                <input
                  type="text"
                  value={settings.twilioTestNumber || ''}
                  onChange={(e) => setSettings({ ...settings, twilioTestNumber: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  placeholder="+1234567890"
                />
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  ⚠️ For testing only: Add your verified Twilio number here. SMS will only be sent to this number during trial. Remove before production.
                </p>
              </div>
            </motion.div>
          )}

          {/* WhatsApp Configuration Tab */}
          {activeTab === 'whatsapp' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">WhatsApp Configuration (Business API)</h2>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">WhatsApp API URL</label>
                <input
                  type="text"
                  value={settings.whatsappApiUrl || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappApiUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="https://graph.facebook.com/v17.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">WhatsApp API Key / Access Token</label>
                <input
                  type="password"
                  value={settings.whatsappApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Your WhatsApp Business API Access Token"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  value={settings.whatsappPhoneId || ''}
                  onChange={(e) => setSettings({ ...settings, whatsappPhoneId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get WhatsApp Business API credentials at https://developers.facebook.com/
                </p>
              </div>
            </motion.div>
          )}

          {/* Message Templates Tab */}
          {activeTab === 'templates' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Message Templates</h2>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Due Payment Message Template</label>
                <textarea
                  value={settings.dueMessageTemplate || ''}
                  onChange={(e) => setSettings({ ...settings, dueMessageTemplate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Dear {name}, your gym fees of Rs {amount} are overdue. Please clear your dues to avoid service interruption. - {gymName}"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Available placeholders: {'{name}'}, {'{amount}'}, {'{gymName}'}, {'{phone}'}, {'{email}'}, {'{expiryDate}'}, {'{plan}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">Renewal Reminder Message Template</label>
                <textarea
                  value={settings.renewalMessageTemplate || ''}
                  onChange={(e) => setSettings({ ...settings, renewalMessageTemplate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Dear {name}, your gym membership expires on {expiryDate}. Please renew to continue your fitness journey with us. - {gymName}"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Available placeholders: {'{name}'}, {'{amount}'}, {'{gymName}'}, {'{phone}'}, {'{email}'}, {'{expiryDate}'}, {'{plan}'}
                </p>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 mt-6"
          >
            <FiSave /> Save Settings
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default Settings;

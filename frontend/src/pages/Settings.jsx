import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import {
  FiSave, FiMail, FiMessageSquare, FiSettings, FiMessageCircle, FiBell,
  FiShield, FiCreditCard, FiPercent, FiUsers, FiHome, FiSend, FiRefreshCw,
  FiUpload, FiX, FiImage
} from 'react-icons/fi';
import { BACKEND_URL } from '../config';

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
  </label>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium mb-1 dark:text-white">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ type = 'text', value, onChange, placeholder, className = '' }) => (
  <input
    type={type}
    value={value ?? ''}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 4 }) => (
  <textarea
    value={value ?? ''}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
  />
);

const SectionTitle = ({ children }) => (
  <h2 className="text-lg font-semibold dark:text-white border-b dark:border-gray-700 pb-2 mb-4">{children}</h2>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <div>
      <p className="font-medium dark:text-white">{label}</p>
      {desc && <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
    </div>
    <Toggle checked={!!checked} onChange={onChange} />
  </div>
);

const PLACEHOLDERS = `Available: {name}, {amount}, {gymName}, {phone}, {email}, {expiryDate}, {plan}`;

const DEFAULT = {
  gymName: '', gymAddress: '', gymPhone: '', gymEmail: '', gymWebsite: '', gymTagline: '',
  logoUrl: '', currency: 'PKR', currencySymbol: 'Rs', timezone: 'Asia/Karachi',
  monthlyFeeDefault: 3000, lateFee: 0,
  workingHours: { open: '06:00', close: '22:00' },
  paymentSlipHeader: '', paymentSlipFooter: '', paymentSlipNotes: '',
  showQrOnSlip: true, showLogoOnSlip: true, slipPrimaryColor: '#3b82f6',
  bankName: '', bankAccountTitle: '', bankAccountNumber: '', bankIban: '',
  taxEnabled: false, taxRate: 0, taxLabel: 'GST', taxNumber: '',
  membershipGraceDays: 3, autoRenewMembership: false, membershipReminderDays: 7,
  sessionTimeoutMins: 60, requirePasswordChange: false,
  enableSMS: true, enableEmail: true, enableWhatsApp: false,
  emailHost: 'smtp.gmail.com', emailPort: 587, emailUser: '', emailPass: '',
  twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '', twilioTestNumber: '',
  whatsappApiUrl: '', whatsappApiKey: '', whatsappPhoneId: '',
  dueMessageTemplate: '', renewalMessageTemplate: '', welcomeMessageTemplate: '',
};

const TABS = [
  { id: 'gym',          label: 'Gym Profile',    icon: FiHome },
  { id: 'slip',         label: 'Payment Slip',   icon: FiCreditCard },
  { id: 'tax',          label: 'Tax',            icon: FiPercent },
  { id: 'membership',   label: 'Membership',     icon: FiUsers },
  { id: 'security',     label: 'Security',       icon: FiShield },
  { id: 'notifications',label: 'Notifications',  icon: FiBell },
  { id: 'email',        label: 'Email',          icon: FiMail },
  { id: 'sms',          label: 'SMS',            icon: FiMessageSquare },
  { id: 'whatsapp',     label: 'WhatsApp',       icon: FiMessageCircle },
  { id: 'templates',    label: 'Templates',      icon: FiSend },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('gym');
  const [settings, setSettings] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data.id) {
        setSettings({ ...DEFAULT, ...data, workingHours: data.workingHours || { open: '06:00', close: '22:00' } });
      }
    } catch { addAlert('Failed to load settings', 'error'); }
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
  const setHours = (key, val) => setSettings(prev => ({ ...prev, workingHours: { ...prev.workingHours, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/settings', settings);
      addAlert('Settings saved successfully!', 'success');
    } catch { addAlert('Failed to save settings', 'error'); }
    finally { setSaving(false); }
  };

  const testEmail = async () => {
    setTesting('email');
    try {
      await axios.post('/api/settings/test-email');
      addAlert('Test email sent successfully!', 'success');
    } catch (e) { addAlert(e.response?.data?.error || 'Email test failed', 'error'); }
    finally { setTesting(''); }
  };

  const testSms = async () => {
    setTesting('sms');
    try {
      await axios.post('/api/settings/test-sms');
      addAlert('Test SMS sent successfully!', 'success');
    } catch (e) { addAlert(e.response?.data?.error || 'SMS test failed', 'error'); }
    finally { setTesting(''); }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const { data } = await axios.post('/api/settings/upload-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      set('logoUrl', data.logoUrl);
      addAlert('Logo uploaded successfully!', 'success');
    } catch { addAlert('Failed to upload logo', 'error'); }
    finally { setUploadingLogo(false); }
  };

  const removeLogo = () => {
    set('logoUrl', '');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const logoSrc = settings.logoUrl
    ? (settings.logoUrl.startsWith('http') ? settings.logoUrl : `${BACKEND_URL}${settings.logoUrl}`)
    : null;

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />

      <div className="flex items-center gap-3">
        <FiSettings className="text-3xl text-blue-500" />
        <h1 className="text-3xl font-bold dark:text-white">System Settings</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b dark:border-gray-700 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* ── GYM PROFILE ── */}
          {activeTab === 'gym' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Gym Profile</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Gym Name *">
                  <Input value={settings.gymName} onChange={e => set('gymName', e.target.value)} placeholder="My Gym" />
                </Field>
                <Field label="Tagline">
                  <Input value={settings.gymTagline} onChange={e => set('gymTagline', e.target.value)} placeholder="Your fitness journey starts here" />
                </Field>
                <Field label="Phone">
                  <Input value={settings.gymPhone} onChange={e => set('gymPhone', e.target.value)} placeholder="+92 300 0000000" />
                </Field>
                <Field label="Email">
                  <Input type="email" value={settings.gymEmail} onChange={e => set('gymEmail', e.target.value)} placeholder="info@gym.com" />
                </Field>
                <Field label="Website">
                  <Input value={settings.gymWebsite} onChange={e => set('gymWebsite', e.target.value)} placeholder="https://mygym.com" />
                </Field>
              </div>

              {/* Logo Upload */}
              <Field label="Gym Logo">
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="relative flex-shrink-0">
                    {logoSrc ? (
                      <div className="relative">
                        <img
                          src={logoSrc}
                          alt="Gym Logo"
                          className="w-24 h-24 object-contain rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white p-1"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1">
                        <FiImage className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                        <span className="text-xs text-gray-400">No logo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
                    >
                      {uploadingLogo
                        ? <FiRefreshCw className="w-4 h-4 animate-spin" />
                        : <FiUpload className="w-4 h-4" />}
                      {uploadingLogo ? 'Uploading...' : logoSrc ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, SVG — max 2MB. Recommended: square, min 200×200px</p>
                    {/* Manual URL fallback */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">or paste URL:</span>
                      <input
                        type="text"
                        value={settings.logoUrl ?? ''}
                        onChange={e => set('logoUrl', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 px-3 py-1.5 text-xs border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Currency Code">
                  <Input value={settings.currency} onChange={e => set('currency', e.target.value)} placeholder="PKR" />
                </Field>
                <Field label="Currency Symbol">
                  <Input value={settings.currencySymbol} onChange={e => set('currencySymbol', e.target.value)} placeholder="Rs" />
                </Field>
                <Field label="Timezone">
                  <select value={settings.timezone} onChange={e => set('timezone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  </select>
                </Field>
                <Field label="Opening Time">
                  <Input type="time" value={settings.workingHours?.open} onChange={e => setHours('open', e.target.value)} />
                </Field>
                <Field label="Closing Time">
                  <Input type="time" value={settings.workingHours?.close} onChange={e => setHours('close', e.target.value)} />
                </Field>
                <Field label="Default Monthly Fee (Rs)">
                  <Input type="number" value={settings.monthlyFeeDefault} onChange={e => set('monthlyFeeDefault', e.target.value)} />
                </Field>
                <Field label="Late Fee (Rs)">
                  <Input type="number" value={settings.lateFee} onChange={e => set('lateFee', e.target.value)} />
                </Field>
              </div>
              <Field label="Address">
                <Textarea value={settings.gymAddress} onChange={e => set('gymAddress', e.target.value)} placeholder="Full gym address" rows={2} />
              </Field>
            </motion.div>
          )}

          {/* ── PAYMENT SLIP ── */}
          {activeTab === 'slip' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Payment Slip Customization</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ToggleRow label="Show Logo on Slip" desc="Display gym logo on payment receipts"
                  checked={settings.showLogoOnSlip} onChange={e => set('showLogoOnSlip', e.target.checked)} />
                <ToggleRow label="Show QR Code on Slip" desc="Display QR code on payment receipts"
                  checked={settings.showQrOnSlip} onChange={e => set('showQrOnSlip', e.target.checked)} />
              </div>
              <Field label="Slip Primary Color">
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.slipPrimaryColor || '#3b82f6'}
                    onChange={e => set('slipPrimaryColor', e.target.value)}
                    className="w-12 h-10 rounded border dark:border-gray-600 cursor-pointer" />
                  <Input value={settings.slipPrimaryColor} onChange={e => set('slipPrimaryColor', e.target.value)} placeholder="#3b82f6" />
                </div>
              </Field>
              <Field label="Slip Header">
                <Textarea value={settings.paymentSlipHeader} onChange={e => set('paymentSlipHeader', e.target.value)}
                  placeholder="Header text shown at top of payment slip" rows={2} />
              </Field>
              <Field label="Slip Footer">
                <Textarea value={settings.paymentSlipFooter} onChange={e => set('paymentSlipFooter', e.target.value)}
                  placeholder="Footer text shown at bottom of payment slip" rows={2} />
              </Field>
              <Field label="Slip Notes">
                <Textarea value={settings.paymentSlipNotes} onChange={e => set('paymentSlipNotes', e.target.value)}
                  placeholder="Additional notes on payment slip (e.g. refund policy)" rows={2} />
              </Field>
              <SectionTitle>Bank Details</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Bank Name">
                  <Input value={settings.bankName} onChange={e => set('bankName', e.target.value)} placeholder="HBL / Meezan Bank" />
                </Field>
                <Field label="Account Title">
                  <Input value={settings.bankAccountTitle} onChange={e => set('bankAccountTitle', e.target.value)} placeholder="Gym Name" />
                </Field>
                <Field label="Account Number">
                  <Input value={settings.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} placeholder="0123456789" />
                </Field>
                <Field label="IBAN">
                  <Input value={settings.bankIban} onChange={e => set('bankIban', e.target.value)} placeholder="PK00XXXX0000000000000000" />
                </Field>
              </div>
            </motion.div>
          )}

          {/* ── TAX ── */}
          {activeTab === 'tax' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Tax Configuration</SectionTitle>
              <ToggleRow label="Enable Tax" desc="Apply tax on invoices and payments"
                checked={settings.taxEnabled} onChange={e => set('taxEnabled', e.target.checked)} />
              {settings.taxEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Field label="Tax Label" hint="e.g. GST, VAT, Sales Tax">
                    <Input value={settings.taxLabel} onChange={e => set('taxLabel', e.target.value)} placeholder="GST" />
                  </Field>
                  <Field label="Tax Rate (%)" hint="Percentage applied to invoices">
                    <Input type="number" value={settings.taxRate} onChange={e => set('taxRate', e.target.value)} placeholder="17" />
                  </Field>
                  <Field label="Tax Registration Number" hint="NTN / STRN number for invoices">
                    <Input value={settings.taxNumber} onChange={e => set('taxNumber', e.target.value)} placeholder="1234567-8" />
                  </Field>
                </div>
              )}
              {!settings.taxEnabled && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-500 dark:text-gray-400">
                  Tax is currently disabled. Enable it above to configure tax settings.
                </div>
              )}
            </motion.div>
          )}

          {/* ── MEMBERSHIP ── */}
          {activeTab === 'membership' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Membership Settings</SectionTitle>
              <div className="space-y-3">
                <ToggleRow label="Auto-Renew Membership" desc="Automatically renew memberships on expiry"
                  checked={settings.autoRenewMembership} onChange={e => set('autoRenewMembership', e.target.checked)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Grace Period (Days)" hint="Days after expiry before membership is marked overdue">
                  <Input type="number" value={settings.membershipGraceDays} onChange={e => set('membershipGraceDays', e.target.value)} placeholder="3" />
                </Field>
                <Field label="Renewal Reminder (Days Before)" hint="Send reminder this many days before expiry">
                  <Input type="number" value={settings.membershipReminderDays} onChange={e => set('membershipReminderDays', e.target.value)} placeholder="7" />
                </Field>
              </div>
            </motion.div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Security Settings</SectionTitle>
              <div className="space-y-3">
                <ToggleRow label="Require Password Change on First Login" desc="Force new users to change their password"
                  checked={settings.requirePasswordChange} onChange={e => set('requirePasswordChange', e.target.checked)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Field label="Session Timeout (Minutes)" hint="Auto logout after inactivity">
                  <Input type="number" value={settings.sessionTimeoutMins} onChange={e => set('sessionTimeoutMins', e.target.value)} placeholder="60" />
                </Field>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">🔒 Security Tips</p>
                <ul className="text-sm text-blue-600 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside">
                  <li>Use strong JWT secrets in your backend .env file</li>
                  <li>Enable HTTPS in production</li>
                  <li>Regularly rotate API keys and tokens</li>
                  <li>Keep session timeout short for shared devices</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Notification Channels</SectionTitle>
              <div className="space-y-3">
                <ToggleRow label="Enable Email Notifications" desc="Send emails to members for dues, renewals, welcome"
                  checked={settings.enableEmail} onChange={e => set('enableEmail', e.target.checked)} />
                <ToggleRow label="Enable SMS Notifications" desc="Send SMS via Twilio to members"
                  checked={settings.enableSMS} onChange={e => set('enableSMS', e.target.checked)} />
                <ToggleRow label="Enable WhatsApp Notifications" desc="Send WhatsApp messages via Business API"
                  checked={settings.enableWhatsApp} onChange={e => set('enableWhatsApp', e.target.checked)} />
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ Configure each channel in its respective tab before enabling. Notifications will fail if credentials are missing.
              </div>
            </motion.div>
          )}

          {/* ── EMAIL ── */}
          {activeTab === 'email' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>Email Configuration (SMTP)</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SMTP Host">
                  <Input value={settings.emailHost} onChange={e => set('emailHost', e.target.value)} placeholder="smtp.gmail.com" />
                </Field>
                <Field label="SMTP Port">
                  <Input type="number" value={settings.emailPort} onChange={e => set('emailPort', e.target.value)} placeholder="587" />
                </Field>
                <Field label="Email Address">
                  <Input type="email" value={settings.emailUser} onChange={e => set('emailUser', e.target.value)} placeholder="your@gmail.com" />
                </Field>
                <Field label="App Password" hint="For Gmail: myaccount.google.com/apppasswords">
                  <Input type="password" value={settings.emailPass} onChange={e => set('emailPass', e.target.value)} placeholder="App password" />
                </Field>
              </div>
              <button type="button" onClick={testEmail} disabled={testing === 'email'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                {testing === 'email' ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                {testing === 'email' ? 'Sending...' : 'Send Test Email'}
              </button>
            </motion.div>
          )}

          {/* ── SMS ── */}
          {activeTab === 'sms' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>SMS Configuration (Twilio)</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Account SID">
                  <Input value={settings.twilioAccountSid} onChange={e => set('twilioAccountSid', e.target.value)} placeholder="ACxxxxxxxxxxxxxxxx" />
                </Field>
                <Field label="Auth Token">
                  <Input type="password" value={settings.twilioAuthToken} onChange={e => set('twilioAuthToken', e.target.value)} placeholder="Your auth token" />
                </Field>
                <Field label="Twilio Phone Number" hint="Your Twilio sender number">
                  <Input value={settings.twilioPhoneNumber} onChange={e => set('twilioPhoneNumber', e.target.value)} placeholder="+1234567890" />
                </Field>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Field label="Test Phone Number (Trial Only)" hint="⚠️ Twilio trial: SMS only sent to this verified number. Remove in production.">
                  <Input value={settings.twilioTestNumber} onChange={e => set('twilioTestNumber', e.target.value)} placeholder="+923001234567" />
                </Field>
              </div>
              <button type="button" onClick={testSms} disabled={testing === 'sms'}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition">
                {testing === 'sms' ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                {testing === 'sms' ? 'Sending...' : 'Send Test SMS'}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">Get credentials at twilio.com/console</p>
            </motion.div>
          )}

          {/* ── WHATSAPP ── */}
          {activeTab === 'whatsapp' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <SectionTitle>WhatsApp Configuration (Meta Business API)</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="API URL">
                  <Input value={settings.whatsappApiUrl} onChange={e => set('whatsappApiUrl', e.target.value)} placeholder="https://graph.facebook.com/v17.0" />
                </Field>
                <Field label="Phone Number ID">
                  <Input value={settings.whatsappPhoneId} onChange={e => set('whatsappPhoneId', e.target.value)} placeholder="123456789012345" />
                </Field>
                <Field label="Access Token" hint="Permanent token from Meta Business Manager">
                  <Input type="password" value={settings.whatsappApiKey} onChange={e => set('whatsappApiKey', e.target.value)} placeholder="EAAxxxxxxxx..." />
                </Field>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                📱 Get credentials at <strong>developers.facebook.com</strong> → WhatsApp Business API
              </div>
            </motion.div>
          )}

          {/* ── TEMPLATES ── */}
          {activeTab === 'templates' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <SectionTitle>Message Templates</SectionTitle>
              <Field label="Welcome Message" hint={PLACEHOLDERS}>
                <Textarea value={settings.welcomeMessageTemplate}
                  onChange={e => set('welcomeMessageTemplate', e.target.value)}
                  placeholder="Welcome to {gymName}, {name}! Your membership starts today. We're excited to have you on board." />
              </Field>
              <Field label="Due Payment Reminder" hint={PLACEHOLDERS}>
                <Textarea value={settings.dueMessageTemplate}
                  onChange={e => set('dueMessageTemplate', e.target.value)}
                  placeholder="Dear {name}, your gym fees of Rs {amount} are overdue. Please clear dues to avoid service interruption. - {gymName}" />
              </Field>
              <Field label="Renewal Reminder" hint={PLACEHOLDERS}>
                <Textarea value={settings.renewalMessageTemplate}
                  onChange={e => set('renewalMessageTemplate', e.target.value)}
                  placeholder="Dear {name}, your membership expires on {expiryDate}. Renew now to continue your fitness journey. - {gymName}" />
              </Field>
            </motion.div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t dark:border-gray-700">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
              {saving ? 'Saving...' : 'Save Settings'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;

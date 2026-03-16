import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { 
  FiPlus, FiCreditCard, FiEdit, FiTrash2, FiEye, FiDownload, 
  FiFilter, FiSearch, FiUser, FiPhone, FiMail, FiCalendar,
  FiDollarSign, FiActivity, FiClock, FiMapPin, FiUsers,
  FiLock, FiMessageSquare, FiRefreshCw, FiBarChart, FiFileText,
  FiMoreVertical, FiUnlock, FiGrid, FiList, FiCamera, FiX, FiPrinter
} from 'react-icons/fi';
import PaymentSlip from '../components/PaymentSlip';
import { IoLogoWhatsapp } from 'react-icons/io';

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan',      dial: '92',  flag: '🇵🇰' },
  { code: 'US', name: 'United States', dial: '1',   flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom',dial: '44',  flag: '🇬🇧' },
  { code: 'AE', name: 'UAE',           dial: '971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia',  dial: '966', flag: '🇸🇦' },
  { code: 'IN', name: 'India',         dial: '91',  flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh',    dial: '880', flag: '🇧🇩' },
  { code: 'AF', name: 'Afghanistan',   dial: '93',  flag: '🇦🇫' },
  { code: 'CN', name: 'China',         dial: '86',  flag: '🇨🇳' },
  { code: 'TR', name: 'Turkey',        dial: '90',  flag: '🇹🇷' },
  { code: 'DE', name: 'Germany',       dial: '49',  flag: '🇩🇪' },
  { code: 'FR', name: 'France',        dial: '33',  flag: '🇫🇷' },
  { code: 'CA', name: 'Canada',        dial: '1',   flag: '🇨🇦' },
  { code: 'AU', name: 'Australia',     dial: '61',  flag: '🇦🇺' },
  { code: 'OM', name: 'Oman',          dial: '968', flag: '🇴🇲' },
  { code: 'QA', name: 'Qatar',         dial: '974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait',        dial: '965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain',       dial: '973', flag: '🇧🇭' },
  { code: 'MY', name: 'Malaysia',      dial: '60',  flag: '🇲🇾' },
  { code: 'NG', name: 'Nigeria',       dial: '234', flag: '🇳🇬' },
];

const parseWhatsapp = (value) => {
  if (!value) return { dial: '92', local: '' };
  const digits = value.replace(/[^0-9]/g, '');
  const match = COUNTRIES.find(c => digits.startsWith(c.dial));
  if (match) return { dial: match.dial, local: digits.slice(match.dial.length) };
  return { dial: '92', local: digits };
};

const WhatsAppInput = ({ value, onChange }) => {
  const { dial: initDial, local: initLocal } = parseWhatsapp(value);
  const [dial, setDial] = useState(initDial);
  const [local, setLocal] = useState(initLocal);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const { dial: d, local: l } = parseWhatsapp(value);
    setDial(d); setLocal(l);
  }, [value]);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const emit = useCallback((d, l) => {
    const digits = l.replace(/[^0-9]/g, '');
    onChange(digits ? `${d}${digits}` : '');
  }, [onChange]);

  const selectCountry = (c) => { setDial(c.dial); setSearch(''); setOpen(false); emit(c.dial, local); };
  const handleLocal = (e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setLocal(v); emit(dial, v); };

  const selected = COUNTRIES.find(c => c.dial === dial) || COUNTRIES[0];
  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.dial.includes(search)
  );

  return (
    <div className="flex gap-0 relative" ref={dropRef}>
      {/* Country selector */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="flex items-center gap-1.5 px-3 py-2 border border-r-0 rounded-l-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors min-w-[80px]"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-sm text-gray-600 dark:text-gray-300">+{dial}</span>
        <svg className="w-3 h-3 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-xl">
          <div className="p-2 border-b dark:border-gray-600">
            <input
              autoFocus
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  c.dial === dial ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-gray-400 text-xs">+{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-sm text-gray-400 py-3">No results</p>}
          </div>
        </div>
      )}

      {/* Number input */}
      <input
        type="tel"
        value={local}
        onChange={handleLocal}
        placeholder="3001234567"
        className="flex-1 px-3 py-2 border rounded-r-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
      />
    </div>
  );
};

const Members = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('membersViewMode') || 'list');
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'CASH', notes: '', autoPrintSlip: true });
  const [settings, setSettings] = useState({});
  const [slipPayment, setSlipPayment] = useState(null);
  const [slipAutoPrint, setSlipAutoPrint] = useState(false);
  const [messageType, setMessageType] = useState('due');
  const [reportType, setReportType] = useState('payment');
  const [selectedMember, setSelectedMember] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', planId: 'all' });
  const [formData, setFormData] = useState({
    email: '', password: '', name: '', phone: '', address: '', dob: '',
    gender: '', monthlyFee: 3000, planId: '', planType: 'BASIC', cnic: '', photo: '', whatsapp: '',
    weight: '', bmi: '', bodyFat: '', medicalHistory: '', trainerId: '', status: 'active',
    expiryDate: '', membershipDuration: 1, membershipDiscount: 0
  });
  const [trainers, setTrainers] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { alerts, addAlert, removeAlert } = useAlert();

  const switchViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('membersViewMode', mode);
  };

  useEffect(() => {
    fetchMembers();
    fetchPlans();
    fetchSettings();
    fetchTrainers();
  }, [pagination.page, searchTerm, filters]);

  const fetchTrainers = async () => {
    try {
      const { data } = await axios.get('/api/trainers');
      setTrainers(data);
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get('/api/settings');
      if (data.id) setSettings(data);
    } catch {}
  };

  const fetchPlans = async () => {
    try {
      const { data } = await axios.get('/api/plans');
      setPlans(data);
    } catch (error) {
      addAlert('Failed to load plans', 'error');
    }
  };

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        search: searchTerm,
        ...filters
      });
      const { data } = await axios.get(`/api/members?${params}`);
      setMembers(data.members);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (error) {
      addAlert('Failed to load members', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await axios.put(`/api/members/${editingMember.id}`, formData);
        addAlert('Member updated successfully!', 'success');
      } else {
        await axios.post('/api/members', formData);
        addAlert('Member added successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingMember(null);
      fetchMembers();
      resetForm();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to save member', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '', password: '', name: '', phone: '', address: '', dob: '',
      gender: '', monthlyFee: 3000, planId: '', planType: 'BASIC', cnic: '', photo: '', whatsapp: '',
      weight: '', bmi: '', bodyFat: '', medicalHistory: '', trainerId: '', status: 'active',
      expiryDate: '', membershipDuration: 1, membershipDiscount: 0
    });
    setPhotoPreview(null);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    const membership = member.membership?.[0];
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.user?.email || '',
      password: '',
      address: member.address || '',
      dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
      gender: member.gender || '',
      monthlyFee: member.monthlyFee,
      planId: membership?.planId || '',
      planType: membership?.planType || 'BASIC',
      cnic: member.cnic || '',
      photo: member.photo || '',
      whatsapp: member.whatsapp || '',
      weight: member.weight || '',
      bmi: member.bmi || '',
      bodyFat: member.bodyFat || '',
      medicalHistory: member.medicalHistory || '',
      trainerId: member.trainerId || '',
      status: member.status || 'active',
      expiryDate: member.expiryDate ? new Date(member.expiryDate).toISOString().split('T')[0] : '',
      membershipDuration: member.membership?.[0]?.duration || 1,
      membershipDiscount: member.membership?.[0]?.discount || 0
    });
    setPhotoPreview(member.photo ? `http://localhost:5000${member.photo}` : null);
    setIsModalOpen(true);
  };

  const handleView = async (member) => {
    try {
      const { data } = await axios.get(`/api/members/${member.id}`);
      setViewingMember(data);
      setIsViewModalOpen(true);
    } catch (error) {
      addAlert('Failed to load member details', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`/api/members/${id}`);
      addAlert('Member deleted successfully!', 'success');
      fetchMembers();
    } catch (error) {
      addAlert('Failed to delete member', 'error');
    }
  };

  const handleBlock = async (id) => {
    if (!confirm('Are you sure you want to block this member?')) return;
    try {
      await axios.put(`/api/members/${id}/block`);
      addAlert('Member blocked successfully!', 'success');
      fetchMembers();
    } catch (error) {
      addAlert('Failed to block member', 'error');
    }
  };

  const handleUnblock = async (id) => {
    if (!confirm('Are you sure you want to unblock this member?')) return;
    try {
      await axios.put(`/api/members/${id}`, { status: 'active' });
      addAlert('Member unblocked successfully!', 'success');
      fetchMembers();
    } catch (error) {
      addAlert('Failed to unblock member', 'error');
    }
  };

  const handleSendMessage = async (method) => {
    try {
      const endpoint = messageType === 'due' ? 'send-due' : 'send-renewal';
      await axios.post(`/api/members/${selectedMember.id}/${endpoint}`, { method });
      addAlert(`${messageType} message sent via ${method}!`, 'success');
      setIsMessageModalOpen(false);
    } catch (error) {
      addAlert('Failed to send message', 'error');
    }
  };

  const openMessageModal = (member, type) => {
    setSelectedMember(member);
    setMessageType(type);
    setIsMessageModalOpen(true);
  };

  const openReportModal = async (member, type) => {
    setSelectedMember(member);
    setReportType(type);
    setIsReportModalOpen(true);
    setLoadingReport(true);
    
    try {
      const endpoint = type === 'payment' ? 'payment-report' : 'attendance-report';
      const { data } = await axios.get(`/api/members/${member.id}/${endpoint}`);
      setReportData(data);
    } catch (error) {
      addAlert('Failed to load report', 'error');
    } finally {
      setLoadingReport(false);
    }
  };

  const openPaymentModal = (member) => {
    setSelectedMember(member);
    setPaymentData({ amount: member.monthlyFee, method: 'CASH', notes: '' });
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/payments', {
        memberId: selectedMember.id,
        amount: paymentData.amount,
        method: paymentData.method,
        notes: paymentData.notes
      });
      addAlert('Payment recorded successfully!', 'success');
      setIsPaymentModalOpen(false);
      const shouldPrint = paymentData.autoPrintSlip;
      setPaymentData({ amount: '', method: 'CASH', notes: '', autoPrintSlip: true });
      fetchMembers();
      if (shouldPrint) {
        try {
          const { data: full } = await axios.get(`/api/payments/${data.id}`);
          setSlipAutoPrint(true);
          setSlipPayment(full);
        } catch {}
      }
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to record payment', 'error');
    }
  };

  const handlePrintSlip = async (paymentId) => {
    try {
      const { data } = await axios.get(`/api/payments/${paymentId}`);
      setSlipAutoPrint(false);
      setSlipPayment(data);
    } catch { addAlert('Failed to load payment slip', 'error'); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const { data } = await axios.post('/api/members/upload-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, photo: data.photoUrl }));
      setPhotoPreview(`http://localhost:5000${data.photoUrl}`);
    } catch {
      addAlert('Failed to upload photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const MemberAvatar = ({ member, size = 'md' }) => {
    const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-lg';
    const [imgError, setImgError] = useState(false);
    if (member.photo && !imgError) {
      return (
        <img
          src={`http://localhost:5000${member.photo}`}
          alt={member.name}
          className={`${sizeClass} rounded-xl object-cover shadow-lg`}
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <div className={`${sizeClass} bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
        {member.name.charAt(0)}
      </div>
    );
  };

  const generateCard = async (memberId) => {
    try {
      await axios.post(`/api/members/${memberId}/card`);
      addAlert('Member card generated successfully!', 'success');
    } catch (error) {
      addAlert('Failed to generate card', 'error');
    }
  };

  const exportMembers = async () => {
    try {
      const response = await axios.get('/api/members/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'members.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      addAlert('Members exported successfully!', 'success');
    } catch (error) {
      addAlert('Failed to export members', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.inactive}`}>
        {status}
      </span>
    );
  };

  const getPlanBadge = (planType) => {
    const colors = {
      BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      PREMIUM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[planType] || colors.BASIC}`}>
        {planType}
      </span>
    );
  };

  const columns = [
    { 
      header: 'Member', 
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="relative">
            <MemberAvatar member={row} size="md" />
            {row.status === 'active' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            )}
            {row.status === 'blocked' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <FiLock className="w-2 h-2 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FiMail className="w-3 h-3" />
              {row.user?.email}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
              <FiPhone className="w-3 h-3" />
              {row.phone}
            </div>
          </div>
        </div>
      )
    },
    { header: 'Phone', accessor: 'phone', render: (row) => (
      <div className="flex flex-col gap-1">
        <a href={`tel:${row.phone}`} className="flex items-center gap-2 hover:text-blue-500 transition-colors">
          <FiPhone className="w-4 h-4 text-gray-400" />
          <span className="dark:text-white">{row.phone}</span>
        </a>
        {row.whatsapp && (
          <a
            href={`https://wa.me/${row.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
          >
            <IoLogoWhatsapp className="w-4 h-4" />
            <span className="text-sm">{row.whatsapp}</span>
          </a>
        )}
      </div>
    )},
    { header: 'CNIC', accessor: 'cnic' },
    { 
      header: 'Status', 
      render: (row) => getStatusBadge(row.status)
    },
    { 
      header: 'Plan & Fee', 
      render: (row) => {
        const membership = row.membership?.[0];
        const planName = membership?.plan?.name || membership?.planType || 'No Plan';
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{planName}</div>
            <div className="flex items-center gap-1">
              <FiDollarSign className="w-3 h-3 text-green-500" />
              <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                Rs {Number(row.monthlyFee).toLocaleString()}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Body Metrics',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          {row.weight && <div className="text-gray-600 dark:text-gray-300">Weight: {Number(row.weight)} kg</div>}
          {row.bmi && <div className="text-gray-600 dark:text-gray-300">BMI: {Number(row.bmi).toFixed(1)}</div>}
          {row.bodyFat && <div className="text-gray-600 dark:text-gray-300">Fat: {Number(row.bodyFat)}%</div>}
          {!row.weight && !row.bmi && !row.bodyFat && <span className="text-gray-400">—</span>}
        </div>
      )
    },
    {
      header: 'Trainer',
      render: (row) => row.trainerId
        ? <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{trainers.find(t => t.id === row.trainerId)?.name || '—'}</span>
        : <span className="text-xs text-gray-400">—</span>
    },
    { 
      header: 'Join Date', 
      render: (row) => new Date(row.joinDate).toLocaleDateString()
    },
    { 
      header: 'Expiry', 
      render: (row) => {
        const expiry = new Date(row.expiryDate);
        const isExpired = expiry < new Date();
        return (
          <span className={isExpired ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-400'}>
            {expiry.toLocaleDateString()}
          </span>
        );
      }
    },
    { 
      header: 'Actions', 
      render: (row) => (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(dropdownOpen === row.id ? null : row.id);
            }}
            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>
          {dropdownOpen === row.id && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { handleView(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" /> View Details
              </button>
              <button
                onClick={() => { navigate(`/member-card/${row.id}`); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-blue-600"
              >
                <FiCreditCard className="w-4 h-4" /> View Card
              </button>
              <button
                onClick={() => { handleEdit(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Edit Member
              </button>
              <button
                onClick={() => { generateCard(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiCreditCard className="w-4 h-4" /> Generate Card
              </button>
              <button
                onClick={() => { openPaymentModal(row); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
              >
                <FiDollarSign className="w-4 h-4" /> Add Payment
              </button>
              {row.status === 'blocked' ? (
                <button
                  onClick={() => { handleUnblock(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-green-600"
                >
                  <FiUnlock className="w-4 h-4" /> Unblock Member
                </button>
              ) : (
                <button
                  onClick={() => { handleBlock(row.id); setDropdownOpen(null); }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-orange-600"
                >
                  <FiLock className="w-4 h-4" /> Block Member
                </button>
              )}
              <button
                onClick={() => { openMessageModal(row, 'due'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiMessageSquare className="w-4 h-4" /> Send Due Message
              </button>
              <button
                onClick={() => { openMessageModal(row, 'renewal'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiRefreshCw className="w-4 h-4" /> Send Renewal Message
              </button>
              <button
                onClick={() => { openReportModal(row, 'payment'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiBarChart className="w-4 h-4" /> Payment Report
              </button>
              <button
                onClick={() => { openReportModal(row, 'attendance'); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiFileText className="w-4 h-4" /> Attendance Report
              </button>
              <button
                onClick={() => { handleDelete(row.id); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 border-t dark:border-gray-600"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Member
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" onClick={() => setDropdownOpen(null)}>
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center space-x-2">
            <FiUsers className="text-blue-500" />
            <span>Members Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: {pagination.total} members
          </p>
        </div>
        <div className="flex space-x-3">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => switchViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
              title="List View"
            >
              <FiList className="w-4 h-4" />
            </button>
            <button
              onClick={() => switchViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
              title="Grid View"
            >
              <FiGrid className="w-4 h-4" />
            </button>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportMembers}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FiDownload /> Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Add Member
          </motion.button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <select
              value={filters.planId}
              onChange={(e) => setFilters({ ...filters, planId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — Rs {Number(plan.price).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Members List/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={members}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((member) => {
              const membership = member.membership?.[0];
              const expiry = new Date(member.expiryDate);
              const now = new Date();
              const isExpired = expiry < now;
              const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
              const planName = membership?.plan?.name || membership?.planType || 'No Plan';
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 relative">
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        <MemberAvatar member={member} size="lg" />
                        {member.status === 'active' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                        )}
                        {member.status === 'blocked' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white flex items-center justify-center">
                            <FiLock className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <h3 className="text-white font-bold truncate text-base">{member.name}</h3>
                        <p className="text-blue-100 text-xs truncate">{member.user?.email}</p>
                        <p className="text-blue-200 text-xs mt-0.5">{member.id}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {getStatusBadge(member.status)}
                        </div>
                      </div>
                    </div>
                    {/* Dropdown */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDropdownOpen(dropdownOpen === member.id ? null : member.id); }}
                        className="text-white/80 hover:text-white p-1 rounded"
                      >
                        <FiMoreVertical className="w-4 h-4" />
                      </button>
                      {dropdownOpen === member.id && (
                        <div className="absolute right-0 top-7 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { handleView(member); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiEye className="w-4 h-4" /> View Details</button>
                          <button onClick={() => { navigate(`/member-card/${member.id}`); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-blue-600"><FiCreditCard className="w-4 h-4" /> View Card</button>
                          <button onClick={() => { handleEdit(member); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiEdit className="w-4 h-4" /> Edit Member</button>
                          <button onClick={() => { generateCard(member.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiCreditCard className="w-4 h-4" /> Generate Card</button>
                          <button onClick={() => { openPaymentModal(member); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-green-600"><FiDollarSign className="w-4 h-4" /> Add Payment</button>
                          <button onClick={() => { openMessageModal(member, 'due'); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiMessageSquare className="w-4 h-4" /> Send Due Message</button>
                          <button onClick={() => { openMessageModal(member, 'renewal'); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiRefreshCw className="w-4 h-4" /> Send Renewal</button>
                          <button onClick={() => { openReportModal(member, 'payment'); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiBarChart className="w-4 h-4" /> Payment Report</button>
                          <button onClick={() => { openReportModal(member, 'attendance'); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"><FiFileText className="w-4 h-4" /> Attendance Report</button>
                          {member.status === 'blocked' ? (
                            <button onClick={() => { handleUnblock(member.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-green-600"><FiUnlock className="w-4 h-4" /> Unblock</button>
                          ) : (
                            <button onClick={() => { handleBlock(member.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-orange-600"><FiLock className="w-4 h-4" /> Block</button>
                          )}
                          <button onClick={() => { handleDelete(member.id); setDropdownOpen(null); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 border-t dark:border-gray-600"><FiTrash2 className="w-4 h-4" /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Plan, Fee & Card */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">Plan</div>
                        <div className="text-sm font-semibold text-gray-800 dark:text-white">{planName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 dark:text-gray-500">Monthly Fee</div>
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">Rs {Number(member.monthlyFee).toLocaleString()}</div>
                      </div>
                    </div>
                    {member.card?.[0] && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 -mt-1">
                        <FiCreditCard className="w-3 h-3" />
                        <span className="font-mono font-medium tracking-wide">{member.card[0].cardNumber}</span>
                      </div>
                    )}

                    {/* Divider */}
                    <div className="border-t dark:border-gray-700" />

                    {/* Contact */}
                    <div className="space-y-1.5">
                      <a href={`tel:${member.phone}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors">
                        <FiPhone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                      </a>
                      {member.whatsapp && (
                        <a
                          href={`https://wa.me/${member.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IoLogoWhatsapp className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{member.whatsapp}</span>
                        </a>
                      )}
                      {member.user?.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{member.user.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t dark:border-gray-700" />

                    {/* Personal Info */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      {member.gender && (
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <FiUser className="w-3 h-3" />
                          <span>{member.gender}</span>
                        </div>
                      )}
                      {member.dob && (
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <FiCalendar className="w-3 h-3" />
                          <span>{new Date(member.dob).toLocaleDateString()}</span>
                        </div>
                      )}
                      {member.cnic && (
                        <div className="col-span-2 flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <FiCreditCard className="w-3 h-3" />
                          <span className="font-mono">{member.cnic}</span>
                        </div>
                      )}
                      {member.address && (
                        <div className="col-span-2 flex items-start gap-1.5 text-gray-500 dark:text-gray-400">
                          <FiMapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{member.address}</span>
                        </div>
                      )}
                      {(member.weight || member.bmi || member.bodyFat) && (
                        <div className="col-span-2 border-t dark:border-gray-700 pt-1.5 mt-0.5 flex gap-3">
                          {member.weight && <span className="text-gray-500 dark:text-gray-400">Weight: {Number(member.weight)}kg</span>}
                          {member.bmi && <span className="text-gray-500 dark:text-gray-400">BMI: {Number(member.bmi).toFixed(1)}</span>}
                          {member.bodyFat && <span className="text-gray-500 dark:text-gray-400">Fat: {Number(member.bodyFat)}%</span>}
                        </div>
                      )}
                      {member.trainerId && (
                        <div className="col-span-2 flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <FiUser className="w-3 h-3" />
                          <span>{trainers.find(t => t.id === member.trainerId)?.name || 'Trainer'}</span>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t dark:border-gray-700" />

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-400 dark:text-gray-500">Joined</div>
                        <div className="text-gray-700 dark:text-gray-300 font-medium">{new Date(member.joinDate).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 dark:text-gray-500">Expires</div>
                        <div className={`font-medium ${isExpired ? 'text-red-500' : daysLeft <= 7 ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {expiry.toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Expiry countdown */}
                    <div className={`text-center text-xs font-medium py-1 rounded-lg ${
                      isExpired
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : daysLeft <= 7
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    }`}>
                      {isExpired ? `Expired ${Math.abs(daysLeft)} days ago` : daysLeft === 0 ? 'Expires today' : `${daysLeft} days remaining`}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        onClick={() => handleView(member)}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors text-xs"
                      >
                        <FiEye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-600 dark:text-gray-300 hover:text-yellow-600 transition-colors text-xs"
                      >
                        <FiEdit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => openPaymentModal(member)}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-600 dark:text-gray-300 hover:text-green-600 transition-colors text-xs"
                      >
                        <FiDollarSign className="w-4 h-4" />
                        Pay
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          {/* Grid Pagination */}
          <div className="flex justify-between items-center mt-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages} ({pagination.total} members)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-40 text-sm"
              >
                Prev
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-40 text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <AnimatedModal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingMember(null); 
          resetForm();
        }} 
        title={editingMember ? "Edit Member" : "Add New Member"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          {/* Photo Upload */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border-2 border-blue-300" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <FiUser className="w-8 h-8 text-gray-400" />
                </div>
              )}
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoPreview(null); setFormData(prev => ({ ...prev, photo: '' })); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <FiX className="w-3 h-3" />
                </button>
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50"
              >
                <FiCamera className="w-4 h-4" />
                {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">Max 5MB, JPG/PNG</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiUser className="w-4 h-4" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiMail className="w-4 h-4" />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Password {editingMember && '(leave blank to keep current)'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required={!editingMember}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiPhone className="w-4 h-4" />
                <span>Phone</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center gap-1">
                <IoLogoWhatsapp className="w-4 h-4 text-green-500" />
                <span>WhatsApp Number</span>
              </label>
              <WhatsAppInput
                value={formData.whatsapp}
                onChange={(v) => setFormData(prev => ({ ...prev, whatsapp: v }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">CNIC</label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="12345-1234567-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiCalendar className="w-4 h-4" />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
                <FiDollarSign className="w-4 h-4" />
                <span>Monthly Fee (Rs)</span>
              </label>
              <input
                type="number"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white flex items-center space-x-1">
              <FiMapPin className="w-4 h-4" />
              <span>Address</span>
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
          </div>
          {/* Body Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Weight (kg)</label>
              <input type="number" step="0.1" value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 75.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">BMI</label>
              <input type="number" step="0.1" value={formData.bmi}
                onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 22.4" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">Body Fat (%)</label>
              <input type="number" step="0.1" value={formData.bodyFat}
                onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 18.5" />
            </div>
          </div>
          {/* Assign Trainer */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Assign Trainer (Optional)</label>
            <select value={formData.trainerId}
              onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="">No Trainer</option>
              {trainers.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.specialization || 'General'}</option>
              ))}
            </select>
          </div>
          {/* Medical History */}
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Medical History</label>
            <textarea value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="2" placeholder="Any medical conditions, allergies, injuries..." />
          </div>
            <select
              value={formData.planId}
              onChange={(e) => {
                const selectedPlan = plans.find(p => p.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  planId: e.target.value,
                  monthlyFee: selectedPlan ? selectedPlan.price : formData.monthlyFee
                });
              }}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a plan (optional)</option>
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.type}) - Rs {Number(plan.price).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {editingMember ? 'Update Member' : 'Add Member'}
          </button>
        </form>
      </AnimatedModal>

      {/* View Member Modal */}
      <AnimatedModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title="Member Details"
      >
        {viewingMember && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MemberAvatar member={viewingMember} size="lg" />
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">{viewingMember.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{viewingMember.user?.email}</p>
                {getStatusBadge(viewingMember.status)}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiPhone className="w-4 h-4 text-gray-500" />
                  <a href={`tel:${viewingMember.phone}`} className="dark:text-white hover:text-blue-500 transition-colors">{viewingMember.phone}</a>
                </div>
                {viewingMember.whatsapp && (
                  <div className="flex items-center space-x-2">
                    <IoLogoWhatsapp className="w-4 h-4 text-green-500" />
                    <a
                      href={`https://wa.me/${viewingMember.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                    >
                      {viewingMember.whatsapp}
                    </a>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <FiCalendar className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">
                    {viewingMember.dob ? new Date(viewingMember.dob).toLocaleDateString() : 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiMapPin className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">{viewingMember.address || 'Not provided'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <FiDollarSign className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white font-medium">Rs {Number(viewingMember.monthlyFee).toLocaleString()}/month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiClock className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Joined: {new Date(viewingMember.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiActivity className="w-4 h-4 text-gray-500" />
                  <span className="dark:text-white">Expires: {new Date(viewingMember.expiryDate).toLocaleDateString()}</span>
                </div>
                {viewingMember.trainerId && (
                  <div className="flex items-center space-x-2">
                    <FiUser className="w-4 h-4 text-gray-500" />
                    <span className="dark:text-white">Trainer: {trainers.find(t => t.id === viewingMember.trainerId)?.name || '—'}</span>
                  </div>
                )}
              </div>
            </div>

            {(viewingMember.weight || viewingMember.bmi || viewingMember.bodyFat) && (
              <div className="grid grid-cols-3 gap-3">
                {viewingMember.weight && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{Number(viewingMember.weight)} kg</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Weight</div>
                  </div>
                )}
                {viewingMember.bmi && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{Number(viewingMember.bmi).toFixed(1)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">BMI</div>
                  </div>
                )}
                {viewingMember.bodyFat && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{Number(viewingMember.bodyFat)}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Body Fat</div>
                  </div>
                )}
              </div>
            )}

            {viewingMember.medicalHistory && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Medical History</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{viewingMember.medicalHistory}</p>
              </div>
            )}

            {viewingMember.attendance?.length > 0 && (
              <div>
                <h4 className="font-semibold dark:text-white mb-2">Recent Attendance</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {viewingMember.attendance.slice(0, 5).map((att, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="dark:text-white">{new Date(att.date).toLocaleDateString()}</span>
                      <span className="text-gray-500">{new Date(att.checkInTime).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>

      {/* Message Modal */}
      <AnimatedModal 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)} 
        title={`Send ${messageType === 'due' ? 'Due' : 'Renewal'} Message`}
      >
        <div className="space-y-4">
          <p className="dark:text-white">
            Send {messageType === 'due' ? 'payment due' : 'renewal'} reminder to {selectedMember?.name}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleSendMessage('sms')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FiMessageSquare /> SMS
            </button>
            <button
              onClick={() => handleSendMessage('whatsapp')}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <FiMessageSquare /> WhatsApp
            </button>
            <button
              onClick={() => handleSendMessage('email')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiMail /> Email
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Report Modal */}
      <AnimatedModal 
        isOpen={isReportModalOpen} 
        onClose={() => {
          setIsReportModalOpen(false);
          setReportData(null);
        }} 
        title={`${reportType === 'payment' ? 'Payment' : 'Attendance'} Report - ${selectedMember?.name}`}
      >
        <div className="space-y-4">
          {loadingReport ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading report...</p>
            </div>
          ) : reportData ? (
            <div>
              {reportType === 'payment' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{reportData.count}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">Rs {Number(reportData.totalPaid).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Amount</th>
                          <th className="px-3 py-2 text-left">Method</th>
                          <th className="px-3 py-2 text-left">Slip</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.payments.map((payment, idx) => (
                          <tr key={idx} className="border-b dark:border-gray-600">
                            <td className="px-3 py-2">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-green-600 dark:text-green-400">{settings.currencySymbol || 'Rs'} {Number(payment.amount).toLocaleString()}</td>
                            <td className="px-3 py-2">{payment.method}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => handlePrintSlip(payment.id)}
                                className="text-blue-500 hover:text-blue-700 transition" title="Print Slip">
                                <FiPrinter className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Days</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{reportData.totalDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hours</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{reportData.avgHours}h</p>
                      </div>
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Check In</th>
                          <th className="px-3 py-2 text-left">Check Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.attendance.map((att, idx) => (
                          <tr key={idx} className="border-b dark:border-gray-600">
                            <td className="px-3 py-2">{new Date(att.date).toLocaleDateString()}</td>
                            <td className="px-3 py-2">{new Date(att.checkInTime).toLocaleTimeString()}</td>
                            <td className="px-3 py-2">{att.checkOutTime ? new Date(att.checkOutTime).toLocaleTimeString() : 'Not checked out'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No data available</p>
          )}
        </div>
      </AnimatedModal>

      {/* Payment Modal */}
      <AnimatedModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setPaymentData({ amount: '', method: 'CASH', notes: '', autoPrintSlip: true }); }}
        title={`Record Payment — ${selectedMember?.name}`}
      >
        <form onSubmit={handlePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white flex items-center gap-1">
              <FiDollarSign className="w-4 h-4" /> Amount ({settings.currencySymbol || 'Rs'})
            </label>
            <input type="number" value={paymentData.amount}
              onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              required min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Payment Method</label>
            <select value={paymentData.method}
              onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">Notes (Optional)</label>
            <textarea value={paymentData.notes}
              onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="2" placeholder="Add any notes..." />
          </div>
          {/* Auto-print toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <FiPrinter className="w-4 h-4" /> Auto-Print Slip
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Print receipt after recording payment</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={paymentData.autoPrintSlip}
                onChange={e => setPaymentData({ ...paymentData, autoPrintSlip: e.target.checked })}
                className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <button type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
            <FiDollarSign /> Record Payment
          </button>
        </form>
      </AnimatedModal>

      {/* Payment Slip Modal */}
      {slipPayment && (
        <PaymentSlip
          payment={slipPayment}
          settings={settings}
          autoPrint={slipAutoPrint}
          onClose={() => { setSlipPayment(null); setSlipAutoPrint(false); }}
        />
      )}
    </div>
  );
};

export default Members;

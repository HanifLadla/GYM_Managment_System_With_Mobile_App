import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { FiPlus, FiMoreVertical, FiEye, FiTrash2, FiDownload, FiFilter, FiSearch } from 'react-icons/fi';

const Accounting = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const [transactions, setTransactions] = useState([]);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [members, setMembers] = useState([]);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ memberId: '', amount: '', dueDate: '' });
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    if (activeTab === 'ledger') fetchTransactions();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'invoices') {
      fetchInvoices();
      fetchMembers();
    }
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get('/api/accounting/transactions');
      setTransactions(data.transactions);
    } catch (error) {
      addAlert('Failed to load transactions', 'error');
    }
  };

  const fetchReports = async () => {
    try {
      const [bs, pl] = await Promise.all([
        axios.get('/api/accounting/balance-sheet'),
        axios.get('/api/accounting/profit-loss')
      ]);
      setBalanceSheet(bs.data);
      setProfitLoss(pl.data);
    } catch (error) {
      addAlert('Failed to load reports', 'error');
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data } = await axios.get('/api/accounting/invoices');
      setInvoices(data);
    } catch (error) {
      addAlert('Failed to load invoices', 'error');
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await axios.get('/api/members');
      setMembers(data.members);
    } catch (error) {
      console.error('Failed to load members');
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      // Get income account
      const accountsRes = await axios.get('/api/accounting/accounts');
      const incomeAccount = accountsRes.data.find(a => a.type === 'INCOME');
      
      if (!incomeAccount) {
        addAlert('No income account found', 'error');
        return;
      }

      // Create transaction
      const txn = await axios.post('/api/accounting/transactions', {
        accountId: incomeAccount.id,
        amount: parseFloat(invoiceForm.amount),
        type: 'CREDIT',
        category: 'MEMBER_FEE',
        description: `Invoice for ${members.find(m => m.id === invoiceForm.memberId)?.name}`
      });

      // Create invoice
      await axios.post('/api/accounting/invoices', {
        memberId: invoiceForm.memberId,
        transactionId: txn.data.id,
        totalAmount: parseFloat(invoiceForm.amount),
        dueDate: invoiceForm.dueDate
      });

      addAlert('Invoice generated successfully!', 'success');
      setIsInvoiceModalOpen(false);
      setInvoiceForm({ memberId: '', amount: '', dueDate: '' });
      fetchInvoices();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to generate invoice', 'error');
    }
  };

  const tabs = [
    { id: 'ledger', label: 'Ledger' },
    { id: 'reports', label: 'Reports' },
    { id: 'invoices', label: 'Invoices' }
  ];

  const transactionColumns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Account', render: (row) => row.account?.accountName },
    { header: 'Type', accessor: 'type' },
    { header: 'Category', accessor: 'category' },
    { header: 'Amount', render: (row) => `Rs ${Number(row.amount).toLocaleString()}` },
    { 
      header: 'Description', 
      render: (row) => {
        let cleanDescription = row.description || '';
        if (cleanDescription.includes(' | META:')) {
          cleanDescription = cleanDescription.split(' | META:')[0];
        }
        if (cleanDescription.includes(' - Vendor:')) {
          cleanDescription = cleanDescription.split(' - Vendor:')[0];
        }
        return cleanDescription;
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
            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>
          {dropdownOpen === row.id && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-48" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => { setViewingItem(row); setIsViewModalOpen(true); setDropdownOpen(null); }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FiEye className="w-4 h-4" /> View Details
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen" onClick={() => setDropdownOpen(null)}>
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      <h1 className="text-3xl font-bold dark:text-white">Accounting</h1>

      <div className="flex gap-4 border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition relative ${
              activeTab === tab.id
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
              />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'ledger' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Transactions</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FiFilter /> {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
            {showFilters && (
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <DataTable columns={transactionColumns} data={transactions.filter(t => 
              !searchTerm || t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.account?.accountName?.toLowerCase().includes(searchTerm.toLowerCase())
            )} />
          </div>
        </motion.div>
      )}

      {activeTab === 'reports' && balanceSheet && profitLoss && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Balance Sheet</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Assets', value: balanceSheet.assets },
                    { name: 'Liabilities', value: balanceSheet.liabilities },
                    { name: 'Equity', value: balanceSheet.equity }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Profit & Loss</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Income</span>
                <span className="font-semibold text-green-600">${profitLoss.income}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Expenses</span>
                <span className="font-semibold text-red-600">${profitLoss.expenses}</span>
              </div>
              <div className="flex justify-between pt-4 border-t dark:border-gray-700">
                <span className="font-semibold dark:text-white">Net Profit</span>
                <span className={`font-bold ${profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profitLoss.netProfit}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'invoices' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold dark:text-white">Invoices</h2>
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <FiPlus /> Generate Invoice
            </button>
          </div>
          <DataTable
            columns={[
              { header: 'Invoice #', accessor: 'invoiceNumber' },
              { header: 'Member', render: (row) => row.member?.name || 'N/A' },
              { header: 'Amount', render: (row) => `$${row.totalAmount}` },
              { header: 'Due Date', render: (row) => new Date(row.dueDate).toLocaleDateString() },
              { 
                header: 'Status', 
                render: (row) => (
                  <span className={`px-2 py-1 rounded text-xs ${
                    row.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    row.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {row.status}
                  </span>
                )
              }
            ]}
            data={invoices}
          />
        </motion.div>
      )}

      <AnimatedModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Transaction Details">
        {viewingItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Account</p>
                <p className="font-semibold dark:text-white">{viewingItem.account?.accountName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-semibold dark:text-white">{viewingItem.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">Rs {Number(viewingItem.amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                <p className="font-semibold dark:text-white">{viewingItem.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-semibold dark:text-white">{new Date(viewingItem.date).toLocaleDateString()}</p>
              </div>
            </div>
            {viewingItem.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                <p className="dark:text-white mt-1">
                  {(() => {
                    let cleanDescription = viewingItem.description;
                    if (cleanDescription.includes(' | META:')) {
                      cleanDescription = cleanDescription.split(' | META:')[0];
                    }
                    if (cleanDescription.includes(' - Vendor:')) {
                      cleanDescription = cleanDescription.split(' - Vendor:')[0];
                    }
                    return cleanDescription;
                  })()}
                </p>
              </div>
            )}
          </div>
        )}
      </AnimatedModal>

      <AnimatedModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Generate Invoice">
        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Member</label>
            <select
              value={invoiceForm.memberId}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, memberId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select Member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Amount</label>
            <input
              type="number"
              value={invoiceForm.amount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-white">Due Date</label>
            <input
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Generate Invoice
          </button>
        </form>
      </AnimatedModal>
    </div>
  );
};

export default Accounting;

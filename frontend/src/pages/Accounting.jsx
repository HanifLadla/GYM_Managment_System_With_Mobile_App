import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DataTable from '../components/DataTable';
import AnimatedModal from '../components/AnimatedModal';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiPrinter } from 'react-icons/fi';
import { printDoc, buildAccountsHtml, buildJournalsHtml, buildLedgerHtml, buildReportsHtml } from '../hooks/usePrint';

const TABS = ['Accounts', 'Journal Entries', 'Ledger', 'Reports'];
const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const CATEGORIES = ['MEMBER_FEE', 'SALARY', 'EQUIPMENT', 'UTILITY', 'OTHER'];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const fmt = (n) => `Rs ${Number(n).toLocaleString()}`;
const cleanDesc = (d = '') => d.split(' | META:')[0].split(' - Vendor:')[0];

const inputCls = 'w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm';
const labelCls = 'block text-sm font-medium mb-1 dark:text-white';

export default function Accounting() {
  const [tab, setTab] = useState('Accounts');
  const { alerts, addAlert, removeAlert } = useAlert();

  // ── Accounts ──
  const [accounts, setAccounts] = useState([]);
  const [accountModal, setAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({ accountName: '', type: 'ASSET', description: '' });

  // ── Journal Entries ──
  const [journals, setJournals] = useState([]);
  const [journalModal, setJournalModal] = useState(false);
  const [journalForm, setJournalForm] = useState({ debitAccountId: '', creditAccountId: '', amount: '', description: '', category: 'OTHER', date: '' });

  // ── Ledger ──
  const [transactions, setTransactions] = useState([]);
  const [txnSearch, setTxnSearch] = useState('');
  const [viewModal, setViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // ── Gym info for print header ──
  const [gymInfo, setGymInfo] = useState({});

  // ── Reports ──
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [profitLoss, setProfitLoss] = useState(null);
  const [plYear, setPlYear] = useState(new Date().getFullYear());
  const [plMonth, setPlMonth] = useState('');

  useEffect(() => {
    axios.get('/api/settings').then(({ data }) => setGymInfo(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'Accounts') fetchAccounts();
    if (tab === 'Journal Entries') { fetchAccounts(); fetchJournals(); }
    if (tab === 'Ledger') fetchTransactions();
    if (tab === 'Reports') fetchReports();
  }, [tab]);

  const fetchAccounts = async () => {
    try { const { data } = await axios.get('/api/accounting/accounts'); setAccounts(data); }
    catch { addAlert('Failed to load accounts', 'error'); }
  };

  const fetchJournals = async () => {
    try { const { data } = await axios.get('/api/accounting/journal-entries'); setJournals(data.transactions); }
    catch { addAlert('Failed to load journal entries', 'error'); }
  };

  const fetchTransactions = async () => {
    try { const { data } = await axios.get('/api/accounting/transactions'); setTransactions(data.transactions); }
    catch { addAlert('Failed to load transactions', 'error'); }
  };

  const fetchReports = async () => {
    try {
      const params = { year: plYear, ...(plMonth && { month: plMonth }) };
      const [bs, pl] = await Promise.all([
        axios.get('/api/accounting/balance-sheet'),
        axios.get('/api/accounting/profit-loss', { params })
      ]);
      setBalanceSheet(bs.data);
      setProfitLoss(pl.data);
    } catch { addAlert('Failed to load reports', 'error'); }
  };

  // ── Account CRUD ──
  const openAccountModal = (acc = null) => {
    setEditingAccount(acc);
    setAccountForm(acc ? { accountName: acc.accountName, type: acc.type, description: acc.description || '' } : { accountName: '', type: 'ASSET', description: '' });
    setAccountModal(true);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) await axios.put(`/api/accounting/accounts/${editingAccount.id}`, accountForm);
      else await axios.post('/api/accounting/accounts', accountForm);
      addAlert(`Account ${editingAccount ? 'updated' : 'created'}!`, 'success');
      setAccountModal(false);
      fetchAccounts();
    } catch (err) { addAlert(err.response?.data?.error || 'Failed to save account', 'error'); }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Delete this account?')) return;
    try { await axios.delete(`/api/accounting/accounts/${id}`); addAlert('Account deleted', 'success'); fetchAccounts(); }
    catch (err) { addAlert(err.response?.data?.error || 'Cannot delete account', 'error'); }
  };

  // ── Journal Entry ──
  const handleJournalSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/accounting/journal-entry', { ...journalForm, amount: parseFloat(journalForm.amount) });
      addAlert('Journal entry posted!', 'success');
      setJournalModal(false);
      setJournalForm({ debitAccountId: '', creditAccountId: '', amount: '', description: '', category: 'OTHER', date: '' });
      fetchJournals();
    } catch (err) { addAlert(err.response?.data?.error || 'Failed to post entry', 'error'); }
  };

  // ── Columns ──
  const accountColumns = [
    { header: 'Account Name', accessor: 'accountName' },
    { header: 'Type', render: (r) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      r.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
      r.type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
      r.type === 'EQUITY' ? 'bg-purple-100 text-purple-800' :
      r.type === 'INCOME' ? 'bg-green-100 text-green-800' :
      'bg-orange-100 text-orange-800'}`}>{r.type}</span> },
    { header: 'Balance', render: (r) => fmt(r.balance) },
    { header: 'Transactions', render: (r) => r._count?.transaction ?? 0 },
    { header: 'Description', render: (r) => r.description || '—' },
    { header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button onClick={() => openAccountModal(r)} className="p-1.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100"><FiEdit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDeleteAccount(r.id)} className="p-1.5 rounded bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-100"><FiTrash2 className="w-3.5 h-3.5" /></button>
      </div>
    )}
  ];

  const journalColumns = [
    { header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { header: 'Debit Account', render: (r) => r.debitAccount || '—' },
    { header: 'Credit Account', render: (r) => r.creditAccount || '—' },
    { header: 'Amount', render: (r) => fmt(r.amount) },
    { header: 'Category', accessor: 'category' },
    { header: 'Description', render: (r) => cleanDesc(r.description) },
    { header: 'Source', render: (r) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        r.source === 'Auto' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
      }`}>{r.source}</span>
    )},
  ];

  const ledgerColumns = [
    { header: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { header: 'Account', render: (r) => r.account?.accountName },
    { header: 'Type', render: (r) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.type === 'DEBIT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{r.type}</span> },
    { header: 'Category', accessor: 'category' },
    { header: 'Amount', render: (r) => fmt(r.amount) },
    { header: 'Description', render: (r) => cleanDesc(r.description) },
    { header: '', render: (r) => (
      <button onClick={() => { setViewItem(r); setViewModal(true); }} className="p-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200">
        <FiEye className="w-3.5 h-3.5" />
      </button>
    )}
  ];

  const filteredTxns = transactions.filter(t =>
    !txnSearch ||
    cleanDesc(t.description).toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.account?.accountName?.toLowerCase().includes(txnSearch.toLowerCase()) ||
    t.category?.toLowerCase().includes(txnSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      <h1 className="text-3xl font-bold dark:text-white">Accounting</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b dark:border-gray-700">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 font-medium text-sm transition relative ${tab === t ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
            {t}
            {tab === t && <motion.div layoutId="acTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
          </button>
        ))}
      </div>

      {/* ── ACCOUNTS ── */}
      {tab === 'Accounts' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Chart of Accounts</h2>
            <div className="flex gap-2">
              <button onClick={() => printDoc('Chart of Accounts', buildAccountsHtml(accounts), gymInfo)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                <FiPrinter /> Print
              </button>
              <button onClick={() => openAccountModal()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
                <FiPlus /> New Account
              </button>
            </div>
          </div>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {ACCOUNT_TYPES.map((type, i) => {
              const total = accounts.filter(a => a.type === type).reduce((s, a) => s + parseFloat(a.balance), 0);
              return (
                <div key={type} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{type}</p>
                  <p className="text-lg font-bold dark:text-white mt-1">{fmt(total)}</p>
                </div>
              );
            })}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <DataTable columns={accountColumns} data={accounts} />
          </div>
        </motion.div>
      )}

      {/* ── JOURNAL ENTRIES ── */}
      {tab === 'Journal Entries' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold dark:text-white">Journal Entries</h2>
            <div className="flex gap-2">
              <button onClick={() => printDoc('Journal Entries', buildJournalsHtml(journals ?? []), gymInfo)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                <FiPrinter /> Print
              </button>
              <button onClick={() => setJournalModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
                <FiPlus /> New Entry
              </button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <DataTable columns={journalColumns} data={journals ?? []} />
          </div>
        </motion.div>
      )}

      {/* ── LEDGER ── */}
      {tab === 'Ledger' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex items-center gap-3">
            <input
              type="text"
              placeholder="Search by account, category, description…"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              className={inputCls}
            />
            <button onClick={() => printDoc('General Ledger', buildLedgerHtml(filteredTxns), gymInfo)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm whitespace-nowrap">
              <FiPrinter /> Print
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <DataTable columns={ledgerColumns} data={filteredTxns} />
          </div>
        </motion.div>
      )}

      {/* ── REPORTS ── */}
      {tab === 'Reports' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-wrap gap-3 items-end">
            <div>
              <label className={labelCls}>Year</label>
              <input type="number" value={plYear} onChange={(e) => setPlYear(e.target.value)} className={`${inputCls} w-28`} />
            </div>
            <div>
              <label className={labelCls}>Month (optional)</label>
              <select value={plMonth} onChange={(e) => setPlMonth(e.target.value)} className={`${inputCls} w-36`}>
                <option value="">Full Year</option>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchReports} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">Apply</button>
            {balanceSheet && profitLoss && (
              <button onClick={() => printDoc('Financial Reports', buildReportsHtml(balanceSheet, profitLoss, plYear, plMonth), gymInfo)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                <FiPrinter /> Print
              </button>
            )}
          </div>

          {balanceSheet && profitLoss && (
            <>
              {/* P&L Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Income', value: profitLoss.income, color: 'text-green-600' },
                  { label: 'Total Expenses', value: profitLoss.expenses, color: 'text-red-600' },
                  { label: 'Net Profit', value: profitLoss.netProfit, color: profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`text-2xl font-bold mt-1 ${color}`}>{fmt(value)}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Balance Sheet Pie */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-4 dark:text-white">Balance Sheet</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Assets', value: balanceSheet.totalAssets },
                        { name: 'Liabilities', value: balanceSheet.totalLiabilities },
                        { name: 'Equity', value: balanceSheet.totalEquity },
                      ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {[0, 1, 2].map((i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2 text-sm">
                    {[['Assets', balanceSheet.totalAssets, 'text-blue-600'], ['Liabilities', balanceSheet.totalLiabilities, 'text-purple-600'], ['Equity', balanceSheet.totalEquity, 'text-green-600']].map(([label, val, cls]) => (
                      <div key={label} className="flex justify-between border-b dark:border-gray-700 pb-1">
                        <span className="text-gray-600 dark:text-gray-400">{label}</span>
                        <span className={`font-semibold ${cls}`}>{fmt(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Income vs Expense Bar */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <h3 className="font-semibold mb-4 dark:text-white">Income vs Expenses</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={[
                      ...Object.entries(profitLoss.incomeAccounts || {}).map(([name, value]) => ({ name, value, fill: '#10b981' })),
                      ...Object.entries(profitLoss.expenseAccounts || {}).map(([name, value]) => ({ name, value, fill: '#ef4444' })),
                    ]}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          ...Object.entries(profitLoss.incomeAccounts || {}).map((_, i) => <Cell key={`i${i}`} fill="#10b981" />),
                          ...Object.entries(profitLoss.expenseAccounts || {}).map((_, i) => <Cell key={`e${i}`} fill="#ef4444" />),
                        ]}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Breakdown */}
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-600 mb-1">Income</p>
                      {Object.entries(profitLoss.incomeAccounts || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-gray-600 dark:text-gray-400"><span>{k}</span><span>{fmt(v)}</span></div>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-red-600 mb-1">Expenses</p>
                      {Object.entries(profitLoss.expenseAccounts || {}).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-gray-600 dark:text-gray-400"><span>{k}</span><span>{fmt(v)}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── Account Modal ── */}
      <AnimatedModal isOpen={accountModal} onClose={() => setAccountModal(false)} title={editingAccount ? 'Edit Account' : 'New Account'}>
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Account Name</label>
            <input value={accountForm.accountName} onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })} className={inputCls} required />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} className={inputCls} disabled={!!editingAccount}>
              {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input value={accountForm.description} onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })} className={inputCls} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
            {editingAccount ? 'Update Account' : 'Create Account'}
          </button>
        </form>
      </AnimatedModal>

      {/* ── Journal Entry Modal ── */}
      <AnimatedModal isOpen={journalModal} onClose={() => setJournalModal(false)} title="New Journal Entry">
        <form onSubmit={handleJournalSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Debit Account</label>
              <select value={journalForm.debitAccountId} onChange={(e) => setJournalForm({ ...journalForm, debitAccountId: e.target.value })} className={inputCls} required>
                <option value="">Select…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountName} ({a.type})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Credit Account</label>
              <select value={journalForm.creditAccountId} onChange={(e) => setJournalForm({ ...journalForm, creditAccountId: e.target.value })} className={inputCls} required>
                <option value="">Select…</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountName} ({a.type})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Amount</label>
              <input type="number" min="0.01" step="0.01" value={journalForm.amount} onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={journalForm.date} onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select value={journalForm.category} onChange={(e) => setJournalForm({ ...journalForm, category: e.target.value })} className={inputCls}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input value={journalForm.description} onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })} className={inputCls} />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">Post Entry</button>
        </form>
      </AnimatedModal>

      {/* ── Transaction Detail Modal ── */}
      <AnimatedModal isOpen={viewModal} onClose={() => setViewModal(false)} title="Transaction Details">
        {viewItem && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Account', viewItem.account?.accountName],
              ['Type', viewItem.type],
              ['Category', viewItem.category],
              ['Date', new Date(viewItem.date).toLocaleDateString()],
              ['Amount', fmt(viewItem.amount)],
              ['Description', cleanDesc(viewItem.description)],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-gray-500 dark:text-gray-400">{label}</p>
                <p className="font-semibold dark:text-white mt-0.5">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </AnimatedModal>
    </div>
  );
}

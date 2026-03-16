const fmt = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

export function printDoc(title, bodyHtml, gym = {}) {
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:24px}
  .header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #2563eb;padding-bottom:12px;margin-bottom:20px}
  .header img{height:64px;width:64px;object-fit:contain}
  .header-text h1{font-size:22px;font-weight:700;color:#1e3a8a}
  .header-text p{font-size:12px;color:#555;margin-top:2px}
  h2{font-size:15px;font-weight:700;margin:20px 0 10px;color:#1e3a8a;border-bottom:1px solid #ddd;padding-bottom:4px}
  .cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
  .card{flex:1;min-width:140px;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px}
  .card .label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
  .card .value{font-size:18px;font-weight:700;margin-top:4px}
  .green{color:#16a34a}.red{color:#dc2626}.blue{color:#2563eb}.purple{color:#7c3aed}.orange{color:#ea580c}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#1e3a8a;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
  td{padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px}
  tr:nth-child(even) td{background:#f8fafc}
  .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}
  .badge-blue{background:#dbeafe;color:#1d4ed8}
  .badge-red{background:#fee2e2;color:#b91c1c}
  .badge-green{background:#dcfce7;color:#15803d}
  .badge-purple{background:#ede9fe;color:#6d28d9}
  .badge-orange{background:#ffedd5;color:#c2410c}
  .badge-gray{background:#f3f4f6;color:#374151}
  .bs-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .bs-section h3{font-size:13px;font-weight:700;margin-bottom:8px;padding:6px 10px;border-radius:4px}
  .bs-section .row{display:flex;justify-content:space-between;padding:5px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
  .bs-section .total{display:flex;justify-content:space-between;padding:7px 10px;font-weight:700;font-size:13px;border-top:2px solid #333;margin-top:4px}
  .pl-breakdown{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
  .pl-col h4{font-size:12px;font-weight:700;margin-bottom:6px;padding:4px 8px;border-radius:4px}
  .pl-col .row{display:flex;justify-content:space-between;padding:4px 8px;font-size:12px;border-bottom:1px solid #f0f0f0}
  .footer{margin-top:24px;border-top:1px solid #ddd;padding-top:10px;font-size:11px;color:#888;display:flex;justify-content:space-between}
  @media print{body{padding:12px}.footer{position:fixed;bottom:0;left:0;right:0;padding:8px 24px}}
</style></head><body>
<div class="header">
  ${gym.logoUrl ? `<img src="${gym.logoUrl.startsWith('http') ? gym.logoUrl : window.location.origin + gym.logoUrl}" onerror="this.style.display='none'"/>` : ''}
  <div class="header-text">
    <h1>${gym.gymName || 'Gym Management System'}</h1>
    <p>${[gym.gymAddress, gym.gymPhone, gym.gymEmail].filter(Boolean).join(' &nbsp;|&nbsp; ')}</p>
    <p style="font-weight:600;color:#2563eb;margin-top:4px">${title}</p>
  </div>
</div>
${bodyHtml}
<div class="footer">
  <span>Generated: ${new Date().toLocaleString()}</span>
  <span>${gym.gymName || ''}</span>
</div>
<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);
  w.document.close();
}

export function buildAccountsHtml(accounts) {
  const TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
  const badgeMap = { ASSET: 'badge-blue', LIABILITY: 'badge-red', EQUITY: 'badge-purple', INCOME: 'badge-green', EXPENSE: 'badge-orange' };
  const colorMap = { ASSET: 'blue', LIABILITY: 'red', EQUITY: 'purple', INCOME: 'green', EXPENSE: 'orange' };
  const cards = TYPES.map(t => {
    const total = accounts.filter(a => a.type === t).reduce((s, a) => s + parseFloat(a.balance || 0), 0);
    return `<div class="card"><div class="label">${t}</div><div class="value ${colorMap[t]}">${fmt(total)}</div></div>`;
  }).join('');
  const rows = accounts.map(a =>
    `<tr><td>${a.accountName}</td><td><span class="badge ${badgeMap[a.type]}">${a.type}</span></td><td>${fmt(a.balance)}</td><td>${a._count?.transaction ?? 0}</td><td>${a.description || '—'}</td></tr>`
  ).join('');
  return `<div class="cards">${cards}</div>
<h2>Chart of Accounts</h2>
<table><thead><tr><th>Account Name</th><th>Type</th><th>Balance</th><th>Transactions</th><th>Description</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

export function buildJournalsHtml(journals) {
  const clean = (d = '') => d.split(' | META:')[0].split(' - Vendor:')[0];
  const rows = journals.map(r =>
    `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.debitAccount || '—'}</td><td>${r.creditAccount || '—'}</td><td>${fmt(r.amount)}</td><td>${r.category}</td><td>${clean(r.description)}</td><td><span class="badge ${r.source === 'Auto' ? 'badge-blue' : 'badge-gray'}">${r.source}</span></td></tr>`
  ).join('');
  return `<h2>Journal Entries</h2>
<table><thead><tr><th>Date</th><th>Debit Account</th><th>Credit Account</th><th>Amount</th><th>Category</th><th>Description</th><th>Source</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

export function buildLedgerHtml(transactions) {
  const clean = (d = '') => d.split(' | META:')[0].split(' - Vendor:')[0];
  const rows = transactions.map(r =>
    `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.account?.accountName || '—'}</td><td><span class="badge ${r.type === 'DEBIT' ? 'badge-red' : 'badge-green'}">${r.type}</span></td><td>${r.category}</td><td>${fmt(r.amount)}</td><td>${clean(r.description)}</td></tr>`
  ).join('');
  return `<h2>General Ledger</h2>
<table><thead><tr><th>Date</th><th>Account</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th></tr></thead>
<tbody>${rows}</tbody></table>`;
}

export function buildReportsHtml(balanceSheet, profitLoss, plYear, plMonth) {
  const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const period = plMonth ? `${months[plMonth]} ${plYear}` : `Year ${plYear}`;
  const netColor = profitLoss.netProfit >= 0 ? 'green' : 'red';

  const plCards = `<div class="cards">
    <div class="card"><div class="label">Total Income</div><div class="value green">${fmt(profitLoss.income)}</div></div>
    <div class="card"><div class="label">Total Expenses</div><div class="value red">${fmt(profitLoss.expenses)}</div></div>
    <div class="card"><div class="label">Net Profit</div><div class="value ${netColor}">${fmt(profitLoss.netProfit)}</div></div>
  </div>`;

  const bsRows = [
    ['Assets', balanceSheet.totalAssets, 'blue'],
    ['Liabilities', balanceSheet.totalLiabilities, 'red'],
    ['Equity', balanceSheet.totalEquity, 'purple'],
  ].map(([l, v, c]) => `<div class="row"><span>${l}</span><span class="${c}">${fmt(v)}</span></div>`).join('');

  const incomeRows = Object.entries(profitLoss.incomeAccounts || {})
    .map(([k, v]) => `<div class="row"><span>${k}</span><span>${fmt(v)}</span></div>`).join('') || '<div class="row"><span>—</span><span>—</span></div>';
  const expenseRows = Object.entries(profitLoss.expenseAccounts || {})
    .map(([k, v]) => `<div class="row"><span>${k}</span><span>${fmt(v)}</span></div>`).join('') || '<div class="row"><span>—</span><span>—</span></div>';

  return `<p style="font-size:12px;color:#555;margin-bottom:12px">Period: <strong>${period}</strong></p>
${plCards}
<div class="bs-grid">
  <div class="bs-section">
    <h3 style="background:#dbeafe;color:#1e3a8a">Balance Sheet</h3>
    ${bsRows}
    <div class="total"><span>Total Assets</span><span class="blue">${fmt(balanceSheet.totalAssets)}</span></div>
  </div>
  <div class="bs-section">
    <h3 style="background:#dcfce7;color:#15803d">Profit & Loss — ${period}</h3>
    <div class="pl-breakdown">
      <div class="pl-col">
        <h4 style="background:#dcfce7;color:#15803d">Income</h4>
        ${incomeRows}
        <div class="total"><span>Total</span><span class="green">${fmt(profitLoss.income)}</span></div>
      </div>
      <div class="pl-col">
        <h4 style="background:#fee2e2;color:#b91c1c">Expenses</h4>
        ${expenseRows}
        <div class="total"><span>Total</span><span class="red">${fmt(profitLoss.expenses)}</span></div>
      </div>
    </div>
    <div class="total" style="margin-top:12px"><span>Net Profit</span><span class="${netColor}">${fmt(profitLoss.netProfit)}</span></div>
  </div>
</div>`;
}

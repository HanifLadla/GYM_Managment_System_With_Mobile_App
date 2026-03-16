import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiUser, FiPhone,
  FiCalendar, FiCreditCard, FiDollarSign, FiClock, FiPrinter, FiLoader
} from 'react-icons/fi';

const fmt  = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtT = (d) => d ? new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—';
const planName = (ms) => ms?.plan?.name || (ms?.planType ? ms.planType.charAt(0) + ms.planType.slice(1).toLowerCase() : '—');

const buildPrintHTML = (payment, settings, qrDataUrl) => {
  const sym      = settings?.currencySymbol || 'Rs';
  const primary  = settings?.slipPrimaryColor || '#2563eb';
  const member   = payment?.membership?.member || {};
  const ms       = payment?.membership || {};
  const receiptNo = (payment?.id || '').slice(-8).toUpperCase();
  const contact  = [settings?.gymAddress, settings?.gymPhone, settings?.gymEmail].filter(Boolean).join(' | ');

  const row = (label, value) => value
    ? `<tr><td style="padding:5px 0;color:#666;font-size:12px;width:45%;">${label}</td><td style="padding:5px 0;font-weight:600;text-align:right;font-size:12px;">${value}</td></tr>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Receipt #${receiptNo}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;}
    .page{width:400px;margin:0 auto;padding:22px 18px;}
    table{width:100%;border-collapse:collapse;}
    td{vertical-align:top;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{width:100%;padding:10px;}}
  </style>
</head>
<body>
<div class="page">
  <div style="text-align:center;padding-bottom:12px;border-bottom:2.5px solid ${primary};margin-bottom:12px;">
    ${settings?.showLogoOnSlip && settings?.logoUrl ? `<img src="${settings.logoUrl}" style="max-height:52px;margin-bottom:6px;" alt="logo"/><br/>` : ''}
    <div style="font-size:21px;font-weight:900;color:${primary};">${settings?.gymName || 'GYM'}</div>
    ${settings?.gymTagline ? `<div style="font-size:10px;color:#888;margin-top:2px;">${settings.gymTagline}</div>` : ''}
    ${contact ? `<div style="font-size:10px;color:#777;margin-top:3px;">${contact}</div>` : ''}
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:${primary};">Payment Receipt</div>
    <div style="font-size:10px;color:#999;">Receipt <span style="font-weight:700;color:#333;">#${receiptNo}</span></div>
  </div>
  <div style="background:${primary};border-radius:10px;padding:14px;text-align:center;margin-bottom:14px;">
    <div style="font-size:10px;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Amount Paid</div>
    <div style="font-size:28px;font-weight:900;color:#fff;">${sym} ${Number(payment?.amount || 0).toLocaleString()}</div>
    <div style="margin-top:7px;display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:2px 12px;">
      <span style="font-size:10px;color:#fff;font-weight:700;">✓ VERIFIED & PAID</span>
    </div>
  </div>
  <div style="display:flex;gap:10px;margin-bottom:12px;">
    <div style="flex:1;">
      <div style="background:#f9fafb;border-radius:8px;padding:10px;margin-bottom:10px;">
        <div style="font-size:10px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;">Member</div>
        <table>
          ${row('Name', member.name)}
          ${row('Phone', member.phone)}
          ${member.cnic ? row('CNIC', member.cnic) : ''}
        </table>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:10px;">
        <div style="font-size:10px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;">Membership</div>
        <table>
          ${row('Plan', planName(ms))}
          ${row('From', fmt(ms?.startDate))}
          ${row('Until', fmt(ms?.endDate))}
        </table>
      </div>
    </div>
    ${qrDataUrl ? `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;border-radius:8px;padding:10px;min-width:110px;">
      <img src="${qrDataUrl}" style="width:90px;height:90px;" alt="QR"/>
      <div style="font-size:8px;color:#999;margin-top:4px;text-align:center;">Scan to verify</div>
    </div>` : ''}
  </div>
  <div style="background:#f9fafb;border-radius:8px;padding:10px;margin-bottom:12px;">
    <div style="font-size:10px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;">Transaction</div>
    <table>
      ${row('Receipt #', '#' + receiptNo)}
      ${row('Method', (payment?.method || '').replace(/_/g, ' '))}
      ${row('Date', fmt(payment?.paymentDate))}
      ${row('Time', fmtT(payment?.paymentDate))}
      ${payment?.notes ? row('Notes', payment.notes) : ''}
    </table>
  </div>
  <div style="text-align:center;margin:14px 0 8px;">
    <div style="display:inline-block;border:2.5px solid #16a34a;border-radius:6px;padding:3px 18px;transform:rotate(-3deg);">
      <span style="font-size:16px;font-weight:900;color:#16a34a;letter-spacing:3px;">PAID</span>
    </div>
  </div>
  <div style="text-align:center;padding-top:10px;border-top:1px dashed #ddd;">
    <div style="font-size:11px;color:#666;">${settings?.paymentSlipFooter || 'Thank you for your payment!'}</div>
    ${settings?.gymWebsite ? `<div style="font-size:10px;color:${primary};margin-top:3px;">${settings.gymWebsite}</div>` : ''}
    <div style="font-size:9px;color:#bbb;margin-top:5px;">Verified on ${new Date().toLocaleString()}</div>
  </div>
</div>
</body>
</html>`;
};

const InfoRow = ({ icon: Icon, label, value, highlight }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <Icon className="w-3.5 h-3.5" /> {label}
    </div>
    <span className={`text-sm font-semibold ${highlight || 'text-gray-800'}`}>{value || '—'}</span>
  </div>
);

const PaymentVerify = () => {
  const { paymentId } = useParams();
  const [data, setData]     = useState(null);
  const [qr, setQr]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [verifyRes, qrRes] = await Promise.all([
          axios.get(`/api/payments/verify/${paymentId}`),
          axios.get(`/api/payments/${paymentId}/qr`).catch(() => ({ data: { qr: null } }))
        ]);
        setData(verifyRes.data);
        setQr(qrRes.data.qr);
      } catch (e) {
        setError(e.response?.data?.error || 'Payment not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [paymentId]);

  const printSlip = () => {
    if (!data) return;
    const html = buildPrintHTML(data.payment, data.settings || {}, qr);
    const win = window.open('', '_blank', 'width=480,height=800,scrollbars=yes');
    if (!win) { alert('Please allow popups to print.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <FiLoader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Verifying payment...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
        <p className="text-gray-500 text-sm">{error}</p>
        <div className="mt-4 p-3 bg-red-50 rounded-lg text-xs text-red-600">
          This QR code may be invalid or the payment record may have been deleted.
        </div>
      </div>
    </div>
  );

  const { payment, settings } = data;
  const member   = payment?.membership?.member || {};
  const ms       = payment?.membership || {};
  const primary  = settings?.slipPrimaryColor || '#2563eb';
  const sym      = settings?.currencySymbol || 'Rs';
  const receiptNo = (payment?.id || '').slice(-8).toUpperCase();

  const expiry   = ms?.endDate ? new Date(ms.endDate) : null;
  const isExpired = expiry ? expiry < new Date() : false;
  const daysLeft  = expiry ? Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Verification Badge */}
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiCheckCircle className="w-9 h-9 text-green-500" />
          </div>
          <h1 className="text-xl font-black text-gray-800">Payment Verified</h1>
          <p className="text-gray-500 text-sm mt-1">This payment receipt is authentic and verified</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold">
            <FiCheckCircle className="w-4 h-4" /> PAID &amp; VERIFIED
          </div>
        </div>

        {/* Gym Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 text-center text-white" style={{ background: primary }}>
            {settings?.showLogoOnSlip && settings?.logoUrl && (
              <img src={settings.logoUrl} alt="logo" className="h-10 mx-auto mb-2 object-contain" />
            )}
            <div className="text-lg font-black">{settings?.gymName || 'GYM'}</div>
            {settings?.gymTagline && <div className="text-xs opacity-80 mt-0.5">{settings.gymTagline}</div>}
            <div className="text-xs opacity-70 mt-1">
              {[settings?.gymAddress, settings?.gymPhone, settings?.gymEmail].filter(Boolean).join(' · ')}
            </div>
          </div>

          {/* Amount */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Amount Paid</div>
                <div className="text-3xl font-black mt-0.5" style={{ color: primary }}>
                  {sym} {Number(payment?.amount || 0).toLocaleString()}
                </div>
                {settings?.taxEnabled && settings?.taxRate > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5">Incl. {settings.taxLabel} @ {settings.taxRate}%</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Receipt</div>
                <div className="font-mono font-bold text-gray-700">#{receiptNo}</div>
                <div className="mt-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">PAID</div>
              </div>
            </div>
          </div>

          {/* Member + QR */}
          <div className="flex gap-0">
            <div className="flex-1 px-5 py-4 border-r border-gray-100">
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>Member</div>
              <InfoRow icon={FiUser}     label="Name"   value={member.name} />
              <InfoRow icon={FiPhone}    label="Phone"  value={member.phone} />
              {member.cnic && <InfoRow icon={FiCreditCard} label="CNIC" value={member.cnic} />}
              {member.gender && <InfoRow icon={FiUser} label="Gender" value={member.gender} />}
            </div>
            {/* QR */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 min-w-[110px]">
              {qr ? (
                <>
                  <img src={qr} alt="QR" className="w-20 h-20" />
                  <div className="text-xs text-gray-400 mt-1 text-center leading-tight">Scan to<br/>verify</div>
                </>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                  <FiLoader className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Membership */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>Membership</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-xs text-gray-400">Plan</div>
                <div className="font-bold text-gray-800 text-sm mt-0.5">{planName(ms)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-xs text-gray-400">Status</div>
                <div className={`font-bold text-sm mt-0.5 ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {isExpired ? 'Expired' : 'Active'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-xs text-gray-400">Valid From</div>
                <div className="font-semibold text-gray-700 text-xs mt-0.5">{fmt(ms?.startDate)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-xs text-gray-400">Valid Until</div>
                <div className={`font-semibold text-xs mt-0.5 ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
                  {fmt(ms?.endDate)}
                </div>
              </div>
            </div>
            {daysLeft !== null && (
              <div className={`mt-2 text-center text-xs font-semibold py-1.5 rounded-lg ${
                isExpired
                  ? 'bg-red-50 text-red-600'
                  : daysLeft <= 7
                  ? 'bg-orange-50 text-orange-600'
                  : 'bg-green-50 text-green-600'
              }`}>
                {isExpired
                  ? `Membership expired ${Math.abs(daysLeft)} days ago`
                  : daysLeft === 0
                  ? 'Membership expires today'
                  : `${daysLeft} days remaining`}
              </div>
            )}
          </div>

          {/* Transaction */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>Transaction Details</div>
            <InfoRow icon={FiCreditCard} label="Receipt #"  value={'#' + receiptNo} />
            <InfoRow icon={FiDollarSign} label="Method"     value={(payment?.method || '').replace(/_/g, ' ')} />
            <InfoRow icon={FiCalendar}   label="Date"       value={fmt(payment?.paymentDate)} />
            <InfoRow icon={FiClock}      label="Time"       value={fmtT(payment?.paymentDate)} />
            {payment?.notes && <InfoRow icon={FiCreditCard} label="Notes" value={payment.notes} />}
          </div>

          {/* Bank */}
          {(settings?.bankName || settings?.bankAccountNumber) && (
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>Bank Details</div>
              {[
                settings?.bankName          && ['Bank', settings.bankName],
                settings?.bankAccountTitle  && ['Title', settings.bankAccountTitle],
                settings?.bankAccountNumber && ['Account', settings.bankAccountNumber],
                settings?.bankIban          && ['IBAN', settings.bankIban],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-1">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-semibold text-gray-700">{v}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 text-center">
            {settings?.taxEnabled && settings?.taxNumber && (
              <div className="text-xs text-gray-400 mb-2">{settings.taxLabel} Reg #: {settings.taxNumber}</div>
            )}
            {settings?.paymentSlipNotes && (
              <div className="text-xs text-gray-400 italic mb-2">{settings.paymentSlipNotes}</div>
            )}
            <div className="text-xs text-gray-500">
              {settings?.paymentSlipFooter || 'Thank you for your payment!'}
            </div>
            {settings?.gymWebsite && (
              <a href={settings.gymWebsite} className="text-xs mt-1 block" style={{ color: primary }}>
                {settings.gymWebsite}
              </a>
            )}
            <div className="text-xs text-gray-300 mt-2">Verified on {new Date().toLocaleString()}</div>
          </div>
        </div>

        {/* Print Button */}
        <button onClick={printSlip}
          className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg transition hover:opacity-90"
          style={{ background: primary }}>
          <FiPrinter className="w-5 h-5" /> Print Payment Slip
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          This is an official payment receipt from {settings?.gymName || 'the gym'}.
        </p>
      </div>
    </div>
  );
};

export default PaymentVerify;

import { useEffect, useState } from 'react';
import axios from 'axios';
import { FiPrinter, FiX, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { BACKEND_URL } from '../config';

const planName = (ms) => ms?.plan?.name || (ms?.planType ? ms.planType.charAt(0) + ms.planType.slice(1).toLowerCase() : '—');
const fmt  = (d) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtT = (d) => d ? new Date(d).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }) : '—';

const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
};

const buildPrintHTML = (payment, settings, qrDataUrl) => {
  const sym      = settings.currencySymbol || 'Rs';
  const primary  = settings.slipPrimaryColor || '#2563eb';
  const member   = payment?.membership?.member || {};
  const ms       = payment?.membership || {};
  const receiptNo = (payment.id || '').slice(-8).toUpperCase();
  const amount   = Number(payment.amount || 0).toLocaleString();
  const contact  = [settings.gymAddress, settings.gymPhone, settings.gymEmail].filter(Boolean).join(' &nbsp;|&nbsp; ');

  const row = (label, value) => value
    ? `<tr>
        <td style="padding:5px 0;color:#666;font-size:12px;width:45%;">${label}</td>
        <td style="padding:5px 0;font-weight:600;text-align:right;font-size:12px;">${value}</td>
       </tr>`
    : '';

  const bankSection = (settings.bankName || settings.bankAccountNumber) ? `
    <div style="margin-top:12px;padding:10px;background:#f0f4ff;border-radius:6px;border-left:3px solid ${primary};">
      <div style="font-weight:700;font-size:10px;color:${primary};margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Bank Details</div>
      ${settings.bankName          ? `<div style="font-size:11px;color:#444;margin-bottom:2px;">Bank: <b>${settings.bankName}</b></div>` : ''}
      ${settings.bankAccountTitle  ? `<div style="font-size:11px;color:#444;margin-bottom:2px;">Title: <b>${settings.bankAccountTitle}</b></div>` : ''}
      ${settings.bankAccountNumber ? `<div style="font-size:11px;color:#444;margin-bottom:2px;">Account: <b>${settings.bankAccountNumber}</b></div>` : ''}
      ${settings.bankIban          ? `<div style="font-size:11px;color:#444;">IBAN: <b>${settings.bankIban}</b></div>` : ''}
    </div>` : '';

  const taxLine    = settings.taxEnabled && settings.taxRate > 0
    ? `<div style="font-size:10px;opacity:.8;margin-top:2px;">Incl. ${settings.taxLabel || 'Tax'} @ ${settings.taxRate}%</div>` : '';
  const taxRegLine = settings.taxEnabled && settings.taxNumber
    ? `<div style="font-size:10px;color:#888;margin-top:4px;">${settings.taxLabel || 'Tax'} Reg #: ${settings.taxNumber}</div>` : '';

  const qrSection = qrDataUrl ? `
    <div style="text-align:center;margin:14px 0 8px;">
      <img src="${qrDataUrl}" style="width:90px;height:90px;" alt="QR"/>
      <div style="font-size:9px;color:#999;margin-top:3px;">Scan to verify payment</div>
    </div>` : '';

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
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .page{width:100%;padding:10px;}
    }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="text-align:center;padding-bottom:12px;border-bottom:2.5px solid ${primary};margin-bottom:12px;">
    ${settings.showLogoOnSlip && settings.logoUrl ? `<img src="${resolveUrl(settings.logoUrl)}" style="max-height:52px;margin-bottom:6px;" alt="logo"/><br/>` : ''}
    <div style="font-size:21px;font-weight:900;color:${primary};letter-spacing:.5px;">${settings.gymName || 'GYM'}</div>
    ${settings.gymTagline ? `<div style="font-size:10px;color:#888;margin-top:2px;">${settings.gymTagline}</div>` : ''}
    ${contact ? `<div style="font-size:10px;color:#777;margin-top:3px;">${contact}</div>` : ''}
    ${settings.paymentSlipHeader ? `<div style="font-size:10px;color:#666;margin-top:5px;font-style:italic;">${settings.paymentSlipHeader}</div>` : ''}
  </div>

  <!-- TITLE ROW -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
    <div style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:${primary};">Payment Receipt</div>
    <div style="font-size:10px;color:#999;">Receipt <span style="font-weight:700;color:#333;">#${receiptNo}</span></div>
  </div>

  <!-- AMOUNT BOX -->
  <div style="background:${primary};border-radius:10px;padding:14px;text-align:center;margin-bottom:14px;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-15px;right:-15px;width:70px;height:70px;background:rgba(255,255,255,.08);border-radius:50%;"></div>
    <div style="position:absolute;bottom:-25px;left:-10px;width:90px;height:90px;background:rgba(255,255,255,.05);border-radius:50%;"></div>
    <div style="font-size:10px;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Amount Paid</div>
    <div style="font-size:28px;font-weight:900;color:#fff;">${sym} ${amount}</div>
    ${taxLine}
    <div style="margin-top:7px;display:inline-block;background:rgba(255,255,255,.2);border-radius:20px;padding:2px 12px;">
      <span style="font-size:10px;color:#fff;font-weight:700;">✓ PAID</span>
    </div>
  </div>

  <!-- TWO COLUMN: DETAILS + QR -->
  <div style="display:flex;gap:10px;margin-bottom:12px;">
    <div style="flex:1;">
      <!-- MEMBER -->
      <div style="background:#f9fafb;border-radius:8px;padding:10px;margin-bottom:10px;">
        <div style="font-size:10px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;">Member</div>
        <table>
          ${row('Name', member.name)}
          ${row('Phone', member.phone)}
          ${member.cnic ? row('CNIC', member.cnic) : ''}
          ${member.gender ? row('Gender', member.gender) : ''}
        </table>
      </div>
      <!-- MEMBERSHIP -->
      <div style="background:#f9fafb;border-radius:8px;padding:10px;">
        <div style="font-size:10px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;">Membership</div>
        <table>
          ${row('Plan', planName(ms))}
          ${row('From', fmt(ms.startDate))}
          ${row('Until', fmt(ms.endDate))}
        </table>
      </div>
    </div>
    <!-- QR CODE -->
    ${qrDataUrl ? `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f9fafb;border-radius:8px;padding:10px;min-width:110px;">
      <img src="${qrDataUrl}" style="width:90px;height:90px;" alt="QR Code"/>
      <div style="font-size:8px;color:#999;margin-top:4px;text-align:center;">Scan to verify</div>
      <div style="font-size:8px;color:#bbb;margin-top:1px;text-align:center;">payment</div>
    </div>` : ''}
  </div>

  <!-- TRANSACTION -->
  <div style="background:#f9fafb;border-radius:8px;padding:10px;margin-bottom:12px;">
    <div style="font-size:10px;font-weight:700;color:${primary};text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;">Transaction</div>
    <table>
      ${row('Receipt #', '#' + receiptNo)}
      ${row('Method', (payment.method || '').replace(/_/g, ' '))}
      ${row('Date', fmt(payment.paymentDate))}
      ${row('Time', fmtT(payment.paymentDate))}
      ${payment.notes ? row('Notes', payment.notes) : ''}
    </table>
  </div>

  ${bankSection}
  ${taxRegLine}

  <!-- PAID STAMP -->
  <div style="text-align:center;margin:14px 0 8px;">
    <div style="display:inline-block;border:2.5px solid #16a34a;border-radius:6px;padding:3px 18px;transform:rotate(-3deg);">
      <span style="font-size:16px;font-weight:900;color:#16a34a;letter-spacing:3px;">PAID</span>
    </div>
  </div>

  ${settings.paymentSlipNotes ? `<div style="font-size:10px;color:#777;font-style:italic;text-align:center;margin-bottom:8px;">${settings.paymentSlipNotes}</div>` : ''}

  <!-- FOOTER -->
  <div style="text-align:center;padding-top:10px;border-top:1px dashed #ddd;">
    <div style="font-size:11px;color:#666;font-weight:500;">${settings.paymentSlipFooter || 'Thank you for your payment!'}</div>
    ${settings.gymWebsite ? `<div style="font-size:10px;color:${primary};margin-top:3px;">${settings.gymWebsite}</div>` : ''}
    <div style="font-size:9px;color:#bbb;margin-top:5px;">Generated ${new Date().toLocaleString()}</div>
  </div>

</div>
</body>
</html>`;
};

const PaymentSlip = ({ payment, settings = {}, onClose, autoPrint = false }) => {
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const primary   = settings.slipPrimaryColor || '#2563eb';
  const sym       = settings.currencySymbol || 'Rs';
  const member    = payment?.membership?.member || {};
  const ms        = payment?.membership || {};
  const receiptNo = (payment?.id || '').slice(-8).toUpperCase();

  // Fetch QR from backend
  useEffect(() => {
    if (!payment?.id) return;
    axios.get(`/api/payments/${payment.id}/qr`)
      .then(({ data }) => setQrDataUrl(data.qr))
      .catch(() => {});
  }, [payment?.id]);

  const printSlip = () => {
    const html = buildPrintHTML(payment, settings, qrDataUrl);
    const win = window.open('', '_blank', 'width=480,height=800,scrollbars=yes');
    if (!win) { alert('Please allow popups to print the slip.'); return; }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  useEffect(() => {
    if (autoPrint && qrDataUrl !== undefined) {
      // wait for QR to load (or skip if null after short delay)
      const t = setTimeout(printSlip, 600);
      return () => clearTimeout(t);
    }
  }, [autoPrint, qrDataUrl, payment?.id]);

  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[94vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: primary + '33' }}>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500 w-5 h-5" />
            <span className="font-bold text-gray-800">Payment Receipt</span>
            <span className="text-xs text-gray-400 font-mono">#{receiptNo}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Slip Preview */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3 text-sm">

          {/* Gym Header */}
          <div className="text-center pb-3 border-b-2" style={{ borderColor: primary }}>
            {settings.showLogoOnSlip && settings.logoUrl && (
              <img src={resolveUrl(settings.logoUrl)} alt="logo" className="h-10 mx-auto mb-1.5 object-contain" />
            )}
            <div className="text-lg font-black" style={{ color: primary }}>{settings.gymName || 'GYM'}</div>
            {settings.gymTagline && <div className="text-xs text-gray-400 mt-0.5">{settings.gymTagline}</div>}
            <div className="text-xs text-gray-400 mt-1">
              {[settings.gymAddress, settings.gymPhone, settings.gymEmail].filter(Boolean).join(' · ')}
            </div>
            {settings.paymentSlipHeader && <div className="text-xs text-gray-500 italic mt-1">{settings.paymentSlipHeader}</div>}
          </div>

          {/* Amount */}
          <div className="rounded-xl p-3.5 text-center text-white relative overflow-hidden" style={{ background: primary }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 bg-white -translate-y-4 translate-x-4" />
            <div className="text-xs opacity-75 uppercase tracking-widest mb-1">Amount Paid</div>
            <div className="text-3xl font-black">{sym} {Number(payment.amount || 0).toLocaleString()}</div>
            {settings.taxEnabled && settings.taxRate > 0 && (
              <div className="text-xs opacity-70 mt-0.5">Incl. {settings.taxLabel} @ {settings.taxRate}%</div>
            )}
            <div className="mt-2 inline-block bg-white/20 rounded-full px-3 py-0.5 text-xs font-bold tracking-wider">✓ PAID</div>
          </div>

          {/* Details + QR side by side */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              {/* Member */}
              <div className="bg-gray-50 rounded-xl p-2.5">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: primary }}>Member</div>
                {[
                  ['Name', member.name],
                  ['Phone', member.phone],
                  member.cnic && ['CNIC', member.cnic],
                  member.gender && ['Gender', member.gender],
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs py-0.5">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-gray-700 text-right max-w-[55%] truncate">{v}</span>
                  </div>
                ))}
              </div>
              {/* Membership */}
              <div className="bg-gray-50 rounded-xl p-2.5">
                <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: primary }}>Membership</div>
                {[
                  ['Plan', planName(ms)],
                  ['From', fmt(ms.startDate)],
                  ['Until', fmt(ms.endDate)],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs py-0.5">
                    <span className="text-gray-400">{l}</span>
                    <span className="font-semibold text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl p-2.5 min-w-[100px]">
              {qrDataUrl ? (
                <>
                  <img src={qrDataUrl} alt="QR" className="w-20 h-20" />
                  <div className="text-xs text-gray-400 mt-1 text-center leading-tight">Scan to<br/>verify</div>
                </>
              ) : (
                <div className="w-20 h-20 flex items-center justify-center">
                  <FiLoader className="w-6 h-6 text-gray-300 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Transaction */}
          <div className="bg-gray-50 rounded-xl p-2.5">
            <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: primary }}>Transaction</div>
            {[
              ['Receipt #', '#' + receiptNo],
              ['Method', (payment.method || '').replace(/_/g, ' ')],
              ['Date', fmt(payment.paymentDate)],
              ['Time', fmtT(payment.paymentDate)],
              payment.notes && ['Notes', payment.notes],
            ].filter(Boolean).map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs py-0.5">
                <span className="text-gray-400">{l}</span>
                <span className="font-semibold text-gray-700 text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>

          {/* Bank */}
          {(settings.bankName || settings.bankAccountNumber) && (
            <div className="rounded-xl p-2.5 border-l-4 bg-gray-50" style={{ borderColor: primary }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: primary }}>Bank Details</div>
              {[
                settings.bankName          && ['Bank', settings.bankName],
                settings.bankAccountTitle  && ['Title', settings.bankAccountTitle],
                settings.bankAccountNumber && ['Account', settings.bankAccountNumber],
                settings.bankIban          && ['IBAN', settings.bankIban],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-400">{l}</span>
                  <span className="font-semibold text-gray-700">{v}</span>
                </div>
              ))}
            </div>
          )}

          {settings.taxEnabled && settings.taxNumber && (
            <div className="text-xs text-gray-400">{settings.taxLabel} Reg #: {settings.taxNumber}</div>
          )}

          {/* PAID stamp */}
          <div className="flex justify-center py-1">
            <div className="border-2 border-green-500 rounded px-5 py-1 -rotate-3">
              <span className="text-green-600 font-black text-lg tracking-widest">PAID</span>
            </div>
          </div>

          {settings.paymentSlipNotes && (
            <div className="text-xs text-gray-400 italic text-center">{settings.paymentSlipNotes}</div>
          )}

          <div className="text-center text-xs text-gray-400 pt-2 border-t border-dashed border-gray-200">
            {settings.paymentSlipFooter || 'Thank you for your payment!'}
            {settings.gymWebsite && <div className="mt-0.5" style={{ color: primary }}>{settings.gymWebsite}</div>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button onClick={printSlip}
            className="flex-1 flex items-center justify-center gap-2 text-white py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
            style={{ background: primary }}>
            <FiPrinter className="w-4 h-4" /> Print Slip
          </button>
          <button onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-300 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSlip;

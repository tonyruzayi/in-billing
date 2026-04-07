/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../lib/pdfGenerator';
import { exportInvoiceXLSX } from '../lib/excelExport';
import LOGO from '../logoData';

const fa = n => 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
const fd = d => d ? format(new Date(d), 'dd MMM yyyy') : '—';
const emptyPay = { amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer', reference: '', notes: '' };

export default function InvoiceDetail() {
  const { id } = useParams(), nav = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payModal, setPayModal] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [payForm, setPayForm] = useState(emptyPay);
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const [{ data: inv }, { data: pays }] = await Promise.all([
      supabase.from('invoices').select('*').eq('id', id).single(),
      supabase.from('payments').select('*').eq('invoice_id', id).order('payment_date'),
    ]);
    if (!inv) { nav('/invoices'); return; }
    setInvoice(inv); setPayments(pays || []);
    setEmailTo(inv.client_email || '');
    const bal = Number(inv.balance_due || 0);
    setEmailMsg(
      'Dear ' + inv.client_name + ',\n\n' +
      'Please find attached invoice ' + inv.invoice_number + '.\n\n' +
      'Invoice Total: BWP ' + Number(inv.total).toFixed(2) + '\n' +
      'Amount Paid:   BWP ' + Number(inv.amount_paid).toFixed(2) + '\n' +
      'Balance Due:   BWP ' + bal.toFixed(2) + '\n' +
      'Due Date: ' + fd(inv.due_date) + '\n\n' +
      'Please quote the invoice number on all payments.\n\n' +
      'Kind regards,\nInformation Networking\ninfo@in-networking.com | +267 76 173 945'
    );
  }

  async function addPayment() {
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    const currentBal = Number(invoice.total) - payments.reduce((s, p) => s + Number(p.amount), 0);
    if (Number(payForm.amount) > currentBal + 0.01) { toast.error('Amount exceeds balance of BWP ' + currentBal.toFixed(2)); return; }
    setSaving(true);
    const { error } = await supabase.from('payments').insert({ ...payForm, invoice_id: id, amount: Number(payForm.amount) });
    if (error) { toast.error(error.message); setSaving(false); return; }
    const { data: pays } = await supabase.from('payments').select('*').eq('invoice_id', id);
    const totalPaid = (pays || []).reduce((s, p) => s + Number(p.amount), 0);
    const newBal = Number(invoice.total) - totalPaid;
    const newStatus = newBal <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
    await supabase.from('invoices').update({ amount_paid: Math.round(totalPaid * 100) / 100, balance_due: Math.round(Math.max(newBal, 0) * 100) / 100, status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    toast.success('Payment recorded!');
    setPayModal(false); setPayForm(emptyPay); setSaving(false); load();
  }

  async function deletePayment(payId) {
    if (!window.confirm('Remove this payment?')) return;
    await supabase.from('payments').delete().eq('id', payId);
    const { data: pays } = await supabase.from('payments').select('*').eq('invoice_id', id);
    const totalPaid = (pays || []).reduce((s, p) => s + Number(p.amount), 0);
    const newBal = Number(invoice.total) - totalPaid;
    const newStatus = newBal <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
    await supabase.from('invoices').update({ amount_paid: Math.round(totalPaid * 100) / 100, balance_due: Math.round(Math.max(newBal, 0) * 100) / 100, status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    toast.success('Payment removed'); load();
  }

  function handleEmail() {
    if (!emailTo) { toast.error('Enter recipient email'); return; }
    const sub = encodeURIComponent('Invoice ' + invoice.invoice_number + ' — Information Networking');
    const body = encodeURIComponent(emailMsg);
    window.open('mailto:' + emailTo + '?subject=' + sub + '&body=' + body);
    setEmailModal(false);
    toast.success('Email client opened — attach the PDF before sending');
  }

  if (!invoice) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>Loading…</div>
  );

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  return (<>
    <div className="page-hdr">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => nav('/invoices')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">{invoice.invoice_number}</h1>
          <p className="page-sub">Tax Invoice · {invoice.client_name}</p>
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-secondary btn-sm" onClick={() => { generateInvoicePDF(invoice, payments, LOGO); toast.success('PDF downloaded'); }}>📄 PDF</button>
        <button className="btn btn-secondary btn-sm" onClick={() => { exportInvoiceXLSX(invoice, payments); toast.success('Excel downloaded'); }}>📊 Excel</button>
        <button className="btn btn-secondary btn-sm" onClick={() => setEmailModal(true)}>📧 Email</button>
        <Link to={'/invoices/' + id + '/edit'} className="btn btn-secondary btn-sm">✏️ Edit</Link>
        {invoice.status !== 'paid' && <button className="btn btn-ok btn-sm" onClick={() => setPayModal(true)}>💳 Payment</button>}
      </div>
    </div>

    <div className="page-body">
      {/* Mobile quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: invoice.status !== 'paid' ? 'repeat(4,1fr)' : 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
        <button className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 4px', fontSize: '.7rem' }}
          onClick={() => { generateInvoicePDF(invoice, payments, LOGO); toast.success('PDF downloaded'); }}>📄<span>PDF</span></button>
        <button className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 4px', fontSize: '.7rem' }}
          onClick={() => { exportInvoiceXLSX(invoice, payments); toast.success('Excel downloaded'); }}>📊<span>Excel</span></button>
        <button className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 4px', fontSize: '.7rem' }}
          onClick={() => setEmailModal(true)}>📧<span>Email</span></button>
        {invoice.status !== 'paid' && (
          <button className="btn btn-ok btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 4px', fontSize: '.7rem' }}
            onClick={() => setPayModal(true)}>💳<span>Payment</span></button>
        )}
      </div>

      {/* Balance summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
        <div className="stat-card cyan"><div className="stat-lbl">Total</div><div className="stat-val sm">{fa(invoice.total)}</div></div>
        <div className="stat-card ok"><div className="stat-lbl">Paid</div><div className="stat-val sm" style={{ color: 'var(--ok)' }}>{fa(totalPaid)}</div><div className="stat-sub">{payments.length} payment{payments.length !== 1 ? 's' : ''}</div></div>
        <div className={balance <= 0 ? 'stat-card ok' : 'stat-card warn'}><div className="stat-lbl">Balance</div><div className="stat-val sm" style={{ color: balance <= 0 ? 'var(--ok)' : 'var(--warn)' }}>{balance <= 0 ? '✓ PAID' : fa(balance)}</div></div>
      </div>

      <div className="det-hdr">
        <div>
          <div className="doc-num">{invoice.invoice_number}</div>
          <div className="det-meta">
            <div className="det-meta-item">Date: <span>{fd(invoice.invoice_date)}</span></div>
            <div className="det-meta-item">Due: <span>{fd(invoice.due_date)}</span></div>
            {invoice.quote_number && <div className="det-meta-item">Quote: <span>{invoice.quote_number}</span></div>}
            {invoice.po_ref && <div className="det-meta-item">PO: <span>{invoice.po_ref}</span></div>}
          </div>
        </div>
        <span className={'badge b-' + (invoice.status || 'unpaid')} style={{ fontSize: '.8rem', padding: '5px 12px' }}>
          {invoice.status || 'unpaid'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 14 }}>
        <div className="card">
          <div style={{ fontSize: '.66rem', fontWeight: 700, color: 'var(--purple-l)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>From</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Information Networking</div>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.9 }}>
            Plot 143 Seorome Ward<br />Palapye, Botswana<br />
            +267 76 173 945<br />info@in-networking.com<br />
            VAT Reg. No.: BW00000495441
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '.66rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Bill To</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{invoice.client_name}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.9 }}>
            {invoice.client_address && <>{invoice.client_address}<br /></>}
            {invoice.client_city && <>{invoice.client_city}, {invoice.client_country}<br /></>}
            {invoice.client_phone && <>{invoice.client_phone}<br /></>}
            {invoice.client_email}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Line Items</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>#</th><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Unit Price</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {(invoice.items || []).map((it, i) => (
                <tr key={i}>
                  <td className="td-m">{i + 1}</td><td>{it.description}</td>
                  <td style={{ textAlign: 'right' }}>{it.qty}</td>
                  <td style={{ textAlign: 'right' }}>{fa(it.unit_price)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>{fa((Number(it.qty) || 0) * (Number(it.unit_price) || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="totals-panel">
            <div className="tot-row"><span>Subtotal</span><span>{fa(invoice.subtotal)}</span></div>
            <div className="tot-row"><span>VAT ({((Number(invoice.vat_rate) || 0.14) * 100).toFixed(0)}%)</span><span>{fa(invoice.vat_amount)}</span></div>
            {Number(invoice.discount) > 0 && <div className="tot-row"><span>Discount</span><span>- {fa(invoice.discount)}</span></div>}
            <div className="tot-row grand"><span>TOTAL DUE (BWP)</span><span>{fa(invoice.total)}</span></div>
            {payments.map((p, i) => (
              <div key={p.id} className="tot-row pay">
                <span>Payment {i + 1} ({fd(p.payment_date)})</span><span>- {fa(p.amount)}</span>
              </div>
            ))}
            {payments.length > 0 && (
              <div className={balance <= 0 ? 'tot-row bal' : 'tot-row grand'}>
                <span>BALANCE DUE</span><span>{balance <= 0 ? '✓ FULLY PAID' : fa(balance)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          <span className="card-title">Payment History</span>
          {invoice.status !== 'paid' && (
            <button className="btn btn-ok btn-sm" onClick={() => setPayModal(true)}>+ Record Payment</button>
          )}
        </div>
        {payments.length === 0
          ? <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '18px 0', fontSize: '.82rem' }}>No payments recorded yet</div>
          : payments.map(p => (
            <div key={p.id} className="pay-item">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pay-amt">{fa(p.amount)}</span>
                  <span className="badge b-draft">{p.payment_method}</span>
                </div>
                <div style={{ fontSize: '.73rem', color: 'var(--muted)', marginTop: 3 }}>
                  {fd(p.payment_date)}{p.reference ? ' · Ref: ' + p.reference : ''}{p.notes ? ' · ' + p.notes : ''}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-xs" onClick={() => deletePayment(p.id)}>🗑️</button>
            </div>
          ))
        }
      </div>

      {/* Notes & Terms from template */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>Notes & Terms</div>
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.9 }}>
          Payment is due within 30 days of invoice date. Please quote the invoice number on all payments. Thank you for your business!
        </div>
        {invoice.notes && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Additional Notes</div>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.7 }}>{invoice.notes}</div>
          </div>
        )}
      </div>
    </div>

    {/* Payment Modal */}
    {payModal && (
      <div className="modal-overlay" onClick={() => setPayModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-title">💳 Record Payment</div>
          <div className="alert alert-info" style={{ marginBottom: 14 }}>
            Balance remaining: <strong>{fa(balance)}</strong>
          </div>
          <div className="form-grid" style={{ gap: 11 }}>
            <div className="fg"><label>Amount (BWP) *</label><input className="fc" type="number" min="0.01" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" autoFocus /></div>
            <div className="fg"><label>Payment Date</label><input className="fc" type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} /></div>
            <div className="fg"><label>Payment Method</label>
              <select className="fc" value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                <option>Bank Transfer</option><option>Cash</option><option>Cheque</option>
                <option>Mobile Money</option><option>Card</option><option>Other</option>
              </select>
            </div>
            <div className="fg"><label>Reference / Receipt No.</label><input className="fc" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} placeholder="Optional" /></div>
            <div className="fg"><label>Notes</label><input className="fc" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
            <button className="btn btn-ok" onClick={addPayment} disabled={saving}>{saving ? 'Saving…' : 'Record Payment'}</button>
          </div>
        </div>
      </div>
    )}

    {/* Email Modal */}
    {emailModal && (
      <div className="modal-overlay" onClick={() => setEmailModal(false)}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-title">📧 Send Invoice</div>
          <div className="alert alert-info" style={{ marginBottom: 14 }}>
            💡 Download the PDF first, then open your mail client and attach it.
          </div>
          <div className="fg" style={{ marginBottom: 12 }}>
            <label>To (Email Address)</label>
            <input className="fc" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
          </div>
          <div className="fg">
            <label>Message</label>
            <textarea className="fc" rows={9} value={emailMsg} onChange={e => setEmailMsg(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => { generateInvoicePDF(invoice, payments, LOGO); toast.success('PDF saved'); }}>
              📄 Download PDF
            </button>
            <button className="btn btn-primary" onClick={handleEmail}>Open Mail Client</button>
          </div>
        </div>
      </div>
    )}
  </>);
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../lib/pdfGenerator';
import { exportInvoiceToExcel } from '../lib/excelExport';
import { FileDown, Mail, Edit, ArrowLeft, Plus, Trash2, FileSpreadsheet } from 'lucide-react';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer', reference: '', notes: '' });
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const [{ data: inv }, { data: pays }] = await Promise.all([
      supabase.from('invoices').select('*').eq('id', id).single(),
      supabase.from('payments').select('*').eq('invoice_id', id).order('payment_date', { ascending: true }),
    ]);
    if (!inv) { navigate('/invoices'); return; }
    setInvoice(inv);
    setPayments(pays || []);
    setEmailTo(inv.client_email || '');
    setEmailMsg(`Dear ${inv.client_name},\n\nPlease find attached your invoice ${inv.invoice_number}.\n\nAmount Due: BWP ${Number(inv.balance_due).toFixed(2)}\n\nKind regards,\nInformation Networking`);
  }

  async function addPayment() {
    if (!payForm.amount || Number(payForm.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    const amt = Number(payForm.amount);
    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0) + amt;
    const balance = Number(invoice.total) - totalPaid;
    const newStatus = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

    const { error } = await supabase.from('payments').insert({ ...payForm, invoice_id: id, amount: amt });
    if (!error) {
      await supabase.from('invoices').update({
        amount_paid: Math.round(totalPaid * 100) / 100,
        balance_due: Math.round(Math.max(balance, 0) * 100) / 100,
        status: newStatus,
      }).eq('id', id);
      toast.success('Payment recorded!');
      setShowPayment(false);
      setPayForm({ amount: '', payment_date: format(new Date(), 'yyyy-MM-dd'), payment_method: 'Bank Transfer', reference: '', notes: '' });
      load();
    } else {
      toast.error(error.message);
    }
    setSaving(false);
  }

  async function deletePayment(payId) {
    if (!window.confirm('Delete this payment?')) return;
    await supabase.from('payments').delete().eq('id', payId);
    // Recalculate
    const remaining = payments.filter(p => p.id !== payId);
    const totalPaid = remaining.reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number(invoice.total) - totalPaid;
    const newStatus = balance <= 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
    await supabase.from('invoices').update({
      amount_paid: Math.round(totalPaid * 100) / 100,
      balance_due: Math.round(Math.max(balance, 0) * 100) / 100,
      status: newStatus,
    }).eq('id', id);
    toast.success('Payment removed');
    load();
  }

  async function sendEmail() {
    if (!emailTo) { toast.error('Enter an email address'); return; }
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number} – Information Networking`);
    const body = encodeURIComponent(emailMsg);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`);
    toast.success('Email client opened');
    setShowEmail(false);
  }

  if (!invoice) return <div className="splash"><div className="splash-logo">IN</div></div>;

  const fmtAmt = n => 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
  const fmtDate = d => d ? format(new Date(d), 'dd MMM yyyy') : '—';
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(invoice.total) - totalPaid;

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/invoices')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{invoice.invoice_number}</h1>
            <p className="page-subtitle">Tax Invoice · {invoice.client_name}</p>
          </div>
        </div>
        <div className="action-bar">
          <button className="btn btn-secondary btn-sm" onClick={() => exportInvoiceToExcel(invoice, payments)}>
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => generateInvoicePDF(invoice, payments)}>
            <FileDown size={15} /> PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEmail(true)}>
            <Mail size={15} /> Email
          </button>
          <Link to={`/invoices/${id}/edit`} className="btn btn-secondary btn-sm">
            <Edit size={15} /> Edit
          </Link>
          {invoice.status !== 'paid' && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPayment(true)}>
              <Plus size={15} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* Status header */}
        <div className="detail-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="detail-number">{invoice.invoice_number}</div>
            <div className="detail-meta">
              <div className="detail-meta-item">Date: <span>{fmtDate(invoice.invoice_date)}</span></div>
              <div className="detail-meta-item">Due: <span>{fmtDate(invoice.due_date)}</span></div>
              {invoice.quote_number && <div className="detail-meta-item">Quote: <span>{invoice.quote_number}</span></div>}
              {invoice.po_ref && <div className="detail-meta-item">PO: <span>{invoice.po_ref}</span></div>}
            </div>
          </div>
          <span className={`badge badge-${invoice.status || 'unpaid'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {invoice.status || 'unpaid'}
          </span>
        </div>

        {/* Balance summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          <div className="stat-card cyan">
            <div className="stat-label">Invoice Total</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{fmtAmt(invoice.total)}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Amount Paid</div>
            <div className="stat-value" style={{ fontSize: '1.3rem', color: 'var(--success)' }}>{fmtAmt(totalPaid)}</div>
            <div className="stat-sub">{payments.length} payment{payments.length !== 1 ? 's' : ''}</div>
          </div>
          <div className={`stat-card ${balance <= 0 ? 'success' : 'warning'}`}>
            <div className="stat-label">Balance Due</div>
            <div className="stat-value" style={{ fontSize: '1.3rem', color: balance <= 0 ? 'var(--success)' : 'var(--warning)' }}>
              {balance <= 0 ? 'PAID' : fmtAmt(balance)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>From</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Information Networking</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Plot 143 Seorome Ward<br />Palapye, Botswana<br />+267 76 173 945<br />info@in-networking.com<br />VAT: BW00000495441
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Bill To</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{invoice.client_name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {invoice.client_address && <>{invoice.client_address}<br /></>}
              {invoice.client_city && <>{invoice.client_city}, {invoice.client_country}<br /></>}
              {invoice.client_phone && <>{invoice.client_phone}<br /></>}
              {invoice.client_email}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>Line Items</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((it, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td>{it.description}</td>
                    <td style={{ textAlign: 'right' }}>{it.qty}</td>
                    <td style={{ textAlign: 'right' }}>{fmtAmt(it.unit_price)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}>
                      {fmtAmt((Number(it.qty) || 0) * (Number(it.unit_price) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="totals-panel">
              <div className="totals-row"><span>Subtotal</span><span>{fmtAmt(invoice.subtotal)}</span></div>
              <div className="totals-row"><span>VAT ({((Number(invoice.vat_rate) || 0.14) * 100).toFixed(0)}%)</span><span>{fmtAmt(invoice.vat_amount)}</span></div>
              {Number(invoice.discount) > 0 && <div className="totals-row"><span>Discount</span><span>- {fmtAmt(invoice.discount)}</span></div>}
              <div className="totals-row grand"><span>TOTAL DUE</span><span>{fmtAmt(invoice.total)}</span></div>
              {payments.length > 0 && <>
                {payments.map((p, i) => (
                  <div key={p.id} className="totals-row payment">
                    <span>Payment {i + 1} ({fmtDate(p.payment_date)})</span>
                    <span>- {fmtAmt(p.amount)}</span>
                  </div>
                ))}
                <div className="totals-row balance">
                  <span>BALANCE DUE</span>
                  <span>{balance <= 0 ? '✓ PAID' : fmtAmt(balance)}</span>
                </div>
              </>}
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Payment History</span>
            {invoice.status !== 'paid' && (
              <button className="btn btn-success btn-sm" onClick={() => setShowPayment(true)}>
                <Plus size={14} /> Record Payment
              </button>
            )}
          </div>
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.875rem' }}>
              No payments recorded yet
            </div>
          ) : (
            payments.map(p => (
              <div key={p.id} className="payment-item">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="payment-amount">{fmtAmt(p.amount)}</span>
                    <span style={{ fontSize: '0.75rem', background: 'var(--surface)', padding: '2px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>{p.payment_method}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                    {fmtDate(p.payment_date)}{p.reference ? ` · Ref: ${p.reference}` : ''}{p.notes ? ` · ${p.notes}` : ''}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deletePayment(p.id)} title="Remove payment">
                  <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                </button>
              </div>
            ))
          )}
        </div>

        {invoice.notes && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>Notes</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">💳 Record Payment</div>
            <div style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Balance remaining: </span>
              <strong style={{ color: 'var(--cyan)' }}>{fmtAmt(balance)}</strong>
            </div>
            <div className="form-grid" style={{ gap: 12 }}>
              <div className="form-group">
                <label>Amount (BWP) *</label>
                <input className="form-control" type="number" min="0.01" step="0.01" max={balance} value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" autoFocus />
              </div>
              <div className="form-group">
                <label>Payment Date</label>
                <input className="form-control" type="date" value={payForm.payment_date}
                  onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select className="form-control" value={payForm.payment_method}
                  onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                  <option>Mobile Money</option>
                  <option>Card</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reference / Receipt No.</label>
                <input className="form-control" value={payForm.reference}
                  onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input className="form-control" value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPayment(false)}>Cancel</button>
              <button className="btn btn-success" onClick={addPayment} disabled={saving}>
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmail && (
        <div className="modal-overlay" onClick={() => setShowEmail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📧 Send Invoice</div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>To</label>
              <input className="form-control" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea className="form-control" rows={7} value={emailMsg} onChange={e => setEmailMsg(e.target.value)} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              💡 Opens your email client. Download the PDF first to attach it.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEmail(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendEmail}>Open Email Client</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

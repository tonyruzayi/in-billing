import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { generateQuotePDF } from '../lib/pdfGenerator';
import { exportQuoteToExcel } from '../lib/excelExport';
import { FileDown, Mail, Edit, ArrowLeft, Receipt, FileSpreadsheet } from 'lucide-react';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data } = await supabase.from('quotations').select('*').eq('id', id).single();
    if (!data) { navigate('/quotations'); return; }
    setQuote(data);
    setEmailTo(data.client_email || '');
    setEmailMsg(`Dear ${data.client_name},\n\nPlease find attached your quotation ${data.quote_number}.\n\nKind regards,\nInformation Networking`);
  }

  async function convertToInvoice() {
    navigate(`/invoices/new/${id}`);
  }

  async function sendEmail() {
    if (!emailTo) { toast.error('Please enter an email address'); return; }
    setSending(true);
    // In production this would call a backend/edge function
    // For now we show a mailto link as fallback
    const subject = encodeURIComponent(`Quotation ${quote.quote_number} – Information Networking`);
    const body = encodeURIComponent(emailMsg);
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`);
    await supabase.from('quotations').update({ status: 'sent' }).eq('id', id);
    toast.success('Email client opened. Quotation marked as sent.');
    setSending(false);
    setShowEmail(false);
    load();
  }

  if (!quote) return <div className="splash"><div className="splash-logo">IN</div></div>;

  const fmtAmt = n => 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
  const fmtDate = d => d ? format(new Date(d), 'dd MMM yyyy') : '—';

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigate('/quotations')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">{quote.quote_number}</h1>
            <p className="page-subtitle">Quotation · {quote.client_name}</p>
          </div>
        </div>
        <div className="action-bar">
          <button className="btn btn-secondary btn-sm" onClick={() => exportQuoteToExcel(quote)}>
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => generateQuotePDF(quote)}>
            <FileDown size={15} /> PDF
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowEmail(true)}>
            <Mail size={15} /> Email
          </button>
          <Link to={`/quotations/${id}/edit`} className="btn btn-secondary btn-sm">
            <Edit size={15} /> Edit
          </Link>
          <button className="btn btn-primary btn-sm" onClick={convertToInvoice}>
            <Receipt size={15} /> Convert to Invoice
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Header card */}
        <div className="detail-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="detail-number">{quote.quote_number}</div>
            <div className="detail-meta">
              <div className="detail-meta-item">Date: <span>{fmtDate(quote.quote_date)}</span></div>
              <div className="detail-meta-item">Valid Until: <span>{fmtDate(quote.valid_until)}</span></div>
              {quote.project_ref && <div className="detail-meta-item">Ref: <span>{quote.project_ref}</span></div>}
            </div>
          </div>
          <span className={`badge badge-${quote.status || 'draft'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            {quote.status || 'draft'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--purple)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>From</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Information Networking</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              Plot 143 Seorome Ward<br />Palapye, Botswana<br />+267 76 173 945<br />info@in-networking.com
            </div>
          </div>
          <div className="card">
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Prepared For</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{quote.client_name}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {quote.client_address && <>{quote.client_address}<br /></>}
              {quote.client_city && <>{quote.client_city}, {quote.client_country}<br /></>}
              {quote.client_phone && <>{quote.client_phone}<br /></>}
              {quote.client_email}
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
                {(quote.items || []).map((it, i) => (
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
              <div className="totals-row"><span>Subtotal</span><span>{fmtAmt(quote.subtotal)}</span></div>
              <div className="totals-row"><span>VAT ({((Number(quote.vat_rate) || 0.14) * 100).toFixed(0)}%)</span><span>{fmtAmt(quote.vat_amount)}</span></div>
              {Number(quote.discount) > 0 && <div className="totals-row"><span>Discount</span><span>- {fmtAmt(quote.discount)}</span></div>}
              <div className="totals-row grand"><span>TOTAL (BWP)</span><span>{fmtAmt(quote.total)}</span></div>
            </div>
          </div>
        </div>

        {quote.notes && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 8 }}>Notes</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{quote.notes}</p>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmail && (
        <div className="modal-overlay" onClick={() => setShowEmail(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">📧 Send Quotation</div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>To</label>
              <input className="form-control" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@company.com" />
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea className="form-control" rows={6} value={emailMsg} onChange={e => setEmailMsg(e.target.value)} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
              💡 This will open your email client. Attach the PDF download manually.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEmail(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendEmail} disabled={sending}>
                {sending ? 'Opening…' : 'Open Email Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

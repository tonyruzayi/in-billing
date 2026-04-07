/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { generateQuotePDF } from '../lib/pdfGenerator';
import { exportQuoteXLSX } from '../lib/excelExport';
import LOGO from '../logoData';

const fa = n => 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
const fd = d => d ? format(new Date(d), 'dd MMM yyyy') : '—';

export default function QuoteDetail() {
  const { id } = useParams(), nav = useNavigate();
  const [quote, setQuote] = useState(null);
  const [emailModal, setEmailModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => { load(); }, [id]);

  async function load() {
    const { data } = await supabase.from('quotations').select('*').eq('id', id).single();
    if (!data) { nav('/quotations'); return; }
    setQuote(data);
    setEmailTo(data.client_email || '');
    setEmailMsg(
      'Dear ' + data.client_name + ',\n\n' +
      'Please find attached quotation ' + data.quote_number + ' for your review.\n\n' +
      'Total: BWP ' + Number(data.total).toFixed(2) + '\n' +
      'Valid until: ' + fd(data.valid_until) + '\n\n' +
      'Please do not hesitate to contact us should you require any clarification.\n\n' +
      'Kind regards,\nInformation Networking\ninfo@in-networking.com | +267 76 173 945'
    );
  }

  async function markSent() {
    await supabase.from('quotations').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', id);
    toast.success('Marked as sent'); load();
  }

  function handleEmail() {
    if (!emailTo) { toast.error('Enter recipient email'); return; }
    const sub = encodeURIComponent('Quotation ' + quote.quote_number + ' — Information Networking');
    const body = encodeURIComponent(emailMsg);
    window.open('mailto:' + emailTo + '?subject=' + sub + '&body=' + body);
    markSent();
    setEmailModal(false);
    toast.success('Email client opened — attach the PDF before sending');
  }

  if (!quote) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>
      Loading…
    </div>
  );

  return (<>
    <div className="page-hdr">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => nav('/quotations')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="page-title">{quote.quote_number}</h1>
          <p className="page-sub">Quotation · {quote.client_name}</p>
        </div>
      </div>
      {/* Desktop actions */}
      <div className="btn-row" style={{ display: 'flex' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => { generateQuotePDF(quote, LOGO); toast.success('PDF downloaded'); }}>
          📄 PDF
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => { exportQuoteXLSX(quote); toast.success('Excel downloaded'); }}>
          📊 Excel
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setEmailModal(true)}>
          📧 Email
        </button>
        <Link to={'/quotations/' + id + '/edit'} className="btn btn-secondary btn-sm">✏️ Edit</Link>
        <button className="btn btn-primary btn-sm" onClick={() => nav('/invoices/new/' + id)}>
          🧾 Invoice
        </button>
      </div>
    </div>

    <div className="page-body">
      {/* Mobile action bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}
        className="mobile-actions">
        <button className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 6px', fontSize: '.72rem' }}
          onClick={() => { generateQuotePDF(quote, LOGO); toast.success('PDF downloaded'); }}>
          📄<span>PDF</span>
        </button>
        <button className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 6px', fontSize: '.72rem' }}
          onClick={() => { exportQuoteXLSX(quote); toast.success('Excel downloaded'); }}>
          📊<span>Excel</span>
        </button>
        <button className="btn btn-secondary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 6px', fontSize: '.72rem' }}
          onClick={() => setEmailModal(true)}>
          📧<span>Email</span>
        </button>
        <button className="btn btn-primary btn-sm" style={{ flexDirection: 'column', gap: 3, padding: '10px 6px', fontSize: '.72rem' }}
          onClick={() => nav('/invoices/new/' + id)}>
          🧾<span>Invoice</span>
        </button>
      </div>

      <div className="det-hdr">
        <div>
          <div className="doc-num">{quote.quote_number}</div>
          <div className="det-meta">
            <div className="det-meta-item">Date: <span>{fd(quote.quote_date)}</span></div>
            <div className="det-meta-item">Valid: <span>{fd(quote.valid_until)}</span></div>
            {quote.project_ref && <div className="det-meta-item">Ref: <span>{quote.project_ref}</span></div>}
          </div>
        </div>
        <span className={'badge b-' + (quote.status || 'draft')} style={{ fontSize: '.8rem', padding: '5px 12px' }}>
          {quote.status || 'draft'}
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
          <div style={{ fontSize: '.66rem', fontWeight: 700, color: 'var(--cyan)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>Prepared For</div>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{quote.client_name}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.9 }}>
            {quote.client_address && <>{quote.client_address}<br /></>}
            {quote.client_city && <>{quote.client_city}, {quote.client_country}<br /></>}
            {quote.client_phone && <>{quote.client_phone}<br /></>}
            {quote.client_email}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Line Items</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>#</th><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Unit Price</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {(quote.items || []).map((it, i) => (
                <tr key={i}>
                  <td className="td-m">{i + 1}</td>
                  <td>{it.description}</td>
                  <td style={{ textAlign: 'right' }}>{it.qty}</td>
                  <td style={{ textAlign: 'right' }}>{fa(it.unit_price)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
                    {fa((Number(it.qty) || 0) * (Number(it.unit_price) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="totals-panel">
            <div className="tot-row"><span>Subtotal</span><span>{fa(quote.subtotal)}</span></div>
            <div className="tot-row"><span>VAT ({((Number(quote.vat_rate) || 0.14) * 100).toFixed(0)}%)</span><span>{fa(quote.vat_amount)}</span></div>
            {Number(quote.discount) > 0 && <div className="tot-row"><span>Discount</span><span>- {fa(quote.discount)}</span></div>}
            <div className="tot-row grand"><span>TOTAL (BWP)</span><span>{fa(quote.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Terms from template */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>Scope, Terms & Conditions</div>
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
          {'1. This quotation is valid for 30 days from the date of issue.\n2. Prices are quoted in Botswana Pula (BWP) and are inclusive of VAT at 14% where applicable.\n3. A 50% deposit is required upon acceptance of this quotation.\n4. Delivery / installation timelines will be confirmed upon receipt of deposit.\n5. This quotation does not constitute a binding contract until a purchase order is received.'}
        </div>
        {quote.notes && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Additional Notes</div>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', lineHeight: 1.7 }}>{quote.notes}</div>
          </div>
        )}
      </div>
    </div>

    {/* Email Modal */}
    {emailModal && (
      <div className="modal-overlay" onClick={() => setEmailModal(false)}>
        <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
          <div className="modal-title">📧 Send Quotation</div>
          <div className="alert alert-info" style={{ marginBottom: 14 }}>
            💡 First download the PDF, then this will open your mail client. Attach the PDF before sending.
          </div>
          <div className="fg" style={{ marginBottom: 12 }}>
            <label>To (Email Address)</label>
            <input className="fc" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="client@company.com" />
          </div>
          <div className="fg">
            <label>Message</label>
            <textarea className="fc" rows={8} value={emailMsg} onChange={e => setEmailMsg(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => { generateQuotePDF(quote, LOGO); toast.success('PDF saved — now send the email'); }}>
              📄 Download PDF
            </button>
            <button className="btn btn-primary" onClick={handleEmail}>Open Mail Client</button>
          </div>
        </div>
      </div>
    )}
  </>);
}

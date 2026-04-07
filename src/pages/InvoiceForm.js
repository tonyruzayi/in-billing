import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Trash2, Search } from 'lucide-react';

const emptyItem = () => ({ description: '', qty: 1, unit_price: 0 });

function calcTotals(items, vatRate, discount) {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
  const vatAmount = subtotal * (Number(vatRate) || 0.14);
  const total = subtotal + vatAmount - (Number(discount) || 0);
  return { subtotal, vatAmount, total };
}

async function getNextInvNumber() {
  const { data } = await supabase.from('invoices').select('invoice_number').order('created_at', { ascending: false }).limit(1);
  if (!data || data.length === 0) return 'INV-001';
  const last = data[0].invoice_number;
  const n = parseInt(last.replace('INV-', ''), 10) || 0;
  return `INV-${String(n + 1).padStart(3, '0')}`;
}

export default function InvoiceForm() {
  const { id, quoteId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    invoice_number: '',
    invoice_date: today,
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    quotation_id: quoteId || null,
    quote_number: '',
    client_name: '', client_address: '', client_city: '', client_country: 'Botswana',
    client_phone: '', client_email: '', po_ref: '',
    vat_rate: 0.14, discount: 0, status: 'unpaid', notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [showQuoteSearch, setShowQuoteSearch] = useState(false);
  const [quoteSearch, setQuoteSearch] = useState('');

  useEffect(() => {
    loadQuotes();
    if (isEdit) loadInvoice();
    else if (quoteId) loadFromQuote(quoteId);
    else getNextInvNumber().then(n => setForm(f => ({ ...f, invoice_number: n })));
  }, [id, quoteId]);

  async function loadQuotes() {
    const { data } = await supabase.from('quotations').select('id,quote_number,client_name,client_email,client_phone,client_address,client_city,client_country,items,vat_rate,discount').order('created_at', { ascending: false });
    setQuotes(data || []);
  }

  async function loadInvoice() {
    const { data } = await supabase.from('invoices').select('*').eq('id', id).single();
    if (!data) { navigate('/invoices'); return; }
    setForm({
      invoice_number: data.invoice_number, invoice_date: data.invoice_date,
      due_date: data.due_date || '', quotation_id: data.quotation_id,
      quote_number: data.quote_number || '', client_name: data.client_name,
      client_address: data.client_address || '', client_city: data.client_city || '',
      client_country: data.client_country || 'Botswana', client_phone: data.client_phone || '',
      client_email: data.client_email || '', po_ref: data.po_ref || '',
      vat_rate: data.vat_rate || 0.14, discount: data.discount || 0,
      status: data.status || 'unpaid', notes: data.notes || '',
    });
    setItems(data.items?.length ? data.items : [emptyItem()]);
  }

  async function loadFromQuote(qid) {
    const [invNum, { data: q }] = await Promise.all([
      getNextInvNumber(),
      supabase.from('quotations').select('*').eq('id', qid).single(),
    ]);
    if (!q) { navigate('/invoices/new'); return; }
    setForm(f => ({
      ...f,
      invoice_number: invNum,
      quotation_id: q.id,
      quote_number: q.quote_number,
      client_name: q.client_name, client_address: q.client_address || '',
      client_city: q.client_city || '', client_country: q.client_country || 'Botswana',
      client_phone: q.client_phone || '', client_email: q.client_email || '',
      vat_rate: q.vat_rate || 0.14, discount: q.discount || 0,
    }));
    setItems(q.items?.length ? q.items : [emptyItem()]);
  }

  function applyQuote(q) {
    setForm(f => ({
      ...f,
      quotation_id: q.id,
      quote_number: q.quote_number,
      client_name: q.client_name, client_address: q.client_address || '',
      client_city: q.client_city || '', client_country: q.client_country || 'Botswana',
      client_phone: q.client_phone || '', client_email: q.client_email || '',
      vat_rate: q.vat_rate || 0.14, discount: q.discount || 0,
    }));
    setItems(q.items?.length ? q.items : [emptyItem()]);
    setShowQuoteSearch(false);
    toast.success(`Loaded from ${q.quote_number}`);
  }

  const { subtotal, vatAmount, total } = calcTotals(items, form.vat_rate, form.discount);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setItem(i, k, v) { setItems(it => it.map((r, j) => j === i ? { ...r, [k]: v } : r)); }
  function addItem() { setItems(it => [...it, emptyItem()]); }
  function removeItem(i) { setItems(it => it.filter((_, j) => j !== i)); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const amountPaid = 0;
    const balanceDue = Math.round(total * 100) / 100;
    const payload = {
      ...form,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      discount: Number(form.discount) || 0,
      vat_rate: Number(form.vat_rate) || 0.14,
      amount_paid: isEdit ? undefined : amountPaid,
      balance_due: isEdit ? undefined : balanceDue,
      updated_at: new Date().toISOString(),
    };
    if (isEdit) {
      delete payload.amount_paid;
      delete payload.balance_due;
    }
    let error;
    if (isEdit) {
      ({ error } = await supabase.from('invoices').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('invoices').insert({ ...payload, amount_paid: 0, balance_due: balanceDue }));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Invoice updated!' : 'Invoice created!');
    navigate('/invoices');
  }

  const filteredQuotes = quotes.filter(q =>
    q.quote_number?.toLowerCase().includes(quoteSearch.toLowerCase()) ||
    q.client_name?.toLowerCase().includes(quoteSearch.toLowerCase())
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>
          <p className="page-subtitle">{form.invoice_number}</p>
        </div>
        <div className="action-bar">
          {!isEdit && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowQuoteSearch(true)}>
              <Search size={14} /> Load from Quote
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={save}>
          {/* Quote reference banner */}
          {form.quote_number && (
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: '0.85rem', color: 'var(--purple-light)' }}>
              📎 Linked to quotation <strong>{form.quote_number}</strong>
            </div>
          )}

          {/* Invoice details */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Invoice Details</div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label>Invoice Number</label>
                <input className="form-control" value={form.invoice_number} onChange={e => setField('invoice_number', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Invoice Date</label>
                <input className="form-control" type="date" value={form.invoice_date} onChange={e => setField('invoice_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input className="form-control" type="date" value={form.due_date} onChange={e => setField('due_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={e => setField('status', e.target.value)}>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div className="form-group">
                <label>PO / Reference No.</label>
                <input className="form-control" value={form.po_ref} onChange={e => setField('po_ref', e.target.value)} placeholder="Optional" />
              </div>
              <div className="form-group">
                <label>Quote Number (if any)</label>
                <input className="form-control" value={form.quote_number} onChange={e => setField('quote_number', e.target.value)} placeholder="QUO-001" />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Bill To</div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label>Client Name *</label>
                <input className="form-control" value={form.client_name} onChange={e => setField('client_name', e.target.value)} required placeholder="Company or individual name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-control" type="email" value={form.client_email} onChange={e => setField('client_email', e.target.value)} placeholder="client@company.com" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input className="form-control" value={form.client_address} onChange={e => setField('client_address', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.client_phone} onChange={e => setField('client_phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label>City / Town</label>
                <input className="form-control" value={form.client_city} onChange={e => setField('client_city', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Country</label>
                <input className="form-control" value={form.client_country} onChange={e => setField('client_country', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Line Items</div>
            <div className="table-wrap">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>#</th>
                    <th>Description</th>
                    <th style={{ width: 80 }}>Qty</th>
                    <th style={{ width: 140 }}>Unit Price (BWP)</th>
                    <th style={{ width: 140 }}>Amount (BWP)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i}>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td>
                        <input value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Item description…" style={{ width: '100%' }} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} style={{ textAlign: 'right' }} />
                      </td>
                      <td>
                        <input type="number" min="0" step="0.01" value={it.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} style={{ textAlign: 'right' }} />
                      </td>
                      <td style={{ textAlign: 'right', padding: '6px 10px', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.9rem' }}>
                        {((Number(it.qty) || 0) * (Number(it.unit_price) || 0)).toFixed(2)}
                      </td>
                      <td>
                        {items.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => removeItem(i)}>
                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 10 }}>
              <Plus size={14} /> Add Line Item
            </button>

            <div style={{ marginTop: 20 }}>
              <div className="totals-panel">
                <div className="totals-row">
                  <span>Subtotal</span><span>BWP {subtotal.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    VAT
                    <select value={form.vat_rate} onChange={e => setField('vat_rate', e.target.value)}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '2px 6px', fontSize: '0.8rem' }}>
                      <option value={0}>0%</option>
                      <option value={0.14}>14%</option>
                    </select>
                  </span>
                  <span>BWP {vatAmount.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>Discount (BWP)</span>
                  <input type="number" min="0" step="0.01" value={form.discount} onChange={e => setField('discount', e.target.value)}
                    style={{ width: 100, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '3px 8px', textAlign: 'right', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }} />
                </div>
                <div className="totals-row grand">
                  <span>TOTAL DUE (BWP)</span><span>{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="section-title">Notes</div>
            <div className="form-group">
              <textarea className="form-control" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Payment instructions, additional notes…" />
            </div>
          </div>
        </form>
      </div>

      {/* Quote search modal */}
      {showQuoteSearch && (
        <div className="modal-overlay" onClick={() => setShowQuoteSearch(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">🔍 Load from Quotation</div>
            <div className="search-bar" style={{ width: '100%', marginBottom: 16 }}>
              <Search size={16} />
              <input placeholder="Search by quote number or client…" value={quoteSearch} onChange={e => setQuoteSearch(e.target.value)} autoFocus />
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {filteredQuotes.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No quotations found</div>
              ) : (
                filteredQuotes.map(q => (
                  <div key={q.id} onClick={() => applyQuote(q)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', marginBottom: 6, background: 'var(--surface2)', border: '1px solid var(--border)', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--purple)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{q.quote_number}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{q.client_name}</div>
                    </div>
                    <span className="btn btn-primary btn-sm">Select</span>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowQuoteSearch(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

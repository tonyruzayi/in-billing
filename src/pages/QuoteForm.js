import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';

const emptyItem = () => ({ description: '', qty: 1, unit_price: 0 });

function calcTotals(items, vatRate, discount) {
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
  const vatAmount = subtotal * (Number(vatRate) || 0.14);
  const total = subtotal + vatAmount - (Number(discount) || 0);
  return { subtotal, vatAmount, total };
}

async function getNextQuoteNumber() {
  const { data } = await supabase.from('quotations').select('quote_number').order('created_at', { ascending: false }).limit(1);
  if (!data || data.length === 0) return 'QUO-001';
  const last = data[0].quote_number;
  const n = parseInt(last.replace('QUO-', ''), 10) || 0;
  return `QUO-${String(n + 1).padStart(3, '0')}`;
}

export default function QuoteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    quote_number: '',
    quote_date: today,
    valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    client_name: '', client_address: '', client_city: '', client_country: 'Botswana',
    client_phone: '', client_email: '', project_ref: '',
    vat_rate: 0.14, discount: 0, status: 'draft', notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) loadQuote();
    else getNextQuoteNumber().then(n => setForm(f => ({ ...f, quote_number: n })));
  }, [id]);

  async function loadQuote() {
    const { data } = await supabase.from('quotations').select('*').eq('id', id).single();
    if (!data) { navigate('/quotations'); return; }
    setForm({
      quote_number: data.quote_number, quote_date: data.quote_date,
      valid_until: data.valid_until || '', client_name: data.client_name,
      client_address: data.client_address || '', client_city: data.client_city || '',
      client_country: data.client_country || 'Botswana', client_phone: data.client_phone || '',
      client_email: data.client_email || '', project_ref: data.project_ref || '',
      vat_rate: data.vat_rate || 0.14, discount: data.discount || 0,
      status: data.status || 'draft', notes: data.notes || '',
    });
    setItems(data.items?.length ? data.items : [emptyItem()]);
  }

  const { subtotal, vatAmount, total } = calcTotals(items, form.vat_rate, form.discount);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function setItem(i, k, v) { setItems(it => it.map((r, j) => j === i ? { ...r, [k]: v } : r)); }
  function addItem() { setItems(it => [...it, emptyItem()]); }
  function removeItem(i) { setItems(it => it.filter((_, j) => j !== i)); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      discount: Number(form.discount) || 0,
      vat_rate: Number(form.vat_rate) || 0.14,
      updated_at: new Date().toISOString(),
    };
    let error;
    if (isEdit) {
      ({ error } = await supabase.from('quotations').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('quotations').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(isEdit ? 'Quotation updated!' : 'Quotation created!');
    navigate('/quotations');
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Quotation' : 'New Quotation'}</h1>
          <p className="page-subtitle">{form.quote_number}</p>
        </div>
        <div className="action-bar">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Quotation' : 'Create Quotation'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <form onSubmit={save}>
          {/* Header info */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Quote Details</div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label>Quote Number</label>
                <input className="form-control" value={form.quote_number} onChange={e => setField('quote_number', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Quote Date</label>
                <input className="form-control" type="date" value={form.quote_date} onChange={e => setField('quote_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Valid Until</label>
                <input className="form-control" type="date" value={form.valid_until} onChange={e => setField('valid_until', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select className="form-control" value={form.status} onChange={e => setField('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="form-group">
                <label>Project / Reference</label>
                <input className="form-control" value={form.project_ref} onChange={e => setField('project_ref', e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-title">Client Information</div>
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
                <input className="form-control" value={form.client_address} onChange={e => setField('client_address', e.target.value)} placeholder="Street / Plot number" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-control" value={form.client_phone} onChange={e => setField('client_phone', e.target.value)} placeholder="+267 xx xxx xxx" />
              </div>
              <div className="form-group">
                <label>City / Town</label>
                <input className="form-control" value={form.client_city} onChange={e => setField('client_city', e.target.value)} placeholder="Gaborone" />
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
                        <input
                          value={it.description}
                          onChange={e => setItem(i, 'description', e.target.value)}
                          placeholder="Item description…"
                          style={{ width: '100%' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number" min="0" step="0.01"
                          value={it.qty}
                          onChange={e => setItem(i, 'qty', e.target.value)}
                          style={{ textAlign: 'right' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number" min="0" step="0.01"
                          value={it.unit_price}
                          onChange={e => setItem(i, 'unit_price', e.target.value)}
                          style={{ textAlign: 'right' }}
                        />
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

            {/* Totals */}
            <div style={{ marginTop: 20 }}>
              <div className="totals-panel">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>BWP {subtotal.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    VAT
                    <select
                      value={form.vat_rate}
                      onChange={e => setField('vat_rate', e.target.value)}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '2px 6px', fontSize: '0.8rem' }}
                    >
                      <option value={0}>0%</option>
                      <option value={0.14}>14%</option>
                    </select>
                  </span>
                  <span>BWP {vatAmount.toFixed(2)}</span>
                </div>
                <div className="totals-row">
                  <span>Discount (BWP)</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.discount}
                    onChange={e => setField('discount', e.target.value)}
                    style={{ width: 100, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '3px 8px', textAlign: 'right', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}
                  />
                </div>
                <div className="totals-row grand">
                  <span>TOTAL (BWP)</span>
                  <span>{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="section-title">Notes</div>
            <div className="form-group">
              <textarea className="form-control" rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Additional notes or terms…" />
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

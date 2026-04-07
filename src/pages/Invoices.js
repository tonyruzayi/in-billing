import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
  }

  async function deleteInvoice(id, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this invoice?')) return;
    await supabase.from('payments').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Invoice deleted');
    load();
  }

  const filtered = invoices.filter(inv => {
    const matchSearch =
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.po_ref?.toLowerCase().includes(search.toLowerCase()) ||
      inv.quote_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const fmtAmt = n => 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
  const fmtDate = d => d ? format(new Date(d), 'dd MMM yyyy') : '—';

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="action-bar">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder="Search invoices…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 12px', color: 'var(--text)', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif' }}
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <Link to="/invoices/new" className="btn btn-primary">
            <Plus size={16} /> New Invoice
          </Link>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>{search ? 'No results found' : 'No invoices yet'}</h3>
              <p>{search ? 'Try a different search or filter' : 'Create your first invoice'}</p>
              {!search && <Link to="/invoices/new" className="btn btn-primary" style={{ marginTop: 16 }}>+ New Invoice</Link>}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Client</th>
                    <th>Quote Ref.</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/invoices/${inv.id}`)}>
                      <td><Link to={`/invoices/${inv.id}`} onClick={e => e.stopPropagation()}>{inv.invoice_number}</Link></td>
                      <td>{inv.client_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{inv.quote_number || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fmtDate(inv.invoice_date)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{fmtDate(inv.due_date)}</td>
                      <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmtAmt(inv.total)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmtAmt(inv.amount_paid)}</td>
                      <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: Number(inv.balance_due) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                        {fmtAmt(inv.balance_due)}
                      </td>
                      <td><span className={`badge badge-${inv.status || 'unpaid'}`}>{inv.status || 'unpaid'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <Link to={`/invoices/${inv.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="Edit">✏️</Link>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={e => deleteInvoice(inv.id, e)} title="Delete">
                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

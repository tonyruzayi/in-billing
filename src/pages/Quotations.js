import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2 } from 'lucide-react';

export default function Quotations() {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
    setQuotes(data || []);
  }

  async function deleteQuote(id, e) {
    e.stopPropagation();
    if (!window.confirm('Delete this quotation?')) return;
    const { error } = await supabase.from('quotations').delete().eq('id', id);
    if (error) { toast.error('Delete failed'); return; }
    toast.success('Quotation deleted');
    load();
  }

  const filtered = quotes.filter(q =>
    q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
    q.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.project_ref?.toLowerCase().includes(search.toLowerCase())
  );

  function fmtAmt(n) {
    return 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">{filtered.length} quotation{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="action-bar">
          <div className="search-bar">
            <Search size={16} />
            <input placeholder="Search quotes…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Link to="/quotations/new" className="btn btn-primary">
            <Plus size={16} /> New Quotation
          </Link>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Search size={48} />
              <h3>{search ? 'No results found' : 'No quotations yet'}</h3>
              <p>{search ? 'Try a different search term' : 'Create your first quotation to get started'}</p>
              {!search && <Link to="/quotations/new" className="btn btn-primary" style={{ marginTop: 16 }}>+ New Quotation</Link>}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Quote No.</th>
                    <th>Client</th>
                    <th>Project / Ref</th>
                    <th>Date</th>
                    <th>Valid Until</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr key={q.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/quotations/${q.id}`)}>
                      <td><Link to={`/quotations/${q.id}`} onClick={e => e.stopPropagation()}>{q.quote_number}</Link></td>
                      <td>{q.client_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{q.project_ref || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {q.quote_date ? format(new Date(q.quote_date), 'dd MMM yyyy') : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {q.valid_until ? format(new Date(q.valid_until), 'dd MMM yyyy') : '—'}
                      </td>
                      <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmtAmt(q.total)}</td>
                      <td><span className={`badge badge-${q.status || 'draft'}`}>{q.status || 'draft'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <Link to={`/quotations/${q.id}/edit`} className="btn btn-ghost btn-sm btn-icon" title="Edit">✏️</Link>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={e => deleteQuote(q.id, e)} title="Delete">
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

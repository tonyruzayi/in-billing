import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { FileText, Receipt, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ quotes: 0, invoices: 0, totalInvoiced: 0, outstanding: 0 });
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: quotes }, { data: invoices }] = await Promise.all([
      supabase.from('quotations').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    const allInvoices = invoices || [];
    const totalInvoiced = allInvoices.reduce((s, i) => s + Number(i.total || 0), 0);
    const outstanding = allInvoices
      .filter(i => i.status !== 'paid')
      .reduce((s, i) => s + Number(i.balance_due || i.total || 0), 0);

    setStats({
      quotes: quotes?.length || 0,
      invoices: allInvoices.length,
      totalInvoiced,
      outstanding,
    });
    setRecentQuotes(quotes || []);
    setRecentInvoices(allInvoices);
  }

  function fmtAmt(n) {
    return 'BWP ' + Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 });
  }

  function statusBadge(s) {
    return <span className={`badge badge-${s || 'draft'}`}>{s || 'draft'}</span>;
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="action-bar">
          <Link to="/quotations/new" className="btn btn-secondary btn-sm">+ New Quote</Link>
          <Link to="/invoices/new" className="btn btn-primary btn-sm">+ New Invoice</Link>
        </div>
      </div>

      <div className="page-body">
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <div className="stat-card purple">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">Quotations</div>
                <div className="stat-value">{stats.quotes}</div>
                <div className="stat-sub">total raised</div>
              </div>
              <FileText size={24} style={{ color: 'var(--purple)', opacity: 0.6 }} />
            </div>
          </div>
          <div className="stat-card cyan">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">Invoices</div>
                <div className="stat-value">{stats.invoices}</div>
                <div className="stat-sub">total issued</div>
              </div>
              <Receipt size={24} style={{ color: 'var(--cyan)', opacity: 0.6 }} />
            </div>
          </div>
          <div className="stat-card success">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">Total Invoiced</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{fmtAmt(stats.totalInvoiced)}</div>
                <div className="stat-sub">all invoices</div>
              </div>
              <TrendingUp size={24} style={{ color: 'var(--success)', opacity: 0.6 }} />
            </div>
          </div>
          <div className="stat-card warning">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-label">Outstanding</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{fmtAmt(stats.outstanding)}</div>
                <div className="stat-sub">balance due</div>
              </div>
              <Clock size={24} style={{ color: 'var(--warning)', opacity: 0.6 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Quotations</span>
              <Link to="/quotations" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {recentQuotes.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>No quotations yet</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Client</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentQuotes.map(q => (
                      <tr key={q.id}>
                        <td><Link to={`/quotations/${q.id}`}>{q.quote_number}</Link></td>
                        <td>{q.client_name}</td>
                        <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{fmtAmt(q.total)}</td>
                        <td>{statusBadge(q.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Invoices</span>
              <Link to="/invoices" className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
                View all <ArrowRight size={14} />
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>No invoices yet</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Client</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td><Link to={`/invoices/${inv.id}`}>{inv.invoice_number}</Link></td>
                        <td>{inv.client_name}</td>
                        <td style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: Number(inv.balance_due) > 0 ? 'var(--warning)' : 'var(--success)' }}>
                          {fmtAmt(inv.balance_due)}
                        </td>
                        <td>{statusBadge(inv.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

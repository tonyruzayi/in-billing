/* eslint-disable react-hooks/exhaustive-deps */
import React,{useState,useEffect} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {format} from 'date-fns';

const fa=n=>'BWP '+Number(n||0).toLocaleString('en-BW',{minimumFractionDigits:2});
const Badge=({s})=><span className={`badge b-${s||'draft'}`}>{s||'draft'}</span>;

export default function Dashboard(){
  const [stats,setStats]=useState({quotes:0,invoices:0,total:0,outstanding:0,paid:0,clients:0});
  const [rq,setRq]=useState([]);const [ri,setRi]=useState([]);const [loading,setLoading]=useState(true);

  useEffect(()=>{load();},[]);
  async function load(){
    const [{data:q},{data:inv},{data:cli}]=await Promise.all([
      supabase.from('quotations').select('*').order('created_at',{ascending:false}).limit(6),
      supabase.from('invoices').select('*').order('created_at',{ascending:false}).limit(6),
      supabase.from('clients').select('id',{count:'exact',head:true}),
    ]);
    const all=inv||[];
    const total=all.reduce((s,i)=>s+Number(i.total||0),0);
    const paid=all.filter(i=>i.status==='paid').reduce((s,i)=>s+Number(i.total||0),0);
    const outstanding=all.filter(i=>i.status!=='paid'&&i.status!=='cancelled').reduce((s,i)=>s+Number(i.balance_due||i.total||0),0);
    setStats({quotes:(q||[]).length,invoices:all.length,total,outstanding,paid,clients:cli?.count||0});
    setRq(q||[]);setRi(all);setLoading(false);
  }

  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'50vh',color:'var(--muted)'}}>Loading…</div>;

  return(<>
    <div className="page-hdr">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">{format(new Date(),'EEEE, d MMMM yyyy')}</p>
      </div>
      <div className="btn-row">
        <Link to="/quotations/new" className="btn btn-secondary btn-sm">+ New Quote</Link>
        <Link to="/invoices/new" className="btn btn-primary btn-sm">+ New Invoice</Link>
      </div>
    </div>
    <div className="page-body">
      <div className="stat-grid" style={{marginBottom:20}}>
        <div className="stat-card purple"><div className="stat-lbl">Quotations</div><div className="stat-val">{stats.quotes}</div><div className="stat-sub">total raised</div></div>
        <div className="stat-card cyan"><div className="stat-lbl">Invoices</div><div className="stat-val">{stats.invoices}</div><div className="stat-sub">total issued</div></div>
        <div className="stat-card ok"><div className="stat-lbl">Total Invoiced</div><div className="stat-val sm">{fa(stats.total)}</div></div>
        <div className="stat-card warn"><div className="stat-lbl">Outstanding</div><div className="stat-val sm" style={{color:'var(--warn)'}}>{fa(stats.outstanding)}</div></div>
        <div className="stat-card ok"><div className="stat-lbl">Collected</div><div className="stat-val sm" style={{color:'var(--ok)'}}>{fa(stats.paid)}</div></div>
        <div className="stat-card purple"><div className="stat-lbl">Clients</div><div className="stat-val">{stats.clients}</div><div className="stat-sub">registered</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(380px,1fr))',gap:16}}>
        <div className="card">
          <div className="card-hdr"><span className="card-title">Recent Quotations</span><Link to="/quotations" className="btn btn-ghost btn-xs">View all →</Link></div>
          {rq.length===0?<div className="empty"><p>No quotations yet</p></div>:<div className="tbl-wrap"><table>
            <thead><tr><th>Number</th><th>Client</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>{rq.map(q=><tr key={q.id}><td><Link to={`/quotations/${q.id}`}>{q.quote_number}</Link></td><td className="td-m">{q.client_name}</td><td className="td-num">{fa(q.total)}</td><td><Badge s={q.status}/></td></tr>)}</tbody>
          </table></div>}
        </div>
        <div className="card">
          <div className="card-hdr"><span className="card-title">Recent Invoices</span><Link to="/invoices" className="btn btn-ghost btn-xs">View all →</Link></div>
          {ri.length===0?<div className="empty"><p>No invoices yet</p></div>:<div className="tbl-wrap"><table>
            <thead><tr><th>Number</th><th>Client</th><th>Balance</th><th>Status</th></tr></thead>
            <tbody>{ri.map(i=><tr key={i.id}><td><Link to={`/invoices/${i.id}`}>{i.invoice_number}</Link></td><td className="td-m">{i.client_name}</td><td className="td-num" style={{color:Number(i.balance_due)>0?'var(--warn)':'var(--ok)'}}>{fa(i.balance_due)}</td><td><Badge s={i.status}/></td></tr>)}</tbody>
          </table></div>}
        </div>
      </div>
    </div>
  </>);
}

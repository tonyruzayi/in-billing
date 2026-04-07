import React,{useState,useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {format} from 'date-fns';
import toast from 'react-hot-toast';
const fa=n=>'BWP '+Number(n||0).toLocaleString('en-BW',{minimumFractionDigits:2});
export default function Invoices(){
  const [invoices,setInvoices]=useState([]);const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const nav=useNavigate();
  useEffect(()=>{load();},[]);
  async function load(){const{data}=await supabase.from('invoices').select('*').order('created_at',{ascending:false});setInvoices(data||[]);}
  async function del(id,e){e.stopPropagation();if(!window.confirm('Delete this invoice?'))return;await supabase.from('payments').delete().eq('invoice_id',id);const{error}=await supabase.from('invoices').delete().eq('id',id);if(error){toast.error(error.message);return;}toast.success('Deleted');load();}
  const filtered=invoices.filter(i=>{
    const ms=i.invoice_number?.toLowerCase().includes(search.toLowerCase())||i.client_name?.toLowerCase().includes(search.toLowerCase())||i.po_ref?.toLowerCase().includes(search.toLowerCase())||i.quote_number?.toLowerCase().includes(search.toLowerCase());
    return ms&&(status==='all'||i.status===status);
  });
  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">Invoices</h1><p className="page-sub">{filtered.length} invoice{filtered.length!==1?'s':''}</p></div>
      <div className="btn-row">
        <div className="search-bar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="fc" style={{width:'auto'}} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select>
        <Link to="/invoices/new" className="btn btn-primary">+ New Invoice</Link>
      </div>
    </div>
    <div className="page-body">
      <div className="card" style={{padding:0}}>
        {filtered.length===0?<div className="empty"><p>{search?'No results':'No invoices yet'}</p>{!search&&<Link to="/invoices/new" className="btn btn-primary" style={{marginTop:14}}>+ New Invoice</Link>}</div>:
        <div className="tbl-wrap"><table>
          <thead><tr><th>Invoice No.</th><th>Client</th><th>Quote Ref</th><th>Date</th><th>Due</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map(i=><tr key={i.id} style={{cursor:'pointer'}} onClick={()=>nav(`/invoices/${i.id}`)}>
            <td><Link to={`/invoices/${i.id}`} onClick={e=>e.stopPropagation()} className="td-num">{i.invoice_number}</Link></td>
            <td style={{fontWeight:500}}>{i.client_name}</td>
            <td className="td-m">{i.quote_number||'—'}</td>
            <td className="td-m">{i.invoice_date?format(new Date(i.invoice_date),'dd MMM yy'):'—'}</td>
            <td className="td-m">{i.due_date?format(new Date(i.due_date),'dd MMM yy'):'—'}</td>
            <td className="td-num">{fa(i.total)}</td>
            <td style={{color:'var(--ok)',fontWeight:600}}>{fa(i.amount_paid)}</td>
            <td className="td-num" style={{color:Number(i.balance_due)>0?'var(--warn)':'var(--ok)'}}>{fa(i.balance_due)}</td>
            <td><span className={`badge b-${i.status||'unpaid'}`}>{i.status||'unpaid'}</span></td>
            <td onClick={e=>e.stopPropagation()}><div className="btn-row"><Link to={`/invoices/${i.id}/edit`} className="btn btn-ghost btn-icon btn-xs">✏️</Link><button className="btn btn-ghost btn-icon btn-xs" onClick={e=>del(i.id,e)}>🗑️</button></div></td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </div>
  </>);
}

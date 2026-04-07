import React,{useState,useEffect} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {format} from 'date-fns';
import toast from 'react-hot-toast';
const fa=n=>'BWP '+Number(n||0).toLocaleString('en-BW',{minimumFractionDigits:2});
export default function Quotations(){
  const [quotes,setQuotes]=useState([]);const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const nav=useNavigate();
  useEffect(()=>{load();},[]);
  async function load(){const{data}=await supabase.from('quotations').select('*').order('created_at',{ascending:false});setQuotes(data||[]);}
  async function del(id,e){e.stopPropagation();if(!window.confirm('Delete this quotation?'))return;const{error}=await supabase.from('quotations').delete().eq('id',id);if(error){toast.error(error.message);return;}toast.success('Deleted');load();}
  const filtered=quotes.filter(q=>{
    const ms=q.quote_number?.toLowerCase().includes(search.toLowerCase())||q.client_name?.toLowerCase().includes(search.toLowerCase())||q.project_ref?.toLowerCase().includes(search.toLowerCase());
    return ms&&(status==='all'||q.status===status);
  });
  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">Quotations</h1><p className="page-sub">{filtered.length} quotation{filtered.length!==1?'s':''}</p></div>
      <div className="btn-row">
        <div className="search-bar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="fc" style={{width:'auto'}} value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option><option value="expired">Expired</option></select>
        <Link to="/quotations/new" className="btn btn-primary">+ New Quote</Link>
      </div>
    </div>
    <div className="page-body">
      <div className="card" style={{padding:0}}>
        {filtered.length===0?<div className="empty"><p>{search?'No results':'No quotations yet'}</p>{!search&&<Link to="/quotations/new" className="btn btn-primary" style={{marginTop:14}}>+ New Quotation</Link>}</div>:
        <div className="tbl-wrap"><table>
          <thead><tr><th>Quote No.</th><th>Client</th><th>Ref</th><th>Date</th><th>Valid Until</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>{filtered.map(q=><tr key={q.id} style={{cursor:'pointer'}} onClick={()=>nav(`/quotations/${q.id}`)}>
            <td><Link to={`/quotations/${q.id}`} onClick={e=>e.stopPropagation()} className="td-num">{q.quote_number}</Link></td>
            <td style={{fontWeight:500}}>{q.client_name}</td>
            <td className="td-m">{q.project_ref||'—'}</td>
            <td className="td-m">{q.quote_date?format(new Date(q.quote_date),'dd MMM yy'):'—'}</td>
            <td className="td-m">{q.valid_until?format(new Date(q.valid_until),'dd MMM yy'):'—'}</td>
            <td className="td-num">{fa(q.total)}</td>
            <td><span className={`badge b-${q.status||'draft'}`}>{q.status||'draft'}</span></td>
            <td onClick={e=>e.stopPropagation()}><div className="btn-row"><Link to={`/quotations/${q.id}/edit`} className="btn btn-ghost btn-icon btn-xs">✏️</Link><button className="btn btn-ghost btn-icon btn-xs" onClick={e=>del(q.id,e)}>🗑️</button></div></td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </div>
  </>);
}

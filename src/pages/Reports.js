/* eslint-disable react-hooks/exhaustive-deps */
import React,{useState,useEffect} from 'react';
import {supabase} from '../lib/supabase';
import {format,subMonths,startOfMonth,endOfMonth} from 'date-fns';
import * as XLSX from 'xlsx';
const fa=n=>'BWP '+Number(n||0).toLocaleString('en-BW',{minimumFractionDigits:2});
export default function Reports(){
  const [tab,setTab]=useState('summary');
  const [from,setFrom]=useState(format(startOfMonth(subMonths(new Date(),2)),'yyyy-MM-dd'));
  const [to,setTo]=useState(format(endOfMonth(new Date()),'yyyy-MM-dd'));
  const [data,setData]=useState({invoices:[],quotes:[],payments:[]});
  const [loading,setLoading]=useState(false);

  useEffect(()=>{load();},[from,to]);
  async function load(){
    setLoading(true);
    const [{data:inv},{data:q},{data:pay}]=await Promise.all([
      supabase.from('invoices').select('*').gte('invoice_date',from).lte('invoice_date',to).order('invoice_date'),
      supabase.from('quotations').select('*').gte('quote_date',from).lte('quote_date',to).order('quote_date'),
      supabase.from('payments').select('*').gte('payment_date',from).lte('payment_date',to).order('payment_date'),
    ]);
    setData({invoices:inv||[],quotes:q||[],payments:pay||[]});setLoading(false);
  }

  const totalInvoiced=data.invoices.reduce((s,i)=>s+Number(i.total||0),0);
  const totalPaid=data.payments.reduce((s,p)=>s+Number(p.amount||0),0);
  const outstanding=data.invoices.filter(i=>i.status!=='paid'&&i.status!=='cancelled').reduce((s,i)=>s+Number(i.balance_due||0),0);
  const totalQuoted=data.quotes.reduce((s,q)=>s+Number(q.total||0),0);
  const conversionRate=data.quotes.length>0?((data.quotes.filter(q=>q.status==='accepted').length/data.quotes.length)*100).toFixed(0):0;

  function exportReport(){
    const wb=XLSX.utils.book_new();
    // Summary
    const sumData=[['Information Networking - Billing Report'],['Period:',from+' to '+to],[],['INVOICES'],['Invoice No.','Client','Date','Total','Paid','Balance','Status'],...data.invoices.map(i=>[i.invoice_number,i.client_name,i.invoice_date,Number(i.total).toFixed(2),Number(i.amount_paid).toFixed(2),Number(i.balance_due).toFixed(2),i.status]),[]
    ,['TOTAL INVOICED','','',totalInvoiced.toFixed(2)],['TOTAL COLLECTED','','',totalPaid.toFixed(2)],['OUTSTANDING','','',outstanding.toFixed(2)],[]
    ,['QUOTATIONS'],['Quote No.','Client','Date','Total','Status'],...data.quotes.map(q=>[q.quote_number,q.client_name,q.quote_date,Number(q.total).toFixed(2),q.status])];
    const ws=XLSX.utils.aoa_to_sheet(sumData);ws['!cols']=[{wch:14},{wch:28},{wch:12},{wch:14},{wch:14},{wch:14},{wch:10}];
    XLSX.utils.book_append_sheet(wb,ws,'Report');
    XLSX.writeFile(wb,'IN_Report_'+from+'_to_'+to+'.xlsx');
  }

  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">Reports</h1><p className="page-sub">Business performance overview</p></div>
      <div className="btn-row">
        <input className="fc" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{width:'auto'}}/>
        <span style={{color:'var(--muted)',fontSize:'.82rem'}}>to</span>
        <input className="fc" type="date" value={to} onChange={e=>setTo(e.target.value)} style={{width:'auto'}}/>
        <button className="btn btn-ok btn-sm" onClick={exportReport}>📊 Export Excel</button>
      </div>
    </div>
    <div className="page-body">
      <div className="stat-grid" style={{marginBottom:20}}>
        <div className="stat-card purple"><div className="stat-lbl">Total Invoiced</div><div className="stat-val sm">{fa(totalInvoiced)}</div><div className="stat-sub">{data.invoices.length} invoices</div></div>
        <div className="stat-card ok"><div className="stat-lbl">Collected</div><div className="stat-val sm" style={{color:'var(--ok)'}}>{fa(totalPaid)}</div></div>
        <div className="stat-card warn"><div className="stat-lbl">Outstanding</div><div className="stat-val sm" style={{color:'var(--warn)'}}>{fa(outstanding)}</div></div>
        <div className="stat-card cyan"><div className="stat-lbl">Total Quoted</div><div className="stat-val sm">{fa(totalQuoted)}</div><div className="stat-sub">{data.quotes.length} quotations</div></div>
        <div className="stat-card ok"><div className="stat-lbl">Conversion Rate</div><div className="stat-val">{conversionRate}%</div><div className="stat-sub">quotes accepted</div></div>
      </div>

      <div className="tabs">
        {['summary','invoices','quotes','payments'].map(t=><button key={t} className={'tab'+(tab===t?' active':'')} onClick={()=>setTab(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>)}
      </div>

      {loading?<div style={{textAlign:'center',color:'var(--muted)',padding:40}}>Loading…</div>:<>

      {tab==='summary'&&<div style={{display:'grid',gap:16}}>
        <div className="card"><div className="card-title" style={{marginBottom:12}}>Invoice Status Breakdown</div>
          {['unpaid','partial','paid','overdue','cancelled'].map(s=>{const cnt=data.invoices.filter(i=>i.status===s).length;const tot=data.invoices.filter(i=>i.status===s).reduce((a,i)=>a+Number(i.total),0);return cnt>0&&<div key={s} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
            <span className={`badge b-${s}`}>{s}</span><span style={{fontFamily:'Syne,sans-serif',fontWeight:700}}>{cnt} · {fa(tot)}</span></div>;})}
        </div>
        <div className="card"><div className="card-title" style={{marginBottom:12}}>Top Clients by Revenue</div>
          {Object.entries(data.invoices.reduce((acc,i)=>{acc[i.client_name]=(acc[i.client_name]||0)+Number(i.total);return acc;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,total])=><div key={name} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--border)'}}><span style={{fontSize:'.84rem'}}>{name}</span><span style={{fontFamily:'Syne,sans-serif',fontWeight:700}}>{fa(total)}</span></div>)}
        </div>
      </div>}

      {tab==='invoices'&&<div className="card" style={{padding:0}}><div className="tbl-wrap"><table>
        <thead><tr><th>Invoice No.</th><th>Client</th><th>Date</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
        <tbody>{data.invoices.map(i=><tr key={i.id}><td className="td-num">{i.invoice_number}</td><td>{i.client_name}</td><td className="td-m">{i.invoice_date?format(new Date(i.invoice_date),'dd MMM yyyy'):'—'}</td><td className="td-num">{fa(i.total)}</td><td style={{color:'var(--ok)',fontWeight:600}}>{fa(i.amount_paid)}</td><td style={{color:Number(i.balance_due)>0?'var(--warn)':'var(--ok)',fontWeight:700}}>{fa(i.balance_due)}</td><td><span className={`badge b-${i.status}`}>{i.status}</span></td></tr>)}
        {data.invoices.length===0&&<tr><td colSpan={7} style={{textAlign:'center',color:'var(--muted)',padding:30}}>No invoices in this period</td></tr>}</tbody>
      </table></div></div>}

      {tab==='quotes'&&<div className="card" style={{padding:0}}><div className="tbl-wrap"><table>
        <thead><tr><th>Quote No.</th><th>Client</th><th>Date</th><th>Valid Until</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>{data.quotes.map(q=><tr key={q.id}><td className="td-num">{q.quote_number}</td><td>{q.client_name}</td><td className="td-m">{q.quote_date?format(new Date(q.quote_date),'dd MMM yyyy'):'—'}</td><td className="td-m">{q.valid_until?format(new Date(q.valid_until),'dd MMM yyyy'):'—'}</td><td className="td-num">{fa(q.total)}</td><td><span className={`badge b-${q.status}`}>{q.status}</span></td></tr>)}
        {data.quotes.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:'var(--muted)',padding:30}}>No quotations in this period</td></tr>}</tbody>
      </table></div></div>}

      {tab==='payments'&&<div className="card" style={{padding:0}}><div className="tbl-wrap"><table>
        <thead><tr><th>Date</th><th>Invoice</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
        <tbody>{data.payments.map(p=><tr key={p.id}><td className="td-m">{p.payment_date?format(new Date(p.payment_date),'dd MMM yyyy'):'—'}</td><td className="td-m">{p.invoice_id}</td><td className="td-m">{p.payment_method||'—'}</td><td className="td-m">{p.reference||'—'}</td><td className="td-num" style={{color:'var(--ok)'}}>{fa(p.amount)}</td></tr>)}
        {data.payments.length===0&&<tr><td colSpan={5} style={{textAlign:'center',color:'var(--muted)',padding:30}}>No payments in this period</td></tr>}</tbody>
      </table></div></div>}
      </>}
    </div>
  </>);
}

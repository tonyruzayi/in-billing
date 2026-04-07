import React,{useState,useEffect,useCallback} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {supabase} from '../lib/supabase';
import {format,addDays} from 'date-fns';
import toast from 'react-hot-toast';

const today=format(new Date(),'yyyy-MM-dd');
const emptyItem=()=>({description:'',qty:1,unit_price:0});

function calcTotals(items,vatRate,discount){
  const sub=items.reduce((s,it)=>s+(Number(it.qty)||0)*(Number(it.unit_price)||0),0);
  const vat=sub*(Number(vatRate)||0.14);
  return{subtotal:sub,vatAmount:vat,total:sub+vat-(Number(discount)||0)};
}

async function nextNum(table,field,prefix){
  const{data}=await supabase.from(table).select(field).order('created_at',{ascending:false}).limit(1);
  if(!data||!data.length)return prefix+'-001';
  const n=parseInt((data[0][field]||'').replace(prefix+'-',''))||0;
  return prefix+'-'+String(n+1).padStart(3,'0');
}

export default function InvoiceForm(){
  const{id,quoteId}=useParams(),nav=useNavigate(),isEdit=Boolean(id);
  const[form,setForm]=useState({invoice_number:'',invoice_date:today,due_date:format(addDays(new Date(),30),'yyyy-MM-dd'),quotation_id:null,quote_number:'',client_name:'',client_address:'',client_city:'',client_country:'Botswana',client_phone:'',client_email:'',po_ref:'',vat_rate:0.14,discount:0,status:'unpaid',notes:''});
  const[items,setItems]=useState([emptyItem()]);
  const[saving,setSaving]=useState(false);
  const[clients,setClients]=useState([]);
  const[catalog,setCatalog]=useState([]);
  const[quotes,setQuotes]=useState([]);
  const[clientSearch,setClientSearch]=useState('');
  const[showClients,setShowClients]=useState(false);
  const[showQuotes,setShowQuotes]=useState(false);
  const[quoteSearch,setQuoteSearch]=useState('');

  const loadLists=useCallback(async()=>{
    const[{data:cls},{data:cat},{data:qs}]=await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('catalog_items').select('*').order('name'),
      supabase.from('quotations').select('*').order('created_at',{ascending:false}),
    ]);
    setClients(cls||[]);setCatalog(cat||[]);setQuotes(qs||[]);
  },[]);

  useEffect(()=>{
    loadLists();
    if(isEdit) loadInvoice();
    else if(quoteId) loadFromQuote(quoteId);
    else nextNum('invoices','invoice_number','INV').then(n=>setForm(f=>({...f,invoice_number:n})));
  },[id,quoteId]);

  async function loadInvoice(){
    const{data}=await supabase.from('invoices').select('*').eq('id',id).single();
    if(!data){nav('/invoices');return;}
    setForm({invoice_number:data.invoice_number,invoice_date:data.invoice_date,due_date:data.due_date||'',quotation_id:data.quotation_id,quote_number:data.quote_number||'',client_name:data.client_name,client_address:data.client_address||'',client_city:data.client_city||'',client_country:data.client_country||'Botswana',client_phone:data.client_phone||'',client_email:data.client_email||'',po_ref:data.po_ref||'',vat_rate:data.vat_rate||0.14,discount:data.discount||0,status:data.status||'unpaid',notes:data.notes||''});
    setItems(data.items?.length?data.items:[emptyItem()]);
  }

  async function loadFromQuote(qid){
    const[invNum,{data:q}]=await Promise.all([nextNum('invoices','invoice_number','INV'),supabase.from('quotations').select('*').eq('id',qid).single()]);
    if(!q){nav('/invoices/new');return;}
    setForm(f=>({...f,invoice_number:invNum,quotation_id:q.id,quote_number:q.quote_number,client_name:q.client_name,client_address:q.client_address||'',client_city:q.client_city||'',client_country:q.client_country||'Botswana',client_phone:q.client_phone||'',client_email:q.client_email||'',vat_rate:q.vat_rate||0.14,discount:q.discount||0}));
    setItems(q.items?.length?q.items:[emptyItem()]);
  }

  function applyQuote(q){
    setForm(f=>({...f,quotation_id:q.id,quote_number:q.quote_number,client_name:q.client_name,client_address:q.client_address||'',client_city:q.client_city||'',client_country:q.client_country||'Botswana',client_phone:q.client_phone||'',client_email:q.client_email||'',vat_rate:q.vat_rate||0.14,discount:q.discount||0}));
    setItems(q.items?.length?q.items:[emptyItem()]);
    setShowQuotes(false);toast.success('Loaded from '+q.quote_number);
  }

  function setF(k,v){setForm(f=>({...f,[k]:v}));}
  function setItem(i,k,v){setItems(it=>it.map((r,j)=>j===i?{...r,[k]:v}:r));}
  function addItem(){setItems(it=>[...it,emptyItem()]);}
  function remItem(i){if(items.length>1)setItems(it=>it.filter((_,j)=>j!==i));}

  function pickClient(c){
    setForm(f=>({...f,client_name:c.name,client_address:c.address||'',client_city:c.city||'',client_country:c.country||'Botswana',client_phone:c.phone||'',client_email:c.email||''}));
    setShowClients(false);setClientSearch('');
  }

  async function save(e){
    e.preventDefault();
    if(!form.client_name.trim()){toast.error('Client name required');return;}
    if(!items.some(it=>it.description.trim())){toast.error('Add at least one line item');return;}
    setSaving(true);
    const{subtotal,vatAmount,total}=calcTotals(items,form.vat_rate,form.discount);
    const payload={...form,items:items.filter(it=>it.description.trim()),subtotal:Math.round(subtotal*100)/100,vat_amount:Math.round(vatAmount*100)/100,total:Math.round(total*100)/100,discount:Number(form.discount)||0,vat_rate:Number(form.vat_rate)||0.14,updated_at:new Date().toISOString()};
    // Save items to catalog
    for(const it of items){
      if(it.description.trim()){
        await supabase.from('catalog_items').upsert({name:it.description.trim(),unit_price:Number(it.unit_price)||0},{onConflict:'name',ignoreDuplicates:true});
      }
    }
    let error;
    if(isEdit){
      ({error}=await supabase.from('invoices').update(payload).eq('id',id));
    } else {
      ({error}=await supabase.from('invoices').insert({...payload,amount_paid:0,balance_due:Math.round(total*100)/100}));
    }
    setSaving(false);
    if(error){toast.error(error.message);return;}
    toast.success(isEdit?'Invoice updated!':'Invoice created!');
    nav('/invoices');
  }

  const{subtotal,vatAmount,total}=calcTotals(items,form.vat_rate,form.discount);
  const filtClients=clients.filter(c=>c.name?.toLowerCase().includes(clientSearch.toLowerCase())||c.email?.toLowerCase().includes(clientSearch.toLowerCase()));
  const filtQuotes=quotes.filter(q=>q.quote_number?.toLowerCase().includes(quoteSearch.toLowerCase())||q.client_name?.toLowerCase().includes(quoteSearch.toLowerCase()));

  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">{isEdit?'Edit Invoice':'New Invoice'}</h1><p className="page-sub">{form.invoice_number}</p></div>
      <div className="btn-row">
        {!isEdit&&<button type="button" className="btn btn-secondary btn-sm" onClick={()=>setShowQuotes(true)}>📋 Load from Quote</button>}
        <button className="btn btn-secondary" onClick={()=>nav(-1)}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':isEdit?'Update':'Create Invoice'}</button>
      </div>
    </div>
    <div className="page-body">
      <form onSubmit={save}>
        {form.quote_number&&<div className="alert alert-info" style={{marginBottom:14}}>📎 Linked to quotation <strong>{form.quote_number}</strong></div>}

        <div className="card" style={{marginBottom:14}}>
          <div className="sec-title">Invoice Details</div>
          <div className="form-grid g3">
            <div className="fg"><label>Invoice Number</label><input className="fc" value={form.invoice_number} onChange={e=>setF('invoice_number',e.target.value)} required/></div>
            <div className="fg"><label>Invoice Date</label><input className="fc" type="date" value={form.invoice_date} onChange={e=>setF('invoice_date',e.target.value)} required/></div>
            <div className="fg"><label>Due Date</label><input className="fc" type="date" value={form.due_date} onChange={e=>setF('due_date',e.target.value)}/></div>
            <div className="fg"><label>Status</label><select className="fc" value={form.status} onChange={e=>setF('status',e.target.value)}><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
            <div className="fg"><label>PO / Reference No.</label><input className="fc" value={form.po_ref} onChange={e=>setF('po_ref',e.target.value)} placeholder="Optional"/></div>
            <div className="fg"><label>Quote Number (if any)</label><input className="fc" value={form.quote_number} onChange={e=>setF('quote_number',e.target.value)} placeholder="QUO-001"/></div>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div className="sec-title" style={{margin:0}}>Bill To</div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={()=>setShowClients(true)}>📋 Select from Clients</button>
          </div>
          <div className="form-grid g2">
            <div className="fg"><label>Client Name *</label><input className="fc" value={form.client_name} onChange={e=>setF('client_name',e.target.value)} required placeholder="Company or individual"/></div>
            <div className="fg"><label>Email</label><input className="fc" type="email" value={form.client_email} onChange={e=>setF('client_email',e.target.value)}/></div>
            <div className="fg" style={{gridColumn:'1/-1'}}><label>Address</label><input className="fc" value={form.client_address} onChange={e=>setF('client_address',e.target.value)}/></div>
            <div className="fg"><label>City / Town</label><input className="fc" value={form.client_city} onChange={e=>setF('client_city',e.target.value)}/></div>
            <div className="fg"><label>Phone</label><input className="fc" value={form.client_phone} onChange={e=>setF('client_phone',e.target.value)}/></div>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="sec-title">Line Items</div>
          <div className="tbl-wrap">
            <table className="items-tbl">
              <thead><tr><th style={{width:36}}>#</th><th>Description</th><th style={{width:60}}>Qty</th><th style={{width:130}}>Unit Price (BWP)</th><th style={{width:130}}>Amount</th><th style={{width:36}}></th></tr></thead>
              <tbody>{items.map((it,i)=><tr key={i}>
                <td style={{textAlign:'center',color:'var(--muted)',fontSize:'.78rem'}}>{i+1}</td>
                <td>
                  <input value={it.description} onChange={e=>setItem(i,'description',e.target.value)} placeholder="Item or service description…" list={`cat-${i}`}/>
                  <datalist id={`cat-${i}`}>{catalog.map(c=><option key={c.id} value={c.name}/>)}</datalist>
                </td>
                <td><input type="number" min="0" step="0.01" value={it.qty} onChange={e=>setItem(i,'qty',e.target.value)} style={{textAlign:'right'}}/></td>
                <td><input type="number" min="0" step="0.01" value={it.unit_price} onChange={e=>setItem(i,'unit_price',e.target.value)} style={{textAlign:'right'}}/></td>
                <td style={{textAlign:'right',padding:'6px 8px',fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:'.88rem'}}>{((Number(it.qty)||0)*(Number(it.unit_price)||0)).toFixed(2)}</td>
                <td><button type="button" className="btn btn-ghost btn-icon btn-xs" onClick={()=>remItem(i)} style={{color:'var(--err)'}}>✕</button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addItem} style={{marginTop:10}}>+ Add Line</button>
          <div style={{marginTop:16}}>
            <div className="totals-panel">
              <div className="tot-row"><span>Subtotal</span><span>BWP {subtotal.toFixed(2)}</span></div>
              <div className="tot-row"><span style={{display:'flex',alignItems:'center',gap:8}}>VAT<select value={form.vat_rate} onChange={e=>setF('vat_rate',e.target.value)} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text)',padding:'2px 6px',fontSize:'.78rem'}}><option value={0}>0%</option><option value={0.14}>14%</option></select></span><span>BWP {vatAmount.toFixed(2)}</span></div>
              <div className="tot-row"><span>Discount (BWP)</span><input type="number" min="0" step="0.01" value={form.discount} onChange={e=>setF('discount',e.target.value)} style={{width:90,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text)',padding:'3px 8px',textAlign:'right',fontSize:'.82rem',fontFamily:'DM Sans,sans-serif'}}/></div>
              <div className="tot-row grand"><span>TOTAL DUE (BWP)</span><span>{total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="sec-title">Notes</div>
          <div className="fg"><textarea className="fc" rows={3} value={form.notes} onChange={e=>setF('notes',e.target.value)} placeholder="Payment instructions or additional notes…"/></div>
        </div>
      </form>
    </div>

    {/* Client picker modal */}
    {showClients&&<div className="modal-overlay" onClick={()=>setShowClients(false)}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Select Client</div>
        <div className="search-bar" style={{width:'100%',marginBottom:14}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search clients…" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} autoFocus/>
        </div>
        <div style={{maxHeight:340,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
          {filtClients.map(c=><div key={c.id} onClick={()=>pickClient(c)} style={{padding:'10px 14px',borderRadius:10,cursor:'pointer',background:'var(--surface2)',border:'1px solid var(--border)',transition:'border-color .15s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--purple)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{fontWeight:600}}>{c.name} <span className="badge b-sent" style={{marginLeft:6}}>{c.client_id}</span></div>
            <div style={{fontSize:'.77rem',color:'var(--muted)',marginTop:2}}>{[c.city,c.phone,c.email].filter(Boolean).join(' · ')}</div>
          </div>)}
          {filtClients.length===0&&<div style={{textAlign:'center',color:'var(--muted)',padding:24}}>No clients found</div>}
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowClients(false)}>Cancel</button></div>
      </div>
    </div>}

    {/* Quote picker modal */}
    {showQuotes&&<div className="modal-overlay" onClick={()=>setShowQuotes(false)}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Load from Quotation</div>
        <div className="search-bar" style={{width:'100%',marginBottom:14}}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search by quote number or client…" value={quoteSearch} onChange={e=>setQuoteSearch(e.target.value)} autoFocus/>
        </div>
        <div style={{maxHeight:360,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
          {filtQuotes.map(q=><div key={q.id} onClick={()=>applyQuote(q)} style={{padding:'12px 14px',borderRadius:10,cursor:'pointer',background:'var(--surface2)',border:'1px solid var(--border)',transition:'border-color .15s',display:'flex',justifyContent:'space-between',alignItems:'center'}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--purple)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <div>
              <div style={{fontWeight:700,fontFamily:'Syne,sans-serif'}}>{q.quote_number}</div>
              <div style={{fontSize:'.78rem',color:'var(--muted)',marginTop:2}}>{q.client_name} · BWP {Number(q.total).toFixed(2)}</div>
            </div>
            <span className={`badge b-${q.status||'draft'}`}>{q.status}</span>
          </div>)}
          {filtQuotes.length===0&&<div style={{textAlign:'center',color:'var(--muted)',padding:24}}>No quotations found</div>}
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowQuotes(false)}>Cancel</button></div>
      </div>
    </div>}
  </>);
}

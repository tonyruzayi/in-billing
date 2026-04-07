/* eslint-disable react-hooks/exhaustive-deps */
import React,{useState,useEffect,useCallback} from 'react';
import {supabase} from '../lib/supabase';
import toast from 'react-hot-toast';
const Icon=({d})=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;

function nextClientId(clients){
  if(!clients.length)return'CLT-001';
  const nums=clients.map(c=>{const m=c.client_id?.match(/CLT-(\d+)/);return m?parseInt(m[1]):0;});
  return'CLT-'+String(Math.max(...nums)+1).padStart(3,'0');
}

const empty={name:'',contact_person:'',address:'',city:'',country:'Botswana',phone:'',email:'',vat_number:'',notes:''};

export default function Clients(){
  const [clients,setClients]=useState([]);
  const [search,setSearch]=useState('');
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState(empty);
  const [editing,setEditing]=useState(null);
  const [saving,setSaving]=useState(false);
  const [detail,setDetail]=useState(null);

  const load=useCallback(async()=>{
    const{data}=await supabase.from('clients').select('*').order('created_at',{ascending:false});
    setClients(data||[]);
  },[]);
  useEffect(()=>{load();},[load]);

  function openNew(){setForm(empty);setEditing(null);setModal(true);}
  function openEdit(c){setForm({name:c.name,contact_person:c.contact_person||'',address:c.address||'',city:c.city||'',country:c.country||'Botswana',phone:c.phone||'',email:c.email||'',vat_number:c.vat_number||'',notes:c.notes||''});setEditing(c.id);setModal(true);}

  async function save(){
    if(!form.name.trim()){toast.error('Client name required');return;}
    setSaving(true);
    let error;
    if(editing){
      ({error}=await supabase.from('clients').update({...form,updated_at:new Date().toISOString()}).eq('id',editing));
    } else {
      const cid=nextClientId(clients);
      ({error}=await supabase.from('clients').insert({...form,client_id:cid}));
    }
    setSaving(false);
    if(error){toast.error(error.message);return;}
    toast.success(editing?'Client updated!':'Client added!');
    setModal(false);load();
  }

  async function del(id,e){e.stopPropagation();if(!window.confirm('Delete this client?'))return;const{error}=await supabase.from('clients').delete().eq('id',id);if(error){toast.error(error.message);return;}toast.success('Deleted');load();}

  const filtered=clients.filter(c=>
    c.name?.toLowerCase().includes(search.toLowerCase())||
    c.client_id?.toLowerCase().includes(search.toLowerCase())||
    c.email?.toLowerCase().includes(search.toLowerCase())||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">Clients</h1><p className="page-sub">{filtered.length} client{filtered.length!==1?'s':''}</p></div>
      <div className="btn-row">
        <div className="search-bar"><Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/><input placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Client</button>
      </div>
    </div>
    <div className="page-body">
      <div className="card" style={{padding:0}}>
        {filtered.length===0?<div className="empty"><p>{search?'No results':'No clients yet'}</p></div>:
        <div className="tbl-wrap"><table>
          <thead><tr><th>Client ID</th><th>Name</th><th>Contact</th><th>City</th><th>Phone</th><th>Email</th><th></th></tr></thead>
          <tbody>{filtered.map(c=><tr key={c.id} style={{cursor:'pointer'}} onClick={()=>setDetail(c)}>
            <td><span className="badge b-sent">{c.client_id}</span></td>
            <td style={{fontWeight:600}}>{c.name}</td>
            <td className="td-m">{c.contact_person||'—'}</td>
            <td className="td-m">{c.city||'—'}</td>
            <td className="td-m">{c.phone||'—'}</td>
            <td className="td-m">{c.email||'—'}</td>
            <td onClick={e=>e.stopPropagation()}>
              <div className="btn-row">
                <button className="btn btn-ghost btn-icon btn-xs" onClick={()=>openEdit(c)}>✏️</button>
                <button className="btn btn-ghost btn-icon btn-xs" onClick={e=>del(c.id,e)}>🗑️</button>
              </div>
            </td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </div>

    {modal&&<div className="modal-overlay" onClick={()=>setModal(false)}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{editing?'Edit Client':'Add New Client'}</div>
        <div className="form-grid g2">
          <div className="fg"><label>Client Name *</label><input className="fc" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Company or individual name"/></div>
          <div className="fg"><label>Contact Person</label><input className="fc" value={form.contact_person} onChange={e=>setForm(f=>({...f,contact_person:e.target.value}))} placeholder="Primary contact name"/></div>
          <div className="fg"><label>Email</label><input className="fc" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="client@company.com"/></div>
          <div className="fg"><label>Phone</label><input className="fc" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+267 xx xxx xxx"/></div>
          <div className="fg" style={{gridColumn:'1/-1'}}><label>Address</label><input className="fc" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Street address"/></div>
          <div className="fg"><label>City / Town</label><input className="fc" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Gaborone"/></div>
          <div className="fg"><label>Country</label><input className="fc" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))}/></div>
          <div className="fg"><label>VAT Number</label><input className="fc" value={form.vat_number} onChange={e=>setForm(f=>({...f,vat_number:e.target.value}))} placeholder="BW…"/></div>
          <div className="fg" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea className="fc" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Additional notes…"/></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':editing?'Update Client':'Add Client'}</button>
        </div>
      </div>
    </div>}

    {detail&&<div className="modal-overlay" onClick={()=>setDetail(null)}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-title" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          {detail.name}<span className="badge b-sent">{detail.client_id}</span>
        </div>
        <div className="form-grid g2" style={{gap:10}}>
          {[['Contact',detail.contact_person],['Email',detail.email],['Phone',detail.phone],['Address',detail.address],['City',detail.city],['Country',detail.country],['VAT',detail.vat_number],['Notes',detail.notes]].map(([l,v])=>v?<div key={l}><div style={{fontSize:'.7rem',color:'var(--muted)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',marginBottom:2}}>{l}</div><div style={{fontSize:'.85rem'}}>{v}</div></div>:null)}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setDetail(null)}>Close</button>
          <button className="btn btn-primary" onClick={()=>{openEdit(detail);setDetail(null);}}>Edit</button>
        </div>
      </div>
    </div>}
  </>);
}

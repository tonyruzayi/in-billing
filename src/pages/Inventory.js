/* eslint-disable react-hooks/exhaustive-deps */
import React,{useState,useEffect,useCallback} from 'react';
import {supabase} from '../lib/supabase';
import toast from 'react-hot-toast';
const empty={item_code:'',name:'',description:'',category:'',brand:'',model:'',serial_number:'',quantity:0,min_quantity:5,unit_cost:0,unit_price:0,location:'',supplier:'',notes:''};
const cats=['Networking','Computers','Servers','Cables','Switches','Routers','Printers','UPS/Power','Software','Accessories','Other'];
export default function Inventory(){
  const [items,setItems]=useState([]);const [search,setSearch]=useState('');const [modal,setModal]=useState(false);
  const [form,setForm]=useState(empty);const [editing,setEditing]=useState(null);const [saving,setSaving]=useState(false);
  const [catFilter,setCatFilter]=useState('all');

  const load=useCallback(async()=>{const{data}=await supabase.from('inventory').select('*').order('name');setItems(data||[]);},[]);
  useEffect(()=>{load();},[load]);

  function openNew(){setForm(empty);setEditing(null);setModal(true);}
  function openEdit(it){setForm({item_code:it.item_code||'',name:it.name,description:it.description||'',category:it.category||'',brand:it.brand||'',model:it.model||'',serial_number:it.serial_number||'',quantity:it.quantity||0,min_quantity:it.min_quantity||5,unit_cost:it.unit_cost||0,unit_price:it.unit_price||0,location:it.location||'',supplier:it.supplier||'',notes:it.notes||''});setEditing(it.id);setModal(true);}

  async function save(){
    if(!form.name.trim()){toast.error('Name required');return;}
    setSaving(true);
    let error;
    if(editing){({error}=await supabase.from('inventory').update({...form,quantity:Number(form.quantity),min_quantity:Number(form.min_quantity),unit_cost:Number(form.unit_cost),unit_price:Number(form.unit_price),updated_at:new Date().toISOString()}).eq('id',editing));}
    else{({error}=await supabase.from('inventory').insert({...form,quantity:Number(form.quantity),min_quantity:Number(form.min_quantity),unit_cost:Number(form.unit_cost),unit_price:Number(form.unit_price)}));}
    setSaving(false);
    if(error){toast.error(error.message);return;}
    toast.success(editing?'Updated!':'Item added!');setModal(false);load();
  }

  async function del(id,e){e.stopPropagation();if(!window.confirm('Delete this item?'))return;await supabase.from('inventory').delete().eq('id',id);toast.success('Deleted');load();}

  async function adjustQty(id,delta){
    const it=items.find(i=>i.id===id);if(!it)return;
    const nq=Math.max(0,it.quantity+delta);
    await supabase.from('inventory').update({quantity:nq,updated_at:new Date().toISOString()}).eq('id',id);
    load();
  }

  const filtered=items.filter(it=>{
    const ms=it.name?.toLowerCase().includes(search.toLowerCase())||it.item_code?.toLowerCase().includes(search.toLowerCase())||it.brand?.toLowerCase().includes(search.toLowerCase())||it.category?.toLowerCase().includes(search.toLowerCase());
    const mc=catFilter==='all'||it.category===catFilter;
    return ms&&mc;
  });

  const lowStock=filtered.filter(i=>i.quantity<=i.min_quantity);

  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">Inventory</h1><p className="page-sub">{filtered.length} items{lowStock.length>0&&<span style={{color:'var(--err)',marginLeft:8}}>· {lowStock.length} low stock</span>}</p></div>
      <div className="btn-row">
        <div className="search-bar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input placeholder="Search items…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="fc" style={{width:'auto'}} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {cats.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openNew}>+ Add Item</button>
      </div>
    </div>
    <div className="page-body">
      {lowStock.length>0&&<div className="alert alert-warn" style={{marginBottom:14}}>⚠️ {lowStock.length} item{lowStock.length!==1?'s':''} below minimum stock level</div>}
      <div className="card" style={{padding:0}}>
        {filtered.length===0?<div className="empty"><p>{search?'No results':'No inventory items yet'}</p></div>:
        <div className="tbl-wrap"><table>
          <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Brand/Model</th><th>Qty</th><th>Min</th><th>Unit Price</th><th>Location</th><th></th></tr></thead>
          <tbody>{filtered.map(it=>{
            const low=it.quantity<=it.min_quantity;
            return<tr key={it.id}>
              <td><span style={{fontFamily:'monospace',fontSize:'.78rem',color:'var(--muted)'}}>{it.item_code||'—'}</span></td>
              <td style={{fontWeight:600}}>{it.name}{it.description&&<div style={{fontSize:'.73rem',color:'var(--muted)'}}>{it.description}</div>}</td>
              <td><span className="badge b-draft">{it.category||'—'}</span></td>
              <td className="td-m">{[it.brand,it.model].filter(Boolean).join(' / ')||'—'}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <button className="btn btn-ghost btn-xs btn-icon" onClick={()=>adjustQty(it.id,-1)}>−</button>
                  <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,color:low?'var(--err)':'var(--text)',minWidth:24,textAlign:'center'}}>{it.quantity}</span>
                  <button className="btn btn-ghost btn-xs btn-icon" onClick={()=>adjustQty(it.id,1)}>+</button>
                  {low&&<span className="badge b-low">Low</span>}
                </div>
              </td>
              <td className="td-m">{it.min_quantity}</td>
              <td className="td-num">BWP {Number(it.unit_price||0).toFixed(2)}</td>
              <td className="td-m">{it.location||'—'}</td>
              <td><div className="btn-row"><button className="btn btn-ghost btn-icon btn-xs" onClick={()=>openEdit(it)}>✏️</button><button className="btn btn-ghost btn-icon btn-xs" onClick={e=>del(it.id,e)}>🗑️</button></div></td>
            </tr>;
          })}</tbody>
        </table></div>}
      </div>
    </div>
    {modal&&<div className="modal-overlay" onClick={()=>setModal(false)}>
      <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">{editing?'Edit Item':'Add Inventory Item'}</div>
        <div className="form-grid g3">
          <div className="fg"><label>Item Code</label><input className="fc" value={form.item_code} onChange={e=>setForm(f=>({...f,item_code:e.target.value}))} placeholder="e.g. NET-001"/></div>
          <div className="fg" style={{gridColumn:'2/4'}}><label>Name *</label><input className="fc" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Item name"/></div>
          <div className="fg" style={{gridColumn:'1/-1'}}><label>Description</label><input className="fc" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
          <div className="fg"><label>Category</label><select className="fc" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option value="">— Select —</option>{cats.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
          <div className="fg"><label>Brand</label><input className="fc" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}/></div>
          <div className="fg"><label>Model</label><input className="fc" value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))}/></div>
          <div className="fg"><label>Quantity</label><input className="fc" type="number" min="0" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/></div>
          <div className="fg"><label>Min Stock Level</label><input className="fc" type="number" min="0" value={form.min_quantity} onChange={e=>setForm(f=>({...f,min_quantity:e.target.value}))}/></div>
          <div className="fg"><label>Location</label><input className="fc" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Shelf/Room"/></div>
          <div className="fg"><label>Unit Cost (BWP)</label><input className="fc" type="number" min="0" step="0.01" value={form.unit_cost} onChange={e=>setForm(f=>({...f,unit_cost:e.target.value}))}/></div>
          <div className="fg"><label>Unit Price (BWP)</label><input className="fc" type="number" min="0" step="0.01" value={form.unit_price} onChange={e=>setForm(f=>({...f,unit_price:e.target.value}))}/></div>
          <div className="fg"><label>Supplier</label><input className="fc" value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))}/></div>
          <div className="fg"><label>Serial Number</label><input className="fc" value={form.serial_number} onChange={e=>setForm(f=>({...f,serial_number:e.target.value}))}/></div>
          <div className="fg" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea className="fc" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':editing?'Update':'Add Item'}</button>
        </div>
      </div>
    </div>}
  </>);
}

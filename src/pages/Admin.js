import React,{useState,useEffect} from 'react';
import {supabase} from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Admin(){
  const [users,setUsers]=useState([]);const [modal,setModal]=useState(false);
  const [form,setForm]=useState({email:'',full_name:'',password:'',role:'staff'});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{load();},[]);
  async function load(){const{data}=await supabase.from('profiles').select('*').order('created_at');setUsers(data||[]);}

  async function createUser(){
    if(!form.email||!form.password){toast.error('Email and password required');return;}
    setSaving(true);
    // Create auth user via supabase admin - uses service role in real setup
    // For now we use signUp which creates a profile via trigger
    const{data,error}=await supabase.auth.admin?.createUser?.({email:form.email,password:form.password,user_metadata:{full_name:form.full_name,role:form.role},email_confirm:true})||{error:{message:'Admin API not available. Use Supabase dashboard to invite users.'}};
    if(error){
      // Fallback: just insert profile record for manually created users
      toast.error(error.message);setSaving(false);return;
    }
    if(data?.user){
      await supabase.from('profiles').upsert({id:data.user.id,email:form.email,full_name:form.full_name,role:form.role});
    }
    toast.success('User created!');setModal(false);setForm({email:'',full_name:'',password:'',role:'staff'});load();setSaving(false);
  }

  async function updateRole(id,role){
    await supabase.from('profiles').update({role,updated_at:new Date().toISOString()}).eq('id',id);
    toast.success('Role updated');load();
  }

  async function toggleActive(id,active){
    await supabase.from('profiles').update({is_active:!active,updated_at:new Date().toISOString()}).eq('id',id);
    toast.success(active?'User deactivated':'User activated');load();
  }

  return(<>
    <div className="page-hdr">
      <div><h1 className="page-title">Admin Portal</h1><p className="page-sub">User management — Admin access only</p></div>
      <button className="btn btn-primary" onClick={()=>setModal(true)}>+ Add User</button>
    </div>
    <div className="page-body">
      <div className="alert alert-info" style={{marginBottom:16}}>
        🔐 Only users with <strong>Admin</strong> role can access this portal. To create users, you can also go to <strong>Supabase → Authentication → Users → Invite User</strong>, then set their role here.
      </div>
      <div className="card" style={{padding:0}}>
        <div className="tbl-wrap"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>{users.map(u=><tr key={u.id}>
            <td style={{fontWeight:600}}>{u.full_name||'—'}</td>
            <td className="td-m">{u.email}</td>
            <td>
              <select className="fc" style={{width:'auto',padding:'4px 8px',fontSize:'.78rem'}} value={u.role||'staff'} onChange={e=>updateRole(u.id,e.target.value)}>
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
            </td>
            <td><span className={u.is_active!==false?'badge b-ok':'badge b-rejected'}>{u.is_active!==false?'Active':'Inactive'}</span></td>
            <td className="td-m">{u.created_at?new Date(u.created_at).toLocaleDateString():'—'}</td>
            <td><button className="btn btn-ghost btn-xs" onClick={()=>toggleActive(u.id,u.is_active!==false)}>{u.is_active!==false?'Deactivate':'Activate'}</button></td>
          </tr>)}
          {users.length===0&&<tr><td colSpan={6} style={{textAlign:'center',color:'var(--muted)',padding:30}}>No users found</td></tr>}</tbody>
        </table></div>
      </div>

      <div style={{marginTop:20}} className="card">
        <div className="card-title" style={{marginBottom:12}}>How to Add Users (Recommended)</div>
        <ol style={{paddingLeft:20,color:'var(--muted)',fontSize:'.84rem',lineHeight:2}}>
          <li>Go to your <strong style={{color:'var(--text)'}}>Supabase Dashboard → Authentication → Users</strong></li>
          <li>Click <strong style={{color:'var(--text)'}}>Invite User</strong> and enter their email</li>
          <li>They receive a magic link to set their password</li>
          <li>Come back here and <strong style={{color:'var(--text)'}}>set their role</strong> in the table above</li>
        </ol>
      </div>
    </div>

    {modal&&<div className="modal-overlay" onClick={()=>setModal(false)}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-title">Add New User</div>
        <div className="form-grid" style={{gap:13}}>
          <div className="fg"><label>Full Name</label><input className="fc" value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder="Jane Doe"/></div>
          <div className="fg"><label>Email *</label><input className="fc" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="user@company.com"/></div>
          <div className="fg"><label>Password *</label><input className="fc" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 characters"/></div>
          <div className="fg"><label>Role</label>
            <select className="fc" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer (read-only)</option>
            </select>
          </div>
        </div>
        <div className="alert alert-warn" style={{marginTop:14}}>Note: If user creation fails here, invite via Supabase dashboard instead.</div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createUser} disabled={saving}>{saving?'Creating…':'Create User'}</button>
        </div>
      </div>
    </div>}
  </>);
}

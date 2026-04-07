import React,{useState} from 'react';
import {useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import {useAuth} from '../hooks/useAuth';
import LOGO from '../logoData';
export default function Login(){
  const {signIn}=useAuth(),nav=useNavigate();
  const [email,setEmail]=useState(''),[pw,setPw]=useState(''),[loading,setLoading]=useState(false);
  async function submit(e){e.preventDefault();setLoading(true);const{error}=await signIn(email,pw);setLoading(false);if(error){toast.error(error.message);}else{nav('/');}}
  return(
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-wrap">
          <div className="login-logo-img"><img src={LOGO} alt="IN Logo"/></div>
          <div>
            <div className="login-brand">INFORMATION NETWORKING</div>
            <div className="login-tagline">Connecting Innovation, Empowering Networks</div>
          </div>
        </div>
        <div className="login-title">Welcome Back</div>
        <div className="login-sub">Sign in to your billing system</div>
        <form className="login-form" onSubmit={submit}>
          <div className="fg">
            <label>Email Address</label>
            <div className="inp-wrap">
              <svg className="inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              <input className="fc inp-wrap" style={{paddingLeft:36}} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
          </div>
          <div className="fg">
            <label>Password</label>
            <div className="inp-wrap">
              <svg className="inp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input className="fc" style={{paddingLeft:36}} type="password" placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} required/>
            </div>
          </div>
          <button className="login-btn" type="submit" disabled={loading}>{loading?'Signing in…':'Sign In'}</button>
        </form>
        <div className="login-footer">Secure access · Information Networking © 2026</div>
      </div>
    </div>
  );
}

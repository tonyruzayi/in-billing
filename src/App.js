import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Quotations from './pages/Quotations';
import QuoteForm from './pages/QuoteForm';
import QuoteDetail from './pages/QuoteDetail';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import Clients from './pages/Clients';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import './App.css';

function Guard({ children, adminOnly }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="splash"><div className="splash-logo"><span style={{color:'#fff',fontFamily:'Syne,sans-serif',fontWeight:800}}>IN</span></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style:{background:'#11112a',color:'#e2e2f0',border:'1px solid #252550',fontSize:'0.85rem'},
          success:{iconTheme:{primary:'#10b981',secondary:'#fff'}},
          error:{iconTheme:{primary:'#ef4444',secondary:'#fff'}},
        }}/>
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/" element={<Guard><Layout/></Guard>}>
            <Route index element={<Dashboard/>}/>
            <Route path="quotations" element={<Quotations/>}/>
            <Route path="quotations/new" element={<QuoteForm/>}/>
            <Route path="quotations/:id" element={<QuoteDetail/>}/>
            <Route path="quotations/:id/edit" element={<QuoteForm/>}/>
            <Route path="invoices" element={<Invoices/>}/>
            <Route path="invoices/new" element={<InvoiceForm/>}/>
            <Route path="invoices/new/:quoteId" element={<InvoiceForm/>}/>
            <Route path="invoices/:id" element={<InvoiceDetail/>}/>
            <Route path="invoices/:id/edit" element={<InvoiceForm/>}/>
            <Route path="clients" element={<Clients/>}/>
            <Route path="inventory" element={<Inventory/>}/>
            <Route path="reports" element={<Reports/>}/>
            <Route path="admin" element={<Guard adminOnly><Admin/></Guard>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

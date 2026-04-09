import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Login from './pages/Login';
import './App.css';

// Lazy load all pages for faster initial load
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Quotations   = lazy(() => import('./pages/Quotations'));
const QuoteForm    = lazy(() => import('./pages/QuoteForm'));
const QuoteDetail  = lazy(() => import('./pages/QuoteDetail'));
const Invoices     = lazy(() => import('./pages/Invoices'));
const InvoiceForm  = lazy(() => import('./pages/InvoiceForm'));
const InvoiceDetail= lazy(() => import('./pages/InvoiceDetail'));
const Clients      = lazy(() => import('./pages/Clients'));
const Inventory    = lazy(() => import('./pages/Inventory'));
const Reports      = lazy(() => import('./pages/Reports'));
const Admin        = lazy(() => import('./pages/Admin'));

const PageLoader = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:'var(--muted)',flexDirection:'column',gap:12}}>
    <div style={{width:32,height:32,border:'3px solid var(--border)',borderTop:'3px solid var(--purple)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

function Guard({ children, adminOnly }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="splash">
      <div className="splash-logo">
        <span style={{color:'#fff',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.2rem'}}>IN</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
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
        <Suspense fallback={<PageLoader/>}>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<Guard><Layout /></Guard>}>
              <Route index element={<Dashboard />} />
              <Route path="quotations" element={<Quotations />} />
              <Route path="quotations/new" element={<QuoteForm />} />
              <Route path="quotations/:id" element={<QuoteDetail />} />
              <Route path="quotations/:id/edit" element={<QuoteForm />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/new/:quoteId" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />
              <Route path="clients" element={<Clients />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="reports" element={<Reports />} />
              <Route path="admin" element={<Guard adminOnly><Admin /></Guard>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

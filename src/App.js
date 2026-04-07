import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Quotations from './pages/Quotations';
import QuoteForm from './pages/QuoteForm';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import QuoteDetail from './pages/QuoteDetail';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="splash-logo">IN</div></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#fff', border: '1px solid #8b5cf6' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

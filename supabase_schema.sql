-- ============================================================
-- Information Networking Billing System — Supabase Schema
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ============================================================

-- 1. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Botswana',
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. QUOTATIONS
CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  quote_date DATE NOT NULL,
  valid_until DATE,
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_city TEXT,
  client_country TEXT DEFAULT 'Botswana',
  client_phone TEXT,
  client_email TEXT,
  project_ref TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) DEFAULT 0,
  vat_rate NUMERIC(5,4) DEFAULT 0.14,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','sent','accepted','rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE,
  quotation_id UUID REFERENCES quotations(id),
  quote_number TEXT,
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_city TEXT,
  client_country TEXT DEFAULT 'Botswana',
  client_phone TEXT,
  client_email TEXT,
  po_ref TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) DEFAULT 0,
  vat_rate NUMERIC(5,4) DEFAULT 0.14,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid'
    CHECK (status IN ('unpaid','partial','paid','overdue')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'Bank Transfer',
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access
CREATE POLICY "Authenticated full access - clients"
  ON clients FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access - quotations"
  ON quotations FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access - invoices"
  ON invoices FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access - payments"
  ON payments FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quotations_quote_number ON quotations(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotations_client_name ON quotations(client_name);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices(client_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation_id ON invoices(quotation_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

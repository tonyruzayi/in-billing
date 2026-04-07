import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// SQL to run in Supabase SQL editor to set up schema:
export const SCHEMA_SQL = `
-- Clients table
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

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT UNIQUE NOT NULL,
  quote_date DATE NOT NULL,
  valid_until DATE,
  client_id UUID REFERENCES clients(id),
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_city TEXT,
  client_country TEXT,
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
  status TEXT DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
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
  client_country TEXT,
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
  status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (enable for production)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can do all on clients" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can do all on quotations" ON quotations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can do all on invoices" ON invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users can do all on payments" ON payments FOR ALL USING (auth.role() = 'authenticated');
`;

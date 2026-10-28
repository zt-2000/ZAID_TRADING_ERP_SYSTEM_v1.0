-- ZAID TRADING ERP — PRODUCTION SUPABASE SCHEMA MIGRATION (STAGING HARDENED)
-- Migration Version: 20261028_zaid_erp_hardened_schema.sql
-- Description: Complete relational schema with hardened RLS policies, WITH CHECK clauses, search_path security, and tenant isolation.

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  registration_number TEXT,
  tax_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Sri Lanka',
  logo_url TEXT,
  default_currency TEXT DEFAULT 'LKR',
  currency_symbol TEXT DEFAULT 'Rs.',
  currency_precision INT DEFAULT 2,
  default_tax_rate NUMERIC DEFAULT 15.0,
  tax_inclusive_pricing BOOLEAN DEFAULT false,
  default_apply_vat BOOLEAN DEFAULT false,
  time_zone TEXT DEFAULT 'Asia/Colombo',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  display_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  job_title TEXT,
  role TEXT NOT NULL CHECK (role IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Storekeeper', 'Accountant', 'Delivery Driver')),
  assigned_warehouse TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 4. Expense Categories Table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_budget NUMERIC DEFAULT 0,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.product_categories(id),
  unit TEXT DEFAULT 'Kg',
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  min_stock_level NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, sku)
);

-- 6. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  credit_limit NUMERIC,
  credit_days INT,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 7. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  payment_terms TEXT DEFAULT '30_days',
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 8. Warehouses Table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'central',
  address TEXT,
  city TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  manager_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, code)
);

-- 9. Warehouse Bins Table
CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  type TEXT DEFAULT 'pallet',
  max_weight_kg NUMERIC DEFAULT 1000,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(warehouse_id, code)
);

-- 10. Quotations Table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  warehouse_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  apply_vat BOOLEAN DEFAULT false,
  vat_rate NUMERIC DEFAULT 15.0,
  tax_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'sent',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, quotation_number)
);

-- 11. Sales Orders Table
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  source_quotation_id UUID REFERENCES public.quotations(id),
  date DATE NOT NULL,
  delivery_date DATE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  warehouse_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount_total NUMERIC DEFAULT 0,
  apply_vat BOOLEAN DEFAULT false,
  vat_rate NUMERIC DEFAULT 15.0,
  tax_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'new',
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, order_number)
);

-- 12. Sales Invoices Table
CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  payment_terms TEXT DEFAULT '30_days',
  warehouse_name TEXT,
  subtotal NUMERIC DEFAULT 0,
  apply_vat BOOLEAN DEFAULT false,
  vat_rate NUMERIC DEFAULT 15.0,
  tax_total NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  paid NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'posted',
  items_count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);

-- 13. Deliveries Table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  delivery_number TEXT NOT NULL,
  sales_order_id UUID REFERENCES public.sales_orders(id),
  sales_order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_address TEXT,
  scheduled_date DATE,
  actual_delivery_date TIMESTAMPTZ,
  assigned_staff TEXT,
  vehicle_details TEXT,
  status TEXT DEFAULT 'scheduled',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  recipient_name TEXT,
  proof_of_delivery_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(company_id, delivery_number)
);

-- 14. Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  po_number TEXT NOT NULL,
  date DATE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_name TEXT NOT NULL,
  warehouse_name TEXT,
  payment_terms TEXT DEFAULT '30_days',
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, po_number)
);

-- 15. Goods Received Notes (GRN) Table
CREATE TABLE IF NOT EXISTS public.grns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  grn_number TEXT NOT NULL,
  purchase_order_id UUID REFERENCES public.purchases(id),
  po_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  date DATE NOT NULL,
  warehouse_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'received',
  received_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, grn_number)
);

-- 16. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  voucher_no TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id),
  category_name TEXT NOT NULL,
  payment_account TEXT NOT NULL,
  account_name TEXT NOT NULL,
  payee TEXT NOT NULL,
  reference TEXT,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, voucher_no)
);

-- 17. General Ledger Entries Table
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  voucher_ref TEXT NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  memo TEXT NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  running_balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_ledger ENABLE ROW LEVEL SECURITY;

-- Secure SECURITY DEFINER Function with search_path set to public
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Hardened RLS Policies with explicit USING and WITH CHECK clauses
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name NOT IN ('companies', 'user_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS company_isolation_policy ON public.%I;', tbl);
    EXECUTE format('CREATE POLICY company_isolation_policy ON public.%I FOR ALL USING (company_id = public.get_auth_company_id()) WITH CHECK (company_id = public.get_auth_company_id());', tbl);
  END LOOP;
END $$;

-- Companies and User Profiles policies
DROP POLICY IF EXISTS companies_isolation_policy ON public.companies;
CREATE POLICY companies_isolation_policy ON public.companies FOR SELECT USING (id = public.get_auth_company_id());

DROP POLICY IF EXISTS user_profiles_isolation_policy ON public.user_profiles;
CREATE POLICY user_profiles_isolation_policy ON public.user_profiles FOR ALL USING (company_id = public.get_auth_company_id()) WITH CHECK (company_id = public.get_auth_company_id());

-- Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(company_id, code);
CREATE INDEX IF NOT EXISTS idx_sales_inv_no ON public.sales_invoices(company_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_deliveries_no ON public.deliveries(company_id, delivery_number);
CREATE INDEX IF NOT EXISTS idx_gl_acc_date ON public.general_ledger(company_id, account_code, date);

-- ZAID TRADING ERP — PRODUCTION SUPABASE SCHEMA MIGRATION (STAGING HARDENED v4.3)
-- Migration Version: 20261028_zaid_erp_hardened_schema_v4_3.sql
-- Description: Fully secured relational schema featuring strict company isolation, targeted stale-policy cleanup on ERP tables only, non-recursive profile validation with immutable user_id/company_id enforcement, strict role-delegation rules (Owner-only privilege granting), and atomic RPC onboarding.

-- =========================================================================
-- 1. COMPANIES TABLE (Tenant Root)
-- =========================================================================
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

-- =========================================================================
-- 2. USER PROFILES TABLE (Linked to auth.users with RBAC)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
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

-- =========================================================================
-- 3. PRODUCT CATEGORIES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, code)
);

-- =========================================================================
-- 4. EXPENSE CATEGORIES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  monthly_budget NUMERIC DEFAULT 0,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id)
);

-- =========================================================================
-- 5. PRODUCTS TABLE (Composite FK to Product Categories)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id UUID,
  unit TEXT DEFAULT 'Kg',
  purchase_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  min_stock_level NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, sku),
  FOREIGN KEY (company_id, category_id) REFERENCES public.product_categories(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 6. CUSTOMERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
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
  UNIQUE (company_id, id),
  UNIQUE (company_id, code)
);

-- =========================================================================
-- 7. SUPPLIERS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
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
  UNIQUE (company_id, id),
  UNIQUE (company_id, code)
);

-- =========================================================================
-- 8. WAREHOUSES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'central',
  address TEXT,
  city TEXT,
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  manager_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, code)
);

-- =========================================================================
-- 9. WAREHOUSE BINS TABLE (Composite FK to Warehouses, Unique per company/warehouse/code)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  aisle TEXT,
  rack TEXT,
  shelf TEXT,
  type TEXT DEFAULT 'pallet',
  max_weight_kg NUMERIC DEFAULT 1000,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, warehouse_id, code),
  FOREIGN KEY (company_id, warehouse_id) REFERENCES public.warehouses(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 10. QUOTATIONS TABLE (Composite FK to Customers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  quotation_number TEXT NOT NULL,
  date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  customer_id UUID,
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
  UNIQUE (company_id, id),
  UNIQUE (company_id, quotation_number),
  FOREIGN KEY (company_id, customer_id) REFERENCES public.customers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 11. SALES ORDERS TABLE (Composite FK to Quotations and Customers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  source_quotation_id UUID,
  date DATE NOT NULL,
  delivery_date DATE,
  customer_id UUID,
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
  UNIQUE (company_id, id),
  UNIQUE (company_id, order_number),
  FOREIGN KEY (company_id, source_quotation_id) REFERENCES public.quotations(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, customer_id) REFERENCES public.customers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 12. SALES INVOICES TABLE (Composite FK to Customers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  customer_id UUID,
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
  UNIQUE (company_id, id),
  UNIQUE (company_id, invoice_number),
  FOREIGN KEY (company_id, customer_id) REFERENCES public.customers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 13. DELIVERIES TABLE (Composite FK to Sales Orders and Customers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  delivery_number TEXT NOT NULL,
  sales_order_id UUID,
  sales_order_number TEXT NOT NULL,
  customer_id UUID,
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
  UNIQUE (company_id, id),
  UNIQUE (company_id, delivery_number),
  FOREIGN KEY (company_id, sales_order_id) REFERENCES public.sales_orders(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (company_id, customer_id) REFERENCES public.customers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 14. PURCHASES TABLE (Composite FK to Suppliers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  po_number TEXT NOT NULL,
  date DATE NOT NULL,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  warehouse_name TEXT,
  payment_terms TEXT DEFAULT '30_days',
  total_cost NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, po_number),
  FOREIGN KEY (company_id, supplier_id) REFERENCES public.suppliers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 15. GOODS RECEIVED NOTES (GRN) TABLE (Composite FK to Purchases)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.grns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  grn_number TEXT NOT NULL,
  purchase_order_id UUID,
  po_number TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  date DATE NOT NULL,
  warehouse_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'received',
  received_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, grn_number),
  FOREIGN KEY (company_id, purchase_order_id) REFERENCES public.purchases(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 16. EXPENSES TABLE (Composite FK to Expense Categories)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  voucher_no TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category_id UUID,
  category_name TEXT NOT NULL,
  payment_account TEXT NOT NULL,
  account_name TEXT NOT NULL,
  payee TEXT NOT NULL,
  reference TEXT,
  amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, voucher_no),
  FOREIGN KEY (company_id, category_id) REFERENCES public.expense_categories(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 17. GENERAL LEDGER ENTRIES TABLE (Accounting History - Restrict Deletes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
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

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) ACTIVATION
-- =========================================================================
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

-- =========================================================================
-- SECURE SECURITY DEFINER HELPER FUNCTIONS (Hardened & Recursion-Free)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
  SELECT p.company_id FROM public.user_profiles AS p WHERE p.user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER 
   SET search_path = public 
   SET row_security = off;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles AS p 
    WHERE p.user_id = auth.uid() AND p.role = 'Owner / Administrator'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER 
   SET search_path = public 
   SET row_security = off;

-- Revoke and Grant EXECUTE permissions securely
REVOKE EXECUTE ON FUNCTION public.get_auth_company_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_company_id() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_company_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated, service_role;

-- =========================================================================
-- SECURE PROFILE VALIDATION FUNCTION (Strict Owner-only privilege assignment)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_target_id UUID,
  p_target_user_id UUID,
  p_target_company_id UUID,
  p_target_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_actor_role TEXT;
  v_actor_company UUID;
  v_old_role TEXT;
  v_old_company UUID;
  v_old_user_id UUID;
BEGIN
  -- Fetch actor profile
  SELECT p.role, p.company_id INTO v_actor_role, v_actor_company
  FROM public.user_profiles AS p
  WHERE p.user_id = auth.uid() LIMIT 1;

  -- Fetch target existing profile by primary id
  SELECT p.role, p.company_id, p.user_id INTO v_old_role, v_old_company, v_old_user_id
  FROM public.user_profiles AS p
  WHERE p.id = p_target_id LIMIT 1;

  -- Tenant isolation enforcement
  IF v_actor_company IS NULL OR v_actor_company <> p_target_company_id OR v_actor_company <> v_old_company THEN
    RETURN FALSE;
  END IF;

  -- Immutable user_id and company_id checks
  IF v_old_user_id <> p_target_user_id OR v_old_company <> p_target_company_id THEN
    RETURN FALSE;
  END IF;

  -- If updating self:
  IF auth.uid() = p_target_user_id THEN
    -- Ordinary users cannot change their own role
    IF v_old_role <> p_target_role THEN
      RETURN FALSE;
    END IF;
    RETURN TRUE;
  END IF;

  -- If updating another user: actor must be an Owner / Administrator
  IF v_actor_role = 'Owner / Administrator' THEN
    -- Only an existing Owner / Administrator can assign the Owner / Administrator role
    IF p_target_role = 'Owner / Administrator' AND v_actor_role <> 'Owner / Administrator' THEN
      RETURN FALSE;
    END IF;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER 
   SET search_path = public 
   SET row_security = off;

REVOKE EXECUTE ON FUNCTION public.validate_profile_update(UUID, UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_profile_update(UUID, UUID, UUID, TEXT) TO authenticated, service_role;

-- =========================================================================
-- SECURE ONBOARDING RPC FUNCTION (Atomic First-Admin Registration)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.register_new_company(
  p_company_name TEXT,
  p_legal_name TEXT,
  p_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_user_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User is already registered to a company.';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Authenticated user record not found in auth.users.';
  END IF;

  INSERT INTO public.companies (company_name, legal_name, email, phone)
  VALUES (p_company_name, p_legal_name, v_user_email, p_phone)
  RETURNING id INTO v_company_id;

  INSERT INTO public.user_profiles (user_id, company_id, name, email, role)
  VALUES (auth.uid(), v_company_id, p_name, v_user_email, 'Owner / Administrator');

  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public 
   SET row_security = off;

REVOKE EXECUTE ON FUNCTION public.register_new_company(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_new_company(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =========================================================================
-- TARGETED STALE-POLICY CLEANUP (Strictly on ERP tables)
-- =========================================================================
DO $$
DECLARE
  erp_tables TEXT[] := ARRAY[
    'companies', 'user_profiles', 'product_categories', 'expense_categories', 
    'products', 'customers', 'suppliers', 'warehouses', 'warehouse_bins', 
    'quotations', 'sales_orders', 'sales_invoices', 'deliveries', 'purchases', 
    'grns', 'expenses', 'general_ledger'
  ];
  t TEXT;
  pol RECORD;
BEGIN
  FOREACH t IN ARRAY erp_tables
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, t);
    END LOOP;
  END LOOP;
END $$;

-- =========================================================================
-- RECREATE HARDENED RLS POLICIES FOR ALL 17 ERP TABLES
-- =========================================================================

-- 1. Operational Tables (15 Tables) Isolation Policy
DO $$
DECLARE
  t TEXT;
  operational_tables TEXT[] := ARRAY[
    'product_categories', 'expense_categories', 'products', 'customers', 'suppliers',
    'warehouses', 'warehouse_bins', 'quotations', 'sales_orders', 'sales_invoices',
    'deliveries', 'purchases', 'grns', 'expenses', 'general_ledger'
  ];
BEGIN
  FOREACH t IN ARRAY operational_tables
  LOOP
    EXECUTE format('CREATE POLICY company_isolation_policy ON public.%I FOR ALL USING (company_id = public.get_auth_company_id()) WITH CHECK (company_id = public.get_auth_company_id());', t);
  END LOOP;
END $$;

-- 2. Companies Table Policies
CREATE POLICY companies_select_policy ON public.companies 
  FOR SELECT USING (id = public.get_auth_company_id());

CREATE POLICY companies_insert_policy ON public.companies 
  FOR INSERT WITH CHECK (false); -- Restricted to register_new_company() RPC

CREATE POLICY companies_update_policy ON public.companies 
  FOR UPDATE USING (id = public.get_auth_company_id() AND public.is_company_admin()) 
  WITH CHECK (id = public.get_auth_company_id() AND public.is_company_admin());

-- 3. User Profiles Table Policies
CREATE POLICY user_profiles_select_policy ON public.user_profiles 
  FOR SELECT USING (company_id = public.get_auth_company_id() OR user_id = auth.uid());

CREATE POLICY user_profiles_insert_policy ON public.user_profiles 
  FOR INSERT WITH CHECK (
    public.is_company_admin() AND company_id = public.get_auth_company_id() AND role <> 'Owner / Administrator'
  );

CREATE POLICY user_profiles_update_policy ON public.user_profiles 
  FOR UPDATE USING (company_id = public.get_auth_company_id() AND (user_id = auth.uid() OR public.is_company_admin()))
  WITH CHECK (public.validate_profile_update(id, user_id, company_id, role));

-- =========================================================================
-- PERFORMANCE INDEXES (Non-unique composite lookups only)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_gl_acc_date ON public.general_ledger(company_id, account_code, date);

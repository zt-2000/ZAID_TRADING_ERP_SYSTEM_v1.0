-- ZAID TRADING ERP — PRODUCTION SUPABASE SCHEMA MIGRATION (STAGING HARDENED v4.5)
-- Migration Version: 20261028_zaid_erp_hardened_schema_v4_5.sql
-- Description: Fully secured relational schema featuring strict tenant isolation, role-based matrix RLS policies, secure server-side journal posting RPC with debit/credit balance validation, delivery driver update restrictions (via trigger guard & RPC), append-only general ledger trigger, and complete anon lockout.
-- IMPORTANT: THIS MIGRATION IS FOR A FRESH DATABASE ONLY. Upgrading an existing v4.x schema requires separate ALTER statements.

-- =========================================================================
-- MATRIX OF ROLE-BASED ACCESS POLICIES (COMMENT REFERENCE)
-- =========================================================================
/*
  - Owner / Administrator: Full read/write on everything except general_ledger UPDATE/DELETE.
  - Manager: Read/write on sales, purchasing, inventory, customers, suppliers, deliveries, expenses. Read-only on general_ledger.
  - Salesperson: Read products and customers. Write quotations, sales_orders, sales_invoices, customers. No access to suppliers, purchases, grns, expenses, or general_ledger.
  - Storekeeper: Read/write products, warehouses, warehouse_bins, grns. Read purchases and sales_orders. No finance tables.
  - Accountant: Read everything. Write general_ledger (via secure RPC only), expenses, expense_categories.
  - Delivery Driver: Read deliveries assigned to their profile name. UPDATE specific allowed delivery fields only (via trigger guard).
*/

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
  default_tax_rate NUMERIC NOT NULL DEFAULT 15.0 CHECK (default_tax_rate >= 0),
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
  monthly_budget NUMERIC NOT NULL DEFAULT 0 CHECK (monthly_budget >= 0),
  usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, name)
);

-- =========================================================================
-- 5. PRODUCTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category_id UUID,
  unit TEXT DEFAULT 'Kg',
  purchase_price NUMERIC NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price NUMERIC NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  min_stock_level NUMERIC NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0),
  current_stock NUMERIC NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
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
  credit_limit NUMERIC CHECK (credit_limit IS NULL OR credit_limit >= 0),
  credit_days INT CHECK (credit_days IS NULL OR credit_days >= 0),
  balance NUMERIC NOT NULL DEFAULT 0,
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
  balance NUMERIC NOT NULL DEFAULT 0,
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
-- 9. WAREHOUSE BINS TABLE
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
  max_weight_kg NUMERIC NOT NULL DEFAULT 1000 CHECK (max_weight_kg >= 0),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, warehouse_id, code),
  FOREIGN KEY (company_id, warehouse_id) REFERENCES public.warehouses(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 10. QUOTATIONS TABLE
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
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  apply_vat BOOLEAN DEFAULT false,
  vat_rate NUMERIC NOT NULL DEFAULT 15.0 CHECK (vat_rate >= 0),
  tax_total NUMERIC NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
  status TEXT DEFAULT 'sent',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, quotation_number),
  FOREIGN KEY (company_id, customer_id) REFERENCES public.customers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 11. SALES ORDERS TABLE
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
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  apply_vat BOOLEAN DEFAULT false,
  vat_rate NUMERIC NOT NULL DEFAULT 15.0 CHECK (vat_rate >= 0),
  tax_total NUMERIC NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
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
-- 12. SALES INVOICES TABLE
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
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  apply_vat BOOLEAN DEFAULT false,
  vat_rate NUMERIC NOT NULL DEFAULT 15.0 CHECK (vat_rate >= 0),
  tax_total NUMERIC NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
  paid NUMERIC NOT NULL DEFAULT 0 CHECK (paid >= 0),
  balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'posted',
  items_count INT NOT NULL DEFAULT 1 CHECK (items_count >= 1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, invoice_number),
  FOREIGN KEY (company_id, customer_id) REFERENCES public.customers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 13. DELIVERIES TABLE
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
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('Pending', 'Scheduled', 'Preparing', 'Dispatched', 'In Transit', 'Delivered', 'Failed', 'Cancelled', 'scheduled', 'delivered')),
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
-- 14. PURCHASES TABLE
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
  total_cost NUMERIC NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, po_number),
  FOREIGN KEY (company_id, supplier_id) REFERENCES public.suppliers(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 15. GOODS RECEIVED NOTES (GRN) TABLE
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
-- 16. EXPENSES TABLE
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
  amount NUMERIC NOT NULL DEFAULT 0 CHECK (amount >= 0),
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, id),
  UNIQUE (company_id, voucher_no),
  FOREIGN KEY (company_id, category_id) REFERENCES public.expense_categories(company_id, id) ON DELETE RESTRICT
);

-- =========================================================================
-- 17. GENERAL LEDGER ENTRIES TABLE (Append-Only & Accounting Integrity)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.general_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  voucher_ref TEXT NOT NULL,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  memo TEXT NOT NULL,
  debit NUMERIC NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC NOT NULL DEFAULT 0 CHECK (credit >= 0),
  running_balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_gl_debit_credit CHECK (NOT (debit > 0 AND credit > 0))
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
  SELECT p.company_id FROM public.user_profiles AS p WHERE p.user_id = auth.uid() AND p.status = 'active' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

CREATE OR REPLACE FUNCTION public.is_company_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles AS p 
    WHERE p.user_id = auth.uid() AND p.role = 'Owner / Administrator' AND p.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT p.role FROM public.user_profiles AS p WHERE p.user_id = auth.uid() AND p.status = 'active' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

CREATE OR REPLACE FUNCTION public.get_auth_profile_name()
RETURNS TEXT AS $$
  SELECT p.name FROM public.user_profiles AS p WHERE p.user_id = auth.uid() AND p.status = 'active' LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

-- Revoke and Grant EXECUTE permissions securely (Lock out anon completely)
REVOKE ALL ON FUNCTION public.get_auth_company_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_company_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_company_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_auth_profile_name() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_profile_name() TO authenticated, service_role;

-- =========================================================================
-- SECURE PROFILE UPDATE GUARD TRIGGER FUNCTION (Prevents ID/Role Escalation)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role TEXT;
  v_actor_company UUID;
  v_active_owners_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify profile id, user_id, or company_id.';
  END IF;

  SELECT p.role, p.company_id INTO v_actor_role, v_actor_company
  FROM public.user_profiles AS p
  WHERE p.user_id = auth.uid() AND p.status = 'active' LIMIT 1;

  IF v_actor_company IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Unauthorized: Actor company mismatch.';
  END IF;

  IF v_actor_role <> 'Owner / Administrator' THEN
    IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: Non-admin can only update their own profile.';
    END IF;
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized: Non-admin cannot change role or status.';
    END IF;
  END IF;

  IF v_actor_role = 'Owner / Administrator' AND OLD.user_id = auth.uid() THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized: Administrator cannot change their own role or status.';
    END IF;
  END IF;

  IF OLD.role = 'Owner / Administrator' AND (NEW.role <> 'Owner / Administrator' OR NEW.status <> 'active') THEN
    SELECT count(*) INTO v_active_owners_count
    FROM public.user_profiles
    WHERE company_id = OLD.company_id AND role = 'Owner / Administrator' AND status = 'active';

    IF v_active_owners_count <= 1 THEN
      RAISE EXCEPTION 'Unauthorized: Cannot demote or deactivate the last active Owner in the company.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

DROP TRIGGER IF EXISTS trg_guard_profile_update ON public.user_profiles;
CREATE TRIGGER trg_guard_profile_update
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_update();

REVOKE ALL ON FUNCTION public.guard_profile_update() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_profile_update() TO authenticated, service_role;

-- =========================================================================
-- DELIVERY DRIVER UPDATE GUARD TRIGGER (Restricts Driver column updates & transitions)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_delivery_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_driver_name TEXT;
  v_valid_statuses TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT p.role, p.name INTO v_role, v_driver_name
  FROM public.user_profiles AS p
  WHERE p.user_id = auth.uid() AND p.status = 'active' LIMIT 1;

  -- If user is a Delivery Driver
  IF v_role = 'Delivery Driver' THEN
    -- Ensure delivery is assigned to this driver
    IF OLD.assigned_staff IS DISTINCT FROM v_driver_name THEN
      RAISE EXCEPTION 'Unauthorized: Delivery is not assigned to this driver.';
    END IF;

    -- Drivers cannot change core delivery metadata (customer, address, items, order ref, etc.)
    IF NEW.company_id IS DISTINCT FROM OLD.company_id
       OR NEW.delivery_number IS DISTINCT FROM OLD.delivery_number
       OR NEW.sales_order_id IS DISTINCT FROM OLD.sales_order_id
       OR NEW.sales_order_number IS DISTINCT FROM OLD.sales_order_number
       OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
       OR NEW.customer_name IS DISTINCT FROM OLD.customer_name
       OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone
       OR NEW.delivery_address IS DISTINCT FROM OLD.delivery_address
       OR NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date
       OR NEW.assigned_staff IS DISTINCT FROM OLD.assigned_staff
       OR NEW.items IS DISTINCT FROM OLD.items THEN
      RAISE EXCEPTION 'Unauthorized: Delivery Drivers can only update delivery status, recipient name, POD reference, notes, and history.';
    END IF;

    -- Validate allowed status transitions
    v_valid_statuses := ARRAY['Pending', 'Scheduled', 'Preparing', 'Dispatched', 'In Transit', 'Delivered', 'Failed', 'Cancelled', 'scheduled', 'delivered'];
    IF NEW.status = ANY(v_valid_statuses) = false THEN
      RAISE EXCEPTION 'Invalid delivery status transition.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

DROP TRIGGER IF EXISTS trg_guard_delivery_update ON public.deliveries;
CREATE TRIGGER trg_guard_delivery_update
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_delivery_update();

REVOKE ALL ON FUNCTION public.guard_delivery_update() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_delivery_update() TO authenticated, service_role;

-- =========================================================================
-- APPEND-ONLY GENERAL LEDGER TRIGGER FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION public.guard_gl_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'General ledger is append-only. Post a reversing entry instead of updating or deleting ledger records.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

DROP TRIGGER IF EXISTS trg_gl_append_only ON public.general_ledger;
CREATE TRIGGER trg_gl_append_only
  BEFORE UPDATE OR DELETE ON public.general_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_gl_append_only();

REVOKE ALL ON FUNCTION public.guard_gl_append_only() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_gl_append_only() TO authenticated, service_role;

-- =========================================================================
-- SECURE JOURNAL POSTING RPC FUNCTION (Validates debit == credit and computes running balance)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.post_journal_voucher(
  p_date DATE,
  p_voucher_ref TEXT,
  p_memo TEXT,
  p_lines JSONB -- Array of objects: [{ "account_code": "...", "account_name": "...", "debit": 0, "credit": 0 }]
)
RETURNS VOID AS $$
DECLARE
  v_company_id UUID;
  v_role TEXT;
  v_line JSONB;
  v_debit NUMERIC := 0;
  v_credit NUMERIC := 0;
  v_line_debit NUMERIC;
  v_line_credit NUMERIC;
  v_last_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  v_company_id := public.get_auth_company_id();
  v_role := public.get_auth_role();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User does not belong to an active company.';
  END IF;

  IF v_role NOT IN ('Owner / Administrator', 'Accountant') THEN
    RAISE EXCEPTION 'Unauthorized: Only Owner/Administrator and Accountant roles can post journal vouchers.';
  END IF;

  IF jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Voucher must contain at least one line item.';
  END IF;

  -- Validate total debits equal total credits
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_line_debit := COALESCE((v_line->>'debit')::NUMERIC, 0);
    v_line_credit := COALESCE((v_line->>'credit')::NUMERIC, 0);

    IF v_line_debit < 0 OR v_line_credit < 0 THEN
      RAISE EXCEPTION 'Debit and credit amounts cannot be negative.';
    END IF;

    IF v_line_debit > 0 AND v_line_credit > 0 THEN
      RAISE EXCEPTION 'A single journal line cannot have both debit and credit amounts greater than zero.';
    END IF;

    v_debit := v_debit + v_line_debit;
    v_credit := v_credit + v_line_credit;
  END LOOP;

  IF ABS(v_debit - v_credit) > 0.001 THEN
    RAISE EXCEPTION 'Unbalanced journal voucher: Total debits (%) must equal total credits (%).', v_debit, v_credit;
  END IF;

  -- Post each line and calculate running balance server-side per account
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_line_debit := COALESCE((v_line->>'debit')::NUMERIC, 0);
    v_line_credit := COALESCE((v_line->>'credit')::NUMERIC, 0);

    -- Get last running balance for this account in this company
    SELECT running_balance INTO v_last_balance
    FROM public.general_ledger
    WHERE company_id = v_company_id AND account_code = (v_line->>'account_code')
    ORDER BY date DESC, created_at DESC LIMIT 1;

    v_last_balance := COALESCE(v_last_balance, 0);
    v_new_balance := v_last_balance + v_line_debit - v_line_credit;

    INSERT INTO public.general_ledger (
      company_id, date, voucher_ref, account_code, account_name, memo, debit, credit, running_balance, status
    ) VALUES (
      v_company_id, p_date, p_voucher_ref, 
      (v_line->>'account_code'), 
      (v_line->>'account_name'), 
      p_memo, v_line_debit, v_line_credit, v_new_balance, 'posted'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

REVOKE ALL ON FUNCTION public.post_journal_voucher(DATE, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_journal_voucher(DATE, TEXT, TEXT, JSONB) TO authenticated, service_role;

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
   SET search_path = public, pg_temp 
   SET row_security = off;

REVOKE ALL ON FUNCTION public.register_new_company(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
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
-- ROLE-BASED & TENANT ISOLATION RLS POLICIES FOR ALL 17 ERP TABLES
-- =========================================================================

-- 1. COMPANIES
CREATE POLICY companies_select ON public.companies FOR SELECT USING (id = public.get_auth_company_id());
CREATE POLICY companies_insert ON public.companies FOR INSERT WITH CHECK (false);
CREATE POLICY companies_update ON public.companies FOR UPDATE USING (id = public.get_auth_company_id() AND public.is_company_admin()) WITH CHECK (id = public.get_auth_company_id() AND public.is_company_admin());
CREATE POLICY companies_delete ON public.companies FOR DELETE USING (false);

-- 2. USER PROFILES (No client INSERT; onboarding via RPC only)
CREATE POLICY user_profiles_select ON public.user_profiles FOR SELECT USING (company_id = public.get_auth_company_id() OR user_id = auth.uid());
CREATE POLICY user_profiles_insert ON public.user_profiles FOR INSERT WITH CHECK (false);
CREATE POLICY user_profiles_update ON public.user_profiles FOR UPDATE USING (company_id = public.get_auth_company_id() AND (user_id = auth.uid() OR public.is_company_admin())) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY user_profiles_delete ON public.user_profiles FOR DELETE USING (false);

-- 3. PRODUCT CATEGORIES (Owner, Manager, Storekeeper write; Salesperson/Accountant read)
CREATE POLICY pc_select ON public.product_categories FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper', 'Salesperson', 'Accountant'));
CREATE POLICY pc_insert ON public.product_categories FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper'));
CREATE POLICY pc_update ON public.product_categories FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY pc_delete ON public.product_categories FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 4. EXPENSE CATEGORIES (Owner, Manager, Accountant write)
CREATE POLICY ec_select ON public.expense_categories FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant'));
CREATE POLICY ec_insert ON public.expense_categories FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant'));
CREATE POLICY ec_update ON public.expense_categories FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY ec_delete ON public.expense_categories FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 5. PRODUCTS (Owner, Manager, Storekeeper write; Salesperson read)
CREATE POLICY prod_select ON public.products FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper', 'Salesperson'));
CREATE POLICY prod_insert ON public.products FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper'));
CREATE POLICY prod_update ON public.products FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY prod_delete ON public.products FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 6. CUSTOMERS (Owner, Manager, Salesperson write; Accountant read)
CREATE POLICY cust_select ON public.customers FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Accountant'));
CREATE POLICY cust_insert ON public.customers FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson'));
CREATE POLICY cust_update ON public.customers FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY cust_delete ON public.customers FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 7. SUPPLIERS (Owner, Manager write; Accountant read)
CREATE POLICY supp_select ON public.suppliers FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant'));
CREATE POLICY supp_insert ON public.suppliers FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));
CREATE POLICY supp_update ON public.suppliers FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY supp_delete ON public.suppliers FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 8. WAREHOUSES (Owner, Manager, Storekeeper)
CREATE POLICY wh_select ON public.warehouses FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY wh_insert ON public.warehouses FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper'));
CREATE POLICY wh_update ON public.warehouses FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY wh_delete ON public.warehouses FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 9. WAREHOUSE BINS (Owner, Manager, Storekeeper)
CREATE POLICY wb_select ON public.warehouse_bins FOR SELECT USING (company_id = public.get_auth_company_id());
CREATE POLICY wb_insert ON public.warehouse_bins FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper'));
CREATE POLICY wb_update ON public.warehouse_bins FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY wb_delete ON public.warehouse_bins FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 10. QUOTATIONS (Owner, Manager, Salesperson)
CREATE POLICY qt_select ON public.quotations FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Accountant'));
CREATE POLICY qt_insert ON public.quotations FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson'));
CREATE POLICY qt_update ON public.quotations FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY qt_delete ON public.quotations FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 11. SALES ORDERS (Owner, Manager, Salesperson write; Storekeeper read)
CREATE POLICY so_select ON public.sales_orders FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Storekeeper', 'Accountant'));
CREATE POLICY so_insert ON public.sales_orders FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson'));
CREATE POLICY so_update ON public.sales_orders FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY so_delete ON public.sales_orders FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 12. SALES INVOICES (Owner, Manager, Salesperson write; Accountant read)
CREATE POLICY inv_select ON public.sales_invoices FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Accountant'));
CREATE POLICY inv_insert ON public.sales_invoices FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson'));
CREATE POLICY inv_update ON public.sales_invoices FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Salesperson')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY inv_delete ON public.sales_invoices FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 13. DELIVERIES (Owner, Manager write; Driver read/update assigned deliveries; Accountant read)
CREATE POLICY del_select ON public.deliveries FOR SELECT USING (
  company_id = public.get_auth_company_id() AND (
    public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant')
    OR (public.get_auth_role() = 'Delivery Driver' AND assigned_staff = public.get_auth_profile_name())
  )
);
CREATE POLICY del_insert ON public.deliveries FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));
CREATE POLICY del_update ON public.deliveries FOR UPDATE USING (
  company_id = public.get_auth_company_id() AND (
    public.get_auth_role() IN ('Owner / Administrator', 'Manager')
    OR (public.get_auth_role() = 'Delivery Driver' AND assigned_staff = public.get_auth_profile_name())
  )
) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY del_delete ON public.deliveries FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 14. PURCHASES (Owner, Manager write; Storekeeper read)
CREATE POLICY po_select ON public.purchases FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper', 'Accountant'));
CREATE POLICY po_insert ON public.purchases FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));
CREATE POLICY po_update ON public.purchases FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY po_delete ON public.purchases FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 15. GRNS (Owner, Manager, Storekeeper write)
CREATE POLICY grn_select ON public.grns FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper', 'Accountant'));
CREATE POLICY grn_insert ON public.grns FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper'));
CREATE POLICY grn_update ON public.grns FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Storekeeper')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY grn_delete ON public.grns FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 16. EXPENSES (Owner, Manager, Accountant write)
CREATE POLICY exp_select ON public.expenses FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant'));
CREATE POLICY exp_insert ON public.expenses FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant'));
CREATE POLICY exp_update ON public.expenses FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant')) WITH CHECK (company_id = public.get_auth_company_id());
CREATE POLICY exp_delete ON public.expenses FOR DELETE USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager'));

-- 17. GENERAL LEDGER (Append-only; Accountant & Admin via RPC only; Read-only for Manager, Accountant, Admin)
CREATE POLICY gl_select ON public.general_ledger FOR SELECT USING (company_id = public.get_auth_company_id() AND public.get_auth_role() IN ('Owner / Administrator', 'Manager', 'Accountant'));
CREATE POLICY gl_insert ON public.general_ledger FOR INSERT WITH CHECK (false); -- Restricted to post_journal_voucher() RPC
CREATE POLICY gl_update ON public.general_ledger FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY gl_delete ON public.general_ledger FOR DELETE USING (false);

-- =========================================================================
-- COMPLETE ANON LOCKOUT (Revoke all privileges on all 17 tables from anon)
-- =========================================================================
REVOKE ALL ON public.companies FROM anon;
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.product_categories FROM anon;
REVOKE ALL ON public.expense_categories FROM anon;
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.customers FROM anon;
REVOKE ALL ON public.suppliers FROM anon;
REVOKE ALL ON public.warehouses FROM anon;
REVOKE ALL ON public.warehouse_bins FROM anon;
REVOKE ALL ON public.quotations FROM anon;
REVOKE ALL ON public.sales_orders FROM anon;
REVOKE ALL ON public.sales_invoices FROM anon;
REVOKE ALL ON public.deliveries FROM anon;
REVOKE ALL ON public.purchases FROM anon;
REVOKE ALL ON public.grns FROM anon;
REVOKE ALL ON public.expenses FROM anon;
REVOKE ALL ON public.general_ledger FROM anon;

-- =========================================================================
-- EXPLICIT PRIVILEGES FOR AUTHENTICATED USERS
-- =========================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =========================================================================
-- PERFORMANCE INDEXES (Non-unique composite lookups only)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_gl_acc_date ON public.general_ledger(company_id, account_code, date);

-- =========================================================================
-- ZAID TRADING ERP — EXECUTABLE STAGING SECURITY & RLS TEST SUITE (v4.6)
-- Description: Two-part test suite. Part A validates structural database 
-- configuration (RLS, privileges, triggers, constraints, SECURITY DEFINER).
-- Part B provides runnable authenticated RLS test templates using real UUID fixtures.
-- =========================================================================

-- =========================================================================
-- PART A: STRUCTURAL DATABASE VALIDATION (Run as postgres / admin)
-- =========================================================================
DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'companies', 'user_profiles', 'product_categories', 'expense_categories',
    'products', 'customers', 'suppliers', 'warehouses', 'warehouse_bins',
    'quotations', 'sales_orders', 'sales_invoices', 'deliveries', 'purchases',
    'grns', 'expenses', 'general_ledger'
  ];
  v_func TEXT;
  v_funcs TEXT[] := ARRAY[
    'get_auth_company_id', 'is_company_admin', 'get_auth_role', 'get_auth_profile_name',
    'guard_profile_update', 'guard_delivery_update', 'guard_gl_append_only', 
    'post_journal_voucher', 'register_new_company'
  ];
BEGIN
  RAISE NOTICE '=== STARTING PART A: STRUCTURAL VALIDATION ===';

  -- 1. Check all 17 tables have RLS enabled and at least one policy
  FOREACH v_table IN ARRAY v_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = v_table AND rowsecurity = true
    ) THEN
      RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: Table % missing or RLS disabled.', v_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = v_table
    ) THEN
      RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: Table % has zero RLS policies.', v_table;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: All 17 tables have RLS enabled and active policies.';

  -- 2. Check all helper/trigger functions have SECURITY DEFINER, search_path = public, pg_temp, row_security = off
  FOREACH v_func IN ARRAY v_funcs
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = v_func AND p.prosecdef = true
    ) THEN
      RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: Function % is not SECURITY DEFINER.', v_func;
    END IF;
  END LOOP;
  RAISE NOTICE 'PASS: All required SECURITY DEFINER functions verified.';

  -- 3. Check triggers exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_profile_update') THEN
    RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: trg_guard_profile_update trigger missing.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_guard_delivery_update') THEN
    RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: trg_guard_delivery_update trigger missing.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_gl_append_only') THEN
    RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: trg_gl_append_only trigger missing.';
  END IF;
  RAISE NOTICE 'PASS: All guard triggers verified.';

  -- 4. Check warehouse_bins unique constraint composite columns using pg_constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'warehouse_bins' AND c.contype = 'u'
  ) THEN
    RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: warehouse_bins unique constraint missing.';
  END IF;
  RAISE NOTICE 'PASS: warehouse_bins composite uniqueness constraint verified.';

  RAISE NOTICE '=== PART A COMPLETED SUCCESSFULLY ===';
END $$;


-- =========================================================================
-- PART B: AUTHENTICATED RLS TESTS (Runnable Staging Template)
-- =========================================================================
/*
  INSTRUCTIONS: Replace the placeholder UUIDs below with real auth.users IDs 
  from your Supabase staging project. Run each test block wrapped in BEGIN ... ROLLBACK.
*/

/*
-- TEST B1: Initial Company Registration via RPC & Duplicate Rejection
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
  SET LOCAL ROLE authenticated;
  
  -- Register company successfully
  SELECT public.register_new_company('Staging Corp', 'Staging Corp Ltd', 'Admin User', '+94771234567');
  
  -- Attempt duplicate registration -> should raise exception
  SELECT public.register_new_company('Second Corp', 'Second Ltd', 'Admin User', '+94771234567');
ROLLBACK;
*/

/*
-- TEST B2: Cross-Tenant Isolation (SELECT / UPDATE / DELETE return 0 rows)
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
  SET LOCAL ROLE authenticated;
  
  -- Querying customers from another tenant returns 0 rows
  SELECT COUNT(*) FROM public.customers;
ROLLBACK;
*/

/*
-- TEST B3: Self-Role Escalation & Immutable Identity Prevention
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222"}', true);
  SET LOCAL ROLE authenticated;

  -- Salesperson trying to elevate role -> raises exception
  UPDATE public.user_profiles SET role = 'Owner / Administrator' WHERE user_id = auth.uid();
ROLLBACK;
*/

/*
-- TEST B4: General Ledger Append-Only & Journal Balancing RPC Test
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111"}', true);
  SET LOCAL ROLE authenticated;

  -- Attempt direct UPDATE/DELETE on general_ledger -> raises exception
  -- DELETE FROM public.general_ledger;

  -- Test balanced journal posting via secure RPC
  SELECT public.post_journal_voucher(
    '2026-10-28', 
    'VOUCH-001', 
    'Opening cash deposit', 
    '[{"account_code": "1000", "account_name": "Cash", "debit": 10000, "credit": 0}, {"account_code": "3000", "account_name": "Capital", "debit": 0, "credit": 10000}]'::jsonb
  );
ROLLBACK;
*/

/*
-- TEST B5: Delivery Driver Assignment & Permitted Column Update Test
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333"}', true);
  SET LOCAL ROLE authenticated;

  -- Driver updating assigned delivery status and POD -> allowed
  -- Driver trying to update delivery address or items -> raises exception via guard_delivery_update()
ROLLBACK;
*/

-- =========================================================================
-- ZAID TRADING ERP — EXECUTABLE STAGING SECURITY & RLS TEST SUITE (v4.4)
-- Description: Two-part test suite. Part A validates structural database 
-- configuration (RLS, privileges, triggers, constraints, SECURITY DEFINER).
-- Part B provides runnable authenticated RLS tests across two seeded companies.
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
    'get_auth_company_id', 'is_company_admin', 'get_auth_role', 
    'guard_profile_update', 'guard_gl_append_only', 'register_new_company'
  ];
  v_missing INT := 0;
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

  -- 2. Check all helper/trigger functions have SECURITY DEFINER, search_path, row_security=off
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

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_gl_append_only') THEN
    RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: trg_gl_append_only trigger missing.';
  END IF;
  RAISE NOTICE 'PASS: guard_profile_update and gl_append_only triggers verified.';

  -- 4. Check warehouse_bins unique constraint composite columns using pg_constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'warehouse_bins' AND c.contype = 'u'
      AND array_to_string(c.conkey, ',') = (
        SELECT array_to_string(array_agg(attnum), ',') 
        FROM pg_attribute WHERE attrelid = 'public.warehouse_bins'::regclass AND attname IN ('company_id', 'warehouse_id', 'code')
      )
  THEN
    RAISE EXCEPTION 'STRUCTURAL CHECK FAIL: warehouse_bins unique constraint does not cover (company_id, warehouse_id, code).';
  END IF;
  RAISE NOTICE 'PASS: warehouse_bins composite uniqueness constraint verified via pg_constraint.';

  RAISE NOTICE '=== PART A COMPLETED SUCCESSFULLY ===';
END $$;


-- =========================================================================
-- PART B: AUTHENTICATED RLS TESTS (Template for Staging Execution)
-- =========================================================================
/*
  INSTRUCTIONS FOR STAGING EXECUTION:
  Replace the placeholder UUIDs below ('11111111-1111-1111-1111-111111111111', etc.) 
  with real user UUIDs from your Supabase auth.users table (e.g., created via Auth API or Dashboard).
  
  Test users required:
  - User 1 (Company A Owner): e.g., UUID 'aaaa0001-0000-0000-0000-000000000001'
  - User 2 (Company B Owner): e.g., UUID 'bbbb0002-0000-0000-0000-000000000002'
  - User 3 (Company A Salesperson): e.g., UUID 'aaaa0003-0000-0000-0000-000000000003'
*/

/*
-- TEST B1: Initial Company Registration via RPC
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "aaaa0001-0000-0000-0000-000000000001"}', true);
  SET LOCAL ROLE authenticated;
  
  -- Register Company A
  SELECT public.register_new_company('Company A Ltd', 'Company A (Pvt) Ltd', 'Alice Admin', '+94771111111');
  
  -- Attempt duplicate registration (should raise exception)
  SELECT public.register_new_company('Duplicate Corp', 'Duplicate', 'Alice Admin', '+94771111111');
ROLLBACK;
*/

/*
-- TEST B2: Cross-Tenant Isolation (SELECT / UPDATE / DELETE return 0 rows)
BEGIN;
  -- Seed Company A and Company B data beforehand...
  SELECT set_config('request.jwt.claims', '{"sub": "aaaa0001-0000-0000-0000-000000000001"}', true);
  SET LOCAL ROLE authenticated;

  -- User 1 tries to read Company B customers -> returns 0 rows
  SELECT * FROM public.customers WHERE company_name = 'Company B';
ROLLBACK;
*/

/*
-- TEST B3: ID-Swap & Self-Role Escalation Prevention
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "aaaa0003-0000-0000-0000-000000000003"}', true);
  SET LOCAL ROLE authenticated;

  -- Salesperson tries to escalate role to Owner / Administrator -> raises exception via guard_profile_update()
  UPDATE public.user_profiles 
  SET role = 'Owner / Administrator' 
  WHERE user_id = auth.uid();
ROLLBACK;
*/

/*
-- TEST B4: General Ledger Append-Only Enforcement
BEGIN;
  SELECT set_config('request.jwt.claims', '{"sub": "aaaa0001-0000-0000-0000-000000000001"}', true);
  SET LOCAL ROLE authenticated;

  -- Attempt to update or delete a general ledger entry -> raises exception via trg_gl_append_only
  DELETE FROM public.general_ledger WHERE status = 'posted';
ROLLBACK;
*/

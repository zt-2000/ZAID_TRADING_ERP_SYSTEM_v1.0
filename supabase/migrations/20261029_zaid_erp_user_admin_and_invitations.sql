-- =========================================================================
-- ZAID TRADING ERP — USER ADMINISTRATION & SECURE INVITATIONS MIGRATION (v4.7)
-- Description: Server-side invitation tracking, onboarding completion RPC, 
-- and administrative user removal RPC with guardrails.
-- =========================================================================

-- 1. Create user_invitations table for secure invitation tracking
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  job_title TEXT,
  role TEXT NOT NULL CHECK (role IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Storekeeper', 'Accountant', 'Delivery Driver')),
  assigned_warehouse TEXT,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (company_id, email)
);

ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_invitations_select ON public.user_invitations;
CREATE POLICY user_invitations_select ON public.user_invitations 
  FOR SELECT USING (company_id = public.get_auth_company_id() AND public.is_company_admin());

DROP POLICY IF EXISTS user_invitations_insert ON public.user_invitations;
CREATE POLICY user_invitations_insert ON public.user_invitations 
  FOR INSERT WITH CHECK (company_id = public.get_auth_company_id() AND public.is_company_admin());

DROP POLICY IF EXISTS user_invitations_update ON public.user_invitations;
CREATE POLICY user_invitations_update ON public.user_invitations 
  FOR UPDATE USING (company_id = public.get_auth_company_id() AND public.is_company_admin())
  WITH CHECK (company_id = public.get_auth_company_id() AND public.is_company_admin());

DROP POLICY IF EXISTS user_invitations_delete ON public.user_invitations;
CREATE POLICY user_invitations_delete ON public.user_invitations 
  FOR DELETE USING (company_id = public.get_auth_company_id() AND public.is_company_admin());

REVOKE ALL ON public.user_invitations FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invitations TO authenticated, service_role;

-- 2. Secure Server-Side Function: admin_invite_user
CREATE OR REPLACE FUNCTION public.admin_invite_user(
  p_email TEXT,
  p_name TEXT,
  p_role TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_job_title TEXT DEFAULT NULL,
  p_assigned_warehouse TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_company_id UUID;
  v_clean_email TEXT;
  v_existing_auth_user_id UUID;
  v_invitation_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT public.is_company_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only Owner / Administrator can invite users.';
  END IF;

  v_company_id := public.get_auth_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Administrator does not belong to an active company.';
  END IF;

  v_clean_email := lower(trim(p_email));
  IF v_clean_email = '' OR position('@' in v_clean_email) = 0 THEN
    RAISE EXCEPTION 'Invalid email address provided.';
  END IF;

  IF p_role NOT IN ('Owner / Administrator', 'Manager', 'Salesperson', 'Storekeeper', 'Accountant', 'Delivery Driver') THEN
    RAISE EXCEPTION 'Invalid role specified: %', p_role;
  END IF;

  -- Check if user profile already exists
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE email = v_clean_email) THEN
    RAISE EXCEPTION 'A user profile with email % already exists in the system.', v_clean_email;
  END IF;

  -- Record the invitation
  INSERT INTO public.user_invitations (
    company_id, email, name, display_name, phone, job_title, role, assigned_warehouse, invited_by, status
  ) VALUES (
    v_company_id, v_clean_email, p_name, COALESCE(p_display_name, p_name), p_phone, p_job_title, p_role, p_assigned_warehouse, auth.uid(), 'pending'
  )
  ON CONFLICT (company_id, email) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    phone = EXCLUDED.phone,
    job_title = EXCLUDED.job_title,
    role = EXCLUDED.role,
    assigned_warehouse = EXCLUDED.assigned_warehouse,
    status = 'pending',
    created_at = now()
  RETURNING id INTO v_invitation_id;

  -- If auth user already exists in auth.users, create their profile immediately
  SELECT id INTO v_existing_auth_user_id FROM auth.users WHERE lower(email) = v_clean_email LIMIT 1;
  IF v_existing_auth_user_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (
      user_id, company_id, name, display_name, email, phone, job_title, role, assigned_warehouse, status
    ) VALUES (
      v_existing_auth_user_id, v_company_id, p_name, COALESCE(p_display_name, p_name), v_clean_email, p_phone, p_job_title, p_role, p_assigned_warehouse, 'active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      company_id = EXCLUDED.company_id,
      name = EXCLUDED.name,
      display_name = EXCLUDED.display_name,
      role = EXCLUDED.role,
      status = 'active';

    UPDATE public.user_invitations SET status = 'accepted' WHERE id = v_invitation_id;
  END IF;

  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

REVOKE ALL ON FUNCTION public.admin_invite_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_invite_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 3. Secure Server-Side Function: complete_user_registration (for invited users on login)
CREATE OR REPLACE FUNCTION public.complete_user_registration()
RETURNS UUID AS $$
DECLARE
  v_user_email TEXT;
  v_invitation RECORD;
  v_profile_id UUID;
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  -- If already has profile, return it
  SELECT id INTO v_profile_id FROM public.user_profiles WHERE user_id = auth.uid() LIMIT 1;
  IF v_profile_id IS NOT NULL THEN
    RETURN v_profile_id;
  END IF;

  SELECT lower(email) INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User email not found in auth.';
  END IF;

  -- Find pending invitation
  SELECT count(*) INTO v_count
  FROM public.user_invitations 
  WHERE lower(email) = v_user_email AND status = 'pending';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'No pending invitation found for email %.', v_user_email;
  ELSIF v_count > 1 THEN
    RAISE EXCEPTION 'Multiple pending invitations found for email %. Please contact your company administrator.', v_user_email;
  END IF;

  SELECT * INTO v_invitation 
  FROM public.user_invitations 
  WHERE lower(email) = v_user_email AND status = 'pending';


  -- Create user profile linked to invitation company and role
  INSERT INTO public.user_profiles (
    user_id, company_id, name, display_name, email, phone, job_title, role, assigned_warehouse, status
  ) VALUES (
    auth.uid(), v_invitation.company_id, v_invitation.name, v_invitation.display_name, v_user_email, v_invitation.phone, v_invitation.job_title, v_invitation.role, v_invitation.assigned_warehouse, 'active'
  )
  RETURNING id INTO v_profile_id;

  UPDATE public.user_invitations SET status = 'accepted' WHERE id = v_invitation.id;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

REVOKE ALL ON FUNCTION public.complete_user_registration() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_user_registration() TO authenticated, service_role;

-- 4. Secure Server-Side Function: admin_delete_user
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_profile_id UUID)
RETURNS VOID AS $$
DECLARE
  v_company_id UUID;
  v_target_user_id UUID;
  v_target_role TEXT;
  v_active_owners_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NOT public.is_company_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only Owner / Administrator can remove users.';
  END IF;

  v_company_id := public.get_auth_company_id();

  SELECT user_id, role INTO v_target_user_id, v_target_role
  FROM public.user_profiles
  WHERE id = p_profile_id AND company_id = v_company_id;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found in your company.';
  END IF;

  IF v_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Administrators cannot delete their own account.';
  END IF;

  IF v_target_role = 'Owner / Administrator' THEN
    SELECT count(*) INTO v_active_owners_count
    FROM public.user_profiles
    WHERE company_id = v_company_id AND role = 'Owner / Administrator' AND status = 'active';

    IF v_active_owners_count <= 1 THEN
      RAISE EXCEPTION 'Unauthorized: Cannot remove the last active Owner in the company.';
    END IF;
  END IF;

  DELETE FROM public.user_profiles WHERE id = p_profile_id AND company_id = v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
   SET search_path = public, pg_temp 
   SET row_security = off;

REVOKE ALL ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated, service_role;


-- 1) Move has_role to a private schema not exposed to PostgREST
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- 2) Recreate policies to use private.has_role
DROP POLICY IF EXISTS "own_or_admin_all_memorization" ON public.memorization;
CREATE POLICY "own_or_admin_all_memorization" ON public.memorization FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "own_or_admin_all_murojaah" ON public.murojaah;
CREATE POLICY "own_or_admin_all_murojaah" ON public.murojaah FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "own_or_admin_delete_students" ON public.students;
CREATE POLICY "own_or_admin_delete_students" ON public.students FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "own_or_admin_select_students" ON public.students;
CREATE POLICY "own_or_admin_select_students" ON public.students FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "own_or_admin_update_students" ON public.students;
CREATE POLICY "own_or_admin_update_students" ON public.students FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK ((auth.uid() = user_id) OR private.has_role(auth.uid(),'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role));

-- 3) Drop public.has_role now that nothing references it
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

-- 4) Revoke execute on handle_new_user (trigger-only) so it isn't callable via API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 5) Add INSERT policy for profiles so users can create their own row (fallback if trigger absent)
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 6) Explicit admin-only write policies on user_roles (prevent self-assignment)
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role));

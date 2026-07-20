
-- Ensure trigger exists for future users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profile & admin role for existing user
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id = '75409c9e-d5b8-4cdc-ad54-8bb7ec0ed5f4'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES ('75409c9e-d5b8-4cdc-ad54-8bb7ec0ed5f4', 'admin')
ON CONFLICT DO NOTHING;

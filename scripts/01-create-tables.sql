-- Combined idempotent script: public.profiles, trigger, FK, RLS policies, grants
-- Assumption: owner role for granting execute is 'postgres'. Replace if needed.

--  Create table if not exists (keeps constraints consistent)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  n8n_key text,
  n8n_endpoint text
);

--  Comments (optional metadata)
COMMENT ON TABLE public.profiles IS 'User profile table (linked to auth.users)';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN public.profiles.full_name IS 'Full name of the user';
COMMENT ON COLUMN public.profiles.n8n_key IS 'n8n integration key (optional)';
COMMENT ON COLUMN public.profiles.n8n_endpoint IS 'n8n integration endpoint (optional)';

--  Index for common lookups
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles (full_name);

--  Ensure FK from public.profiles.id -> auth.users.id exists (safe/no-op if present)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'profiles'
      AND kcu.column_name = 'id'
  ) THEN
    EXECUTE '
      ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    ';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping FK creation for public.profiles(id) -> auth.users(id): %', SQLERRM;
END;
$do$ LANGUAGE plpgsql;

--  Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--  Create (or replace) SECURITY DEFINER trigger function to create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user_create_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If no user id, nothing to do
  IF NEW.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert profile only if not present
  INSERT INTO public.profiles (id, full_name)
  SELECT NEW.id,
         COALESCE(
           NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
           NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
           NULLIF(NEW.email, '')
         )
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.id);

  RETURN NEW;
END;
$$;

--  Revoke broad execute and grant to owner role (adjust owner role if needed)
REVOKE EXECUTE ON FUNCTION public.handle_new_user_create_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_create_profile() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_create_profile() TO postgres;

--  Create the trigger on auth.users to call the function AFTER INSERT (ensure idempotent)
DROP TRIGGER IF EXISTS create_profile_after_user_insert ON auth.users;
CREATE TRIGGER create_profile_after_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_create_profile();

--  Helper to create policy if not exists (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(
  p_schemaname text,
  p_tablename text,
  p_policyname text,
  p_definition text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = p_schemaname
      AND tablename = p_tablename
      AND policyname = p_policyname
  ) THEN
    EXECUTE p_definition;
  END IF;
END;
$$;

--  CREATE SELECT policy if missing
SELECT public.create_policy_if_not_exists(
  'public',
  'profiles',
  'profiles_select_own',
  $policy$
    CREATE POLICY profiles_select_own
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = (SELECT auth.uid()));
  $policy$
);

--  CREATE INSERT policy if missing
SELECT public.create_policy_if_not_exists(
  'public',
  'profiles',
  'profiles_insert_own',
  $policy$
    CREATE POLICY profiles_insert_own
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = (SELECT auth.uid()));
  $policy$
);

-- 12) CREATE UPDATE policy if missing
SELECT public.create_policy_if_not_exists(
  'public',
  'profiles',
  'profiles_update_own',
  $policy$
    CREATE POLICY profiles_update_own
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));
  $policy$
);

-- 13) CREATE DELETE policy if missing
SELECT public.create_policy_if_not_exists(
  'public',
  'profiles',
  'profiles_delete_own',
  $policy$
    CREATE POLICY profiles_delete_own
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (id = (SELECT auth.uid()));
  $policy$
);

--  Cleanup helper function
DROP FUNCTION IF EXISTS public.create_policy_if_not_exists(text, text, text, text);

--  Grants: authenticated users allowed; keep anon out unless explicitly desired
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
-- If you want anonymous users to have access, uncomment the following line:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;

-- End
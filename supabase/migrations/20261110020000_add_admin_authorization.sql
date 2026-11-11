-- Review before applying. Accounts remain farmers unless an operator promotes them.
ALTER TABLE public.profiles
    ADD COLUMN role TEXT NOT NULL DEFAULT 'farmer';

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('farmer', 'admin'));

-- Browser profile writes cannot choose or change the role.
REVOKE INSERT, UPDATE ON public.profiles FROM public, anon, authenticated;
REVOKE INSERT (role), UPDATE (role) ON public.profiles FROM public, anon, authenticated;

GRANT INSERT (id, full_name, mobile, city, district, state, pin_code)
    ON public.profiles TO authenticated;

GRANT UPDATE (full_name, mobile, city, district, state, pin_code)
    ON public.profiles TO authenticated;

-- Owner privileges allow aggregate counts, but the caller's database role is checked first.
CREATE FUNCTION public.admin_dashboard_counts()
RETURNS TABLE (users_count BIGINT, products_count BIGINT, orders_count BIGINT)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY SELECT
        (SELECT count(*) FROM auth.users),
        (SELECT count(*) FROM public.products),
        (SELECT count(*) FROM public.orders);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_counts()
    FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_counts()
    TO authenticated;

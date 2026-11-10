-- Review before applying. Profiles remain private; only public sellers' names are returned.
CREATE FUNCTION public.marketplace_seller_names(seller_ids UUID[])
RETURNS TABLE (seller_id UUID, full_name TEXT)
LANGUAGE SQL
STABLE
-- Owner privileges are needed only for this narrow name projection.
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT profiles.id, profiles.full_name
    FROM public.profiles
    WHERE profiles.id = ANY (seller_ids)
        AND EXISTS (
            SELECT 1
            FROM public.products
            WHERE products.seller_id = profiles.id
                AND products.listing_status = 'published'
                AND products.available_quantity > 0
        );
$$;

REVOKE ALL ON FUNCTION public.marketplace_seller_names(UUID[])
    FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.marketplace_seller_names(UUID[])
    TO anon, authenticated;

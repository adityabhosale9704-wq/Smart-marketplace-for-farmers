-- Review before applying. Enables seller product management without privileged keys.
GRANT INSERT (
    seller_id,
    name,
    category,
    description,
    price,
    unit,
    available_quantity,
    city,
    district,
    state,
    harvest_date,
    listing_status
) ON public.products TO authenticated;

-- IDs, ownership, measurement unit and timestamps cannot be updated by sellers.
GRANT UPDATE (
    name,
    price,
    available_quantity,
    listing_status
) ON public.products TO authenticated;

-- A farmer can create listings only for their own authenticated ID.
CREATE POLICY products_insert_own ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (seller_id = (SELECT auth.uid()));

-- A farmer can edit only their own listings and cannot transfer ownership.
CREATE POLICY products_update_own ON public.products
    FOR UPDATE TO authenticated
    USING (seller_id = (SELECT auth.uid()))
    WITH CHECK (seller_id = (SELECT auth.uid()));

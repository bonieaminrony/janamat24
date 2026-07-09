DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.ad_banners'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%placement_type%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.ad_banners DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.ad_banners
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS ad_type TEXT DEFAULT 'single_image',
ADD COLUMN IF NOT EXISTS company_logo TEXT;

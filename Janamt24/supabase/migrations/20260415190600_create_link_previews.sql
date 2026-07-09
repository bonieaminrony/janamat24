-- Create link_previews table for caching URL metadata
CREATE TABLE IF NOT EXISTS public.link_previews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    domain TEXT,
    title TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_link_previews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_link_previews_updated_at
    BEFORE UPDATE ON public.link_previews
    FOR EACH ROW
    EXECUTE FUNCTION update_link_previews_updated_at();

-- Set RLS policies
ALTER TABLE public.link_previews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cached link previews
CREATE POLICY "Public users can read link previews"
    ON public.link_previews
    FOR SELECT
    USING (true);

-- Allow service role to insert/update (Edge Functions)
CREATE POLICY "Service role can manage link previews"
    ON public.link_previews
    USING (true)
    WITH CHECK (true);

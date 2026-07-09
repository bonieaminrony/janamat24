-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  votes_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.polls FOR SELECT
  USING ( true );

CREATE POLICY "Public poll options are viewable by everyone."
  ON public.poll_options FOR SELECT
  USING ( true );

-- Restrict updates/inserts to admin only, except viewing
CREATE POLICY "Only admins can insert or update polls"
  ON public.polls FOR ALL
  USING ( public.is_admin_or_editor(auth.uid()) );

CREATE POLICY "Only admins can insert or update options"
  ON public.poll_options FOR ALL
  USING ( public.is_admin_or_editor(auth.uid()) );

-- Create an RPC to securely increment votes globally without allowing full update access to the user
CREATE OR REPLACE FUNCTION vote_poll_option(p_option_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.poll_options
  SET votes_count = votes_count + 1
  WHERE id = p_option_id;
END;
$$;

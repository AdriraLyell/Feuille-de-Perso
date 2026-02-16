-- Enable RLS (already enabled but good practice to state)
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Create policy for Admins to have full access (UPDATE, DELETE)
-- Existing policy only allows SELECT
CREATE POLICY "Admins can manage all characters"
ON public.characters
FOR ALL
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

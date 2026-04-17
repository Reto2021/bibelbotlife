-- Add new columns to resource_library
ALTER TABLE public.resource_library
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS country text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tradition text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hymnal_ref text DEFAULT NULL;

-- Make created_by nullable for system resources
ALTER TABLE public.resource_library ALTER COLUMN created_by DROP NOT NULL;

-- Create index for system resources
CREATE INDEX IF NOT EXISTS idx_resource_library_is_system ON public.resource_library (is_system) WHERE is_system = true;
CREATE INDEX IF NOT EXISTS idx_resource_library_country ON public.resource_library (country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resource_library_tradition ON public.resource_library (tradition) WHERE tradition IS NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own resources" ON public.resource_library;
DROP POLICY IF EXISTS "Users can create resources" ON public.resource_library;
DROP POLICY IF EXISTS "Users can update own resources" ON public.resource_library;
DROP POLICY IF EXISTS "Users can delete own resources" ON public.resource_library;

-- New RLS policies

-- Everyone can read system resources
CREATE POLICY "Authenticated can read system resources"
  ON public.resource_library FOR SELECT
  TO authenticated
  USING (is_system = true);

-- Users can read their own non-system resources
CREATE POLICY "Users can read own resources"
  ON public.resource_library FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() AND is_system = false);

-- Users can create non-system resources
CREATE POLICY "Users can create resources"
  ON public.resource_library FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND is_system = false);

-- Users can update their own non-system resources
CREATE POLICY "Users can update own resources"
  ON public.resource_library FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND is_system = false);

-- Users can delete their own non-system resources
CREATE POLICY "Users can delete own resources"
  ON public.resource_library FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND is_system = false);

-- Admins can manage system resources
CREATE POLICY "Admins can manage system resources"
  ON public.resource_library FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role manages resources"
  ON public.resource_library FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
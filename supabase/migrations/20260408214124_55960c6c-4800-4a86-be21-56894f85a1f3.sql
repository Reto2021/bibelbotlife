
-- Enums for service types and statuses
CREATE TYPE public.service_type AS ENUM ('regular', 'baptism', 'wedding', 'funeral', 'confirmation', 'communion', 'special', 'other');
CREATE TYPE public.service_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.confession_tradition AS ENUM ('catholic', 'reformed', 'lutheran', 'evangelical', 'secular');
CREATE TYPE public.resource_type AS ENUM ('song', 'prayer', 'reading', 'liturgy', 'other');
CREATE TYPE public.team_role AS ENUM ('pastor', 'musician', 'lector', 'sacristan', 'technician', 'volunteer', 'other');

-- ============================================
-- 1. services
-- ============================================
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  service_date DATE NOT NULL,
  service_time TIME,
  service_type public.service_type NOT NULL DEFAULT 'regular',
  tradition public.confession_tradition NOT NULL DEFAULT 'reformed',
  status public.service_status NOT NULL DEFAULT 'draft',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  series_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services of their church"
  ON public.services FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create services"
  ON public.services FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their services"
  ON public.services FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their services"
  ON public.services FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX idx_services_church ON public.services(church_id);
CREATE INDEX idx_services_date ON public.services(service_date);
CREATE INDEX idx_services_created_by ON public.services(created_by);

-- ============================================
-- 2. service_templates
-- ============================================
CREATE TABLE public.service_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.church_partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tradition public.confession_tradition NOT NULL DEFAULT 'reformed',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates or defaults"
  ON public.service_templates FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_default = true);

CREATE POLICY "Users can create templates"
  ON public.service_templates FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates"
  ON public.service_templates FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates"
  ON public.service_templates FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ============================================
-- 3. resource_library
-- ============================================
CREATE TABLE public.resource_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.church_partners(id) ON DELETE CASCADE,
  resource_type public.resource_type NOT NULL DEFAULT 'song',
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'de',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.resource_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resources"
  ON public.resource_library FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create resources"
  ON public.resource_library FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own resources"
  ON public.resource_library FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own resources"
  ON public.resource_library FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX idx_resource_tags ON public.resource_library USING GIN(tags);
CREATE INDEX idx_resource_type ON public.resource_library(resource_type);

-- ============================================
-- 4. service_series
-- ============================================
CREATE TABLE public.service_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID REFERENCES public.church_partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own series"
  ON public.service_series FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create series"
  ON public.service_series FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own series"
  ON public.service_series FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own series"
  ON public.service_series FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Add FK from services to series
ALTER TABLE public.services
  ADD CONSTRAINT services_series_fk FOREIGN KEY (series_id) REFERENCES public.service_series(id) ON DELETE SET NULL;

-- ============================================
-- 5. service_team_members
-- ============================================
CREATE TABLE public.service_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.church_partners(id) ON DELETE CASCADE,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  role public.team_role NOT NULL DEFAULT 'volunteer',
  availability JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team members"
  ON public.service_team_members FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create team members"
  ON public.service_team_members FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own team members"
  ON public.service_team_members FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own team members"
  ON public.service_team_members FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX idx_team_church ON public.service_team_members(church_id);
CREATE INDEX idx_team_role ON public.service_team_members(role);

-- ============================================
-- Shared updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_templates_updated_at BEFORE UPDATE ON public.service_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resource_library_updated_at BEFORE UPDATE ON public.resource_library FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_series_updated_at BEFORE UPDATE ON public.service_series FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_team_members_updated_at BEFORE UPDATE ON public.service_team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

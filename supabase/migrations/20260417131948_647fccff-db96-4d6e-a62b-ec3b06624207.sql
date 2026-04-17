
-- Add lesson-specific service types
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'lesson';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'double_lesson';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'project_day';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'confirmation_class';

-- Add interreligious tradition for RE
ALTER TYPE public.confession_tradition ADD VALUE IF NOT EXISTS 'interreligious';

-- Add lesson-specific resource types
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'worksheet';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE public.resource_type ADD VALUE IF NOT EXISTS 'image';

-- Add lesson-specific team roles
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'co_teacher';
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'student_assistant';
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'mentor';

-- Add lesson-specific columns to services table
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS class_name TEXT,
  ADD COLUMN IF NOT EXISTS learning_objectives TEXT[],
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

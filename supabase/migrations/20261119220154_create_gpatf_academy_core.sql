/*
# Create GPATF 60+ academy core data model

1. New Tables
- `students`: private registration records connected to a Supabase account. Stores name, birth date, address, phone, emergency contact, comorbidities, profile image path, and active/blocked status.
- `workout_schedules`: the read-only training agenda visible to the student and editable by administration.
- `attendance`: the administration's official presence decision for a student and date.
- `attendance_confirmations`: the student's own confirmation that they attended a scheduled session.
- `absence_justifications`: absence explanations and optional uploaded documents awaiting administrative review.
- `announcements`: notices shown on the main panel, with optional expiration.

2. Security
- RLS is enabled on every new table.
- Authenticated students can access only their own private registration, agenda, attendance confirmation, and justifications.
- The administration account is identified by the fixed account email `adm@gpatf.local`, which matches the requested username `adm`.
- Administration can manage all academy records, while students can only read active notices and their own data.
- Student-controlled columns are separated from protected status and audit columns. Status changes use a protected function.
- The private `gpatf-files` storage bucket holds profile photos and justifications with account-folder policies.

3. Important Notes
- The frontend creates the first administration account on the first successful use of `adm` / `adm123`; no password is stored in this migration.
- Student access uses the phone number as the account identifier behind the scenes and asks the student to create a password.
- The fixed admin email is an implementation detail; the visible login remains `adm`.
*/

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  full_name text NOT NULL,
  birth_date date NOT NULL,
  address text NOT NULL,
  phone text NOT NULL,
  emergency_contact_name text NOT NULL,
  emergency_contact_phone text NOT NULL,
  comorbidities text NOT NULL DEFAULT '',
  avatar_path text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time,
  location text NOT NULL DEFAULT 'Academia GPATF',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'present', 'absent', 'justified')),
  note text NOT NULL DEFAULT '',
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.attendance_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.workout_schedules(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.absence_justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  absence_date date NOT NULL,
  reason text NOT NULL,
  file_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workout_schedules_student_date_idx ON public.workout_schedules (student_id, scheduled_date);
CREATE INDEX IF NOT EXISTS attendance_student_date_idx ON public.attendance (student_id, attendance_date);
CREATE INDEX IF NOT EXISTS absence_justifications_student_date_idx ON public.absence_justifications (student_id, absence_date);
CREATE INDEX IF NOT EXISTS announcements_active_created_idx ON public.announcements (active, created_at DESC);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_confirmations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.absence_justifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
REVOKE INSERT ON public.students FROM authenticated;
GRANT INSERT (full_name, birth_date, address, phone, emergency_contact_name, emergency_contact_phone, comorbidities, avatar_path) ON public.students TO authenticated;
REVOKE UPDATE ON public.students FROM authenticated;
GRANT UPDATE (full_name, birth_date, address, phone, emergency_contact_name, emergency_contact_phone, comorbidities, avatar_path) ON public.students TO authenticated;

DROP POLICY IF EXISTS "students_read_own_or_admin" ON public.students;
CREATE POLICY "students_read_own_or_admin" ON public.students FOR SELECT TO authenticated
USING (auth_id = auth.uid() OR (auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "students_create_own" ON public.students;
CREATE POLICY "students_create_own" ON public.students FOR INSERT TO authenticated
WITH CHECK (auth_id = auth.uid());
DROP POLICY IF EXISTS "students_update_own_or_admin" ON public.students;
CREATE POLICY "students_update_own_or_admin" ON public.students FOR UPDATE TO authenticated
USING (auth_id = auth.uid() OR (auth.jwt() ->> 'email') = 'adm@gpatf.local')
WITH CHECK (auth_id = auth.uid() OR (auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "students_delete_admin" ON public.students;
CREATE POLICY "students_delete_admin" ON public.students FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local');

DROP POLICY IF EXISTS "schedules_read_own_or_admin" ON public.workout_schedules;
CREATE POLICY "schedules_read_own_or_admin" ON public.workout_schedules FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.auth_id = auth.uid() OR (auth.jwt() ->> 'email') = 'adm@gpatf.local')));
DROP POLICY IF EXISTS "schedules_create_admin" ON public.workout_schedules;
CREATE POLICY "schedules_create_admin" ON public.workout_schedules FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "schedules_update_admin" ON public.workout_schedules;
CREATE POLICY "schedules_update_admin" ON public.workout_schedules FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local') WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "schedules_delete_admin" ON public.workout_schedules;
CREATE POLICY "schedules_delete_admin" ON public.workout_schedules FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local');

DROP POLICY IF EXISTS "attendance_read_own_or_admin" ON public.attendance;
CREATE POLICY "attendance_read_own_or_admin" ON public.attendance FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.auth_id = auth.uid() OR (auth.jwt() ->> 'email') = 'adm@gpatf.local')));
DROP POLICY IF EXISTS "attendance_create_admin" ON public.attendance;
CREATE POLICY "attendance_create_admin" ON public.attendance FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "attendance_update_admin" ON public.attendance;
CREATE POLICY "attendance_update_admin" ON public.attendance FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local') WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "attendance_delete_admin" ON public.attendance;
CREATE POLICY "attendance_delete_admin" ON public.attendance FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local');

DROP POLICY IF EXISTS "confirmations_read_own_or_admin" ON public.attendance_confirmations;
CREATE POLICY "confirmations_read_own_or_admin" ON public.attendance_confirmations FOR SELECT TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()) OR (auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "confirmations_create_own" ON public.attendance_confirmations;
CREATE POLICY "confirmations_create_own" ON public.attendance_confirmations FOR INSERT TO authenticated
WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()));
DROP POLICY IF EXISTS "confirmations_update_own" ON public.attendance_confirmations;
CREATE POLICY "confirmations_update_own" ON public.attendance_confirmations FOR UPDATE TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()))
WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()));
DROP POLICY IF EXISTS "confirmations_delete_own" ON public.attendance_confirmations;
CREATE POLICY "confirmations_delete_own" ON public.attendance_confirmations FOR DELETE TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()));

DROP POLICY IF EXISTS "justifications_read_own_or_admin" ON public.absence_justifications;
CREATE POLICY "justifications_read_own_or_admin" ON public.absence_justifications FOR SELECT TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()) OR (auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "justifications_create_own" ON public.absence_justifications;
CREATE POLICY "justifications_create_own" ON public.absence_justifications FOR INSERT TO authenticated
WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()));
DROP POLICY IF EXISTS "justifications_update_admin" ON public.absence_justifications;
CREATE POLICY "justifications_update_admin" ON public.absence_justifications FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local') WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "justifications_delete_own_or_admin" ON public.absence_justifications;
CREATE POLICY "justifications_delete_own_or_admin" ON public.absence_justifications FOR DELETE TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()) OR (auth.jwt() ->> 'email') = 'adm@gpatf.local');

DROP POLICY IF EXISTS "announcements_read_active_or_admin" ON public.announcements;
CREATE POLICY "announcements_read_active_or_admin" ON public.announcements FOR SELECT TO authenticated
USING (((active = true) AND (expires_at IS NULL OR expires_at > now())) OR (auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "announcements_create_admin" ON public.announcements;
CREATE POLICY "announcements_create_admin" ON public.announcements FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "announcements_update_admin" ON public.announcements;
CREATE POLICY "announcements_update_admin" ON public.announcements FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local') WITH CHECK ((auth.jwt() ->> 'email') = 'adm@gpatf.local');
DROP POLICY IF EXISTS "announcements_delete_admin" ON public.announcements;
CREATE POLICY "announcements_delete_admin" ON public.announcements FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'email') = 'adm@gpatf.local');

CREATE OR REPLACE FUNCTION public.set_student_status(p_student_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() ->> 'email') <> 'adm@gpatf.local' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_status NOT IN ('active', 'blocked', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.students SET status = p_status, updated_at = now() WHERE id = p_student_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_student_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_student_status(uuid, text) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('gpatf-files', 'gpatf-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "gpatf_files_read" ON storage.objects;
CREATE POLICY "gpatf_files_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (auth.jwt() ->> 'email') = 'adm@gpatf.local'));
DROP POLICY IF EXISTS "gpatf_files_insert" ON storage.objects;
CREATE POLICY "gpatf_files_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (auth.jwt() ->> 'email') = 'adm@gpatf.local'));
DROP POLICY IF EXISTS "gpatf_files_update" ON storage.objects;
CREATE POLICY "gpatf_files_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (auth.jwt() ->> 'email') = 'adm@gpatf.local'))
WITH CHECK (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (auth.jwt() ->> 'email') = 'adm@gpatf.local'));
DROP POLICY IF EXISTS "gpatf_files_delete" ON storage.objects;
CREATE POLICY "gpatf_files_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (auth.jwt() ->> 'email') = 'adm@gpatf.local'));

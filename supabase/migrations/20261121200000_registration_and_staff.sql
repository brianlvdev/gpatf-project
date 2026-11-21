-- Staff roles are assigned only by a trusted administrator via Supabase Auth.
CREATE OR REPLACE FUNCTION public.is_gpatf_admin()
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(auth.jwt() -> 'app_metadata' ->> 'gpatf_role' IN ('admin', 'master'), false);
$$;
REVOKE ALL ON FUNCTION public.is_gpatf_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gpatf_admin() TO authenticated;

DROP POLICY IF EXISTS "students_read_own_or_admin" ON public.students;
CREATE POLICY "students_read_own_or_admin" ON public.students FOR SELECT TO authenticated
USING (auth_id = auth.uid() OR (SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "students_create_own" ON public.students;
CREATE POLICY "students_create_own" ON public.students FOR INSERT TO authenticated
WITH CHECK (auth_id = auth.uid());
DROP POLICY IF EXISTS "students_update_own_or_admin" ON public.students;
CREATE POLICY "students_update_own_or_admin" ON public.students FOR UPDATE TO authenticated
USING (auth_id = auth.uid() OR (SELECT public.is_gpatf_admin()))
WITH CHECK (auth_id = auth.uid() OR (SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "students_delete_admin" ON public.students;
CREATE POLICY "students_delete_admin" ON public.students FOR DELETE TO authenticated
USING ((SELECT public.is_gpatf_admin()));

DROP POLICY IF EXISTS "schedules_read_own_or_admin" ON public.workout_schedules;
CREATE POLICY "schedules_read_own_or_admin" ON public.workout_schedules FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.auth_id = auth.uid() OR (SELECT public.is_gpatf_admin()))));
DROP POLICY IF EXISTS "schedules_create_admin" ON public.workout_schedules;
CREATE POLICY "schedules_create_admin" ON public.workout_schedules FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "schedules_update_admin" ON public.workout_schedules;
CREATE POLICY "schedules_update_admin" ON public.workout_schedules FOR UPDATE TO authenticated
USING ((SELECT public.is_gpatf_admin())) WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "schedules_delete_admin" ON public.workout_schedules;
CREATE POLICY "schedules_delete_admin" ON public.workout_schedules FOR DELETE TO authenticated
USING ((SELECT public.is_gpatf_admin()));

DROP POLICY IF EXISTS "attendance_read_own_or_admin" ON public.attendance;
CREATE POLICY "attendance_read_own_or_admin" ON public.attendance FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.auth_id = auth.uid() OR (SELECT public.is_gpatf_admin()))));
DROP POLICY IF EXISTS "attendance_create_admin" ON public.attendance;
CREATE POLICY "attendance_create_admin" ON public.attendance FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "attendance_update_admin" ON public.attendance;
CREATE POLICY "attendance_update_admin" ON public.attendance FOR UPDATE TO authenticated
USING ((SELECT public.is_gpatf_admin())) WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "attendance_delete_admin" ON public.attendance;
CREATE POLICY "attendance_delete_admin" ON public.attendance FOR DELETE TO authenticated
USING ((SELECT public.is_gpatf_admin()));

DROP POLICY IF EXISTS "confirmations_read_own_or_admin" ON public.attendance_confirmations;
CREATE POLICY "confirmations_read_own_or_admin" ON public.attendance_confirmations FOR SELECT TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()) OR (SELECT public.is_gpatf_admin()));
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
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()) OR (SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "justifications_create_own" ON public.absence_justifications;
CREATE POLICY "justifications_create_own" ON public.absence_justifications FOR INSERT TO authenticated
WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()));
DROP POLICY IF EXISTS "justifications_update_admin" ON public.absence_justifications;
CREATE POLICY "justifications_update_admin" ON public.absence_justifications FOR UPDATE TO authenticated
USING ((SELECT public.is_gpatf_admin())) WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "justifications_delete_own_or_admin" ON public.absence_justifications;
CREATE POLICY "justifications_delete_own_or_admin" ON public.absence_justifications FOR DELETE TO authenticated
USING (student_id IN (SELECT s.id FROM public.students s WHERE s.auth_id = auth.uid()) OR (SELECT public.is_gpatf_admin()));

DROP POLICY IF EXISTS "announcements_read_active_or_admin" ON public.announcements;
CREATE POLICY "announcements_read_active_or_admin" ON public.announcements FOR SELECT TO authenticated
USING (((active = true) AND (expires_at IS NULL OR expires_at > now())) OR (SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "announcements_create_admin" ON public.announcements;
CREATE POLICY "announcements_create_admin" ON public.announcements FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "announcements_update_admin" ON public.announcements;
CREATE POLICY "announcements_update_admin" ON public.announcements FOR UPDATE TO authenticated
USING ((SELECT public.is_gpatf_admin())) WITH CHECK ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "announcements_delete_admin" ON public.announcements;
CREATE POLICY "announcements_delete_admin" ON public.announcements FOR DELETE TO authenticated
USING ((SELECT public.is_gpatf_admin()));
DROP POLICY IF EXISTS "gpatf_files_read" ON storage.objects;
CREATE POLICY "gpatf_files_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (SELECT public.is_gpatf_admin())));
DROP POLICY IF EXISTS "gpatf_files_insert" ON storage.objects;
CREATE POLICY "gpatf_files_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (SELECT public.is_gpatf_admin())));
DROP POLICY IF EXISTS "gpatf_files_update" ON storage.objects;
CREATE POLICY "gpatf_files_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (SELECT public.is_gpatf_admin())))
WITH CHECK (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (SELECT public.is_gpatf_admin())));
DROP POLICY IF EXISTS "gpatf_files_delete" ON storage.objects;
CREATE POLICY "gpatf_files_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gpatf-files' AND ((storage.foldername(name))[2] = auth.uid()::text OR (SELECT public.is_gpatf_admin())));


CREATE OR REPLACE FUNCTION public.set_student_status(p_student_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_gpatf_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('active', 'blocked', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.students SET status = p_status, updated_at = now() WHERE id = p_student_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_student_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_student_status(uuid, text) TO authenticated;

-- The registration function owns profile creation and sets the Auth ID explicitly.
DROP POLICY IF EXISTS "students_create_own" ON public.students;
REVOKE INSERT (full_name, birth_date, address, phone, emergency_contact_name, emergency_contact_phone, comorbidities, avatar_path) ON public.students FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.students TO service_role;
ALTER TABLE public.students
  ADD COLUMN medical_certificate_path text,
  ADD COLUMN medical_certificate_issued_on date,
  ADD COLUMN medical_certificate_expires_on date GENERATED ALWAYS AS
    ((medical_certificate_issued_on + INTERVAL '1 year')::date) STORED,
  ADD CONSTRAINT medical_certificate_complete CHECK
    ((medical_certificate_path IS NULL) = (medical_certificate_issued_on IS NULL));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gpatf-certificates', 'gpatf-certificates', false, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "gpatf_certificates_read_admin" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'gpatf-certificates' AND (SELECT public.is_gpatf_admin()));

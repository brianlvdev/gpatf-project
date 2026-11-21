-- Restrictive policies remain effective alongside legacy permissive policies.
-- Use trusted app_metadata only; never user_metadata.
CREATE POLICY active_student_profile ON public.students AS RESTRICTIVE FOR ALL TO authenticated
USING (status = 'active' OR coalesce(auth.jwt()->'app_metadata'->>'gpatf_role' IN ('admin','master'), false))
WITH CHECK (status = 'active' OR coalesce(auth.jwt()->'app_metadata'->>'gpatf_role' IN ('admin','master'), false));

DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['workout_schedules','attendance','attendance_confirmations','absence_justifications','announcements'] LOOP
    EXECUTE format(
      'CREATE POLICY active_account_required ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (coalesce(auth.jwt()->''app_metadata''->>''gpatf_role'' IN (''admin'',''master''), false)
         OR EXISTS (SELECT 1 FROM public.students s WHERE s.auth_id = auth.uid() AND s.status = ''active''))
       WITH CHECK (coalesce(auth.jwt()->''app_metadata''->>''gpatf_role'' IN (''admin'',''master''), false)
         OR EXISTS (SELECT 1 FROM public.students s WHERE s.auth_id = auth.uid() AND s.status = ''active''))', target);
  END LOOP;
END $$;

CREATE POLICY active_file_owner ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING (bucket_id NOT IN ('gpatf-files','gpatf-certificates')
  OR coalesce(auth.jwt()->'app_metadata'->>'gpatf_role' IN ('admin','master'), false)
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.auth_id = auth.uid() AND s.status = 'active'))
WITH CHECK (bucket_id NOT IN ('gpatf-files','gpatf-certificates')
  OR coalesce(auth.jwt()->'app_metadata'->>'gpatf_role' IN ('admin','master'), false)
  OR EXISTS (SELECT 1 FROM public.students s WHERE s.auth_id = auth.uid() AND s.status = 'active'));

-- A student must not approve their own justification during INSERT.
CREATE POLICY justification_starts_pending ON public.absence_justifications AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (status = 'pending' AND admin_note = '' AND reviewed_at IS NULL AND reviewed_by IS NULL
  AND length(trim(reason)) BETWEEN 1 AND 5000
  AND (file_path IS NULL OR file_path LIKE 'justifications/' || auth.uid()::text || '/%'));

-- Confirm only the student's own scheduled session and matching date.
CREATE POLICY confirmation_matches_schedule ON public.attendance_confirmations AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_schedules w
  WHERE w.id = schedule_id AND w.student_id = attendance_confirmations.student_id
    AND w.scheduled_date = attendance_date AND w.status = 'scheduled'));
CREATE POLICY confirmation_update_matches_schedule ON public.attendance_confirmations AS RESTRICTIVE FOR UPDATE TO authenticated
USING (true)
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_schedules w
  WHERE w.id = schedule_id AND w.student_id = attendance_confirmations.student_id
    AND w.scheduled_date = attendance_date AND w.status = 'scheduled'));

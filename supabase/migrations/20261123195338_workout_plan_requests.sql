CREATE TABLE public.workout_plan_requests (
 student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
 requested_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_plan_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workout_plan_requests FROM anon,authenticated;
GRANT SELECT ON public.workout_plan_requests TO authenticated;
GRANT INSERT(student_id) ON public.workout_plan_requests TO authenticated;
CREATE POLICY workout_requests_read ON public.workout_plan_requests FOR SELECT TO authenticated
USING((SELECT public.is_gpatf_admin()) OR EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.auth_id=auth.uid() AND s.status='active'));
CREATE POLICY workout_requests_create_own ON public.workout_plan_requests FOR INSERT TO authenticated
WITH CHECK(EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.auth_id=auth.uid() AND s.status='active') AND NOT EXISTS(SELECT 1 FROM public.student_workout_plans p WHERE p.student_id=workout_plan_requests.student_id));

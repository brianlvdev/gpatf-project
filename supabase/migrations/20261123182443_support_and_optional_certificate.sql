ALTER TABLE public.students DROP CONSTRAINT medical_certificate_complete;
ALTER TABLE public.students ADD CONSTRAINT certificate_date_needs_file CHECK(medical_certificate_issued_on IS NULL OR medical_certificate_path IS NOT NULL);
CREATE TABLE public.support_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
 sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id), author_name text NOT NULL DEFAULT '',
 is_staff boolean NOT NULL DEFAULT false, body text NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 5000), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_messages FROM anon,authenticated;
GRANT SELECT,INSERT ON public.support_messages TO authenticated;
CREATE POLICY support_read ON public.support_messages FOR SELECT TO authenticated USING((SELECT public.is_gpatf_admin()) OR EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.auth_id=auth.uid() AND s.status='active'));
CREATE POLICY support_send ON public.support_messages FOR INSERT TO authenticated WITH CHECK(sender_id=auth.uid() AND ((SELECT public.is_gpatf_admin()) OR EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.auth_id=auth.uid() AND s.status='active')));
CREATE FUNCTION private.stamp_support_message() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 NEW.sender_id=auth.uid(); NEW.is_staff=public.is_gpatf_admin(); NEW.created_at=now();
 IF NEW.is_staff THEN SELECT full_name INTO NEW.author_name FROM public.collaborators WHERE id=auth.uid() AND active;
 ELSE SELECT full_name INTO NEW.author_name FROM public.students WHERE id=NEW.student_id AND auth_id=auth.uid() AND status='active'; END IF;
 IF NEW.author_name IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.stamp_support_message() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stamp_support_message BEFORE INSERT ON public.support_messages FOR EACH ROW EXECUTE FUNCTION private.stamp_support_message();
CREATE TABLE public.support_reads(user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,message_id uuid NOT NULL REFERENCES public.support_messages(id) ON DELETE CASCADE, PRIMARY KEY(user_id,message_id));
ALTER TABLE public.support_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.support_reads FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.support_reads TO authenticated;
CREATE POLICY reads_own ON public.support_reads FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.support_messages m WHERE m.id=message_id));
CREATE INDEX support_student_time ON public.support_messages(student_id,created_at);

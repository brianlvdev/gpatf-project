CREATE SCHEMA IF NOT EXISTS private;
CREATE TABLE public.collaborators (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL, email text NOT NULL, role text NOT NULL, active boolean NOT NULL DEFAULT true
);
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.collaborators FROM anon, authenticated;
GRANT SELECT ON public.collaborators TO authenticated;
CREATE POLICY staff_directory ON public.collaborators FOR SELECT TO authenticated USING ((SELECT public.is_gpatf_admin()));

CREATE FUNCTION private.sync_gpatf_collaborator() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.raw_app_meta_data->>'gpatf_role' IN ('admin','master') THEN
  INSERT INTO public.collaborators(id,full_name,email,role,active)
  VALUES(NEW.id,coalesce(nullif(NEW.raw_app_meta_data->>'full_name',''),nullif(NEW.raw_user_meta_data->>'full_name',''),split_part(NEW.email,'@',1)),NEW.email,NEW.raw_app_meta_data->>'gpatf_role',true)
  ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name,email=excluded.email,role=excluded.role,active=true;
 ELSE
  UPDATE public.collaborators SET active=false WHERE id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.sync_gpatf_collaborator() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_gpatf_collaborator AFTER INSERT OR UPDATE OF raw_app_meta_data,raw_user_meta_data,email ON auth.users FOR EACH ROW EXECUTE FUNCTION private.sync_gpatf_collaborator();
INSERT INTO public.collaborators(id,full_name,email,role)
SELECT id,coalesce(nullif(raw_app_meta_data->>'full_name',''),nullif(raw_user_meta_data->>'full_name',''),split_part(email,'@',1)),email,raw_app_meta_data->>'gpatf_role'
FROM auth.users WHERE raw_app_meta_data->>'gpatf_role' IN ('admin','master');

CREATE TABLE public.student_workout_plans (
 student_id uuid PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
 exercises jsonb NOT NULL CHECK(jsonb_typeof(exercises)='array' AND jsonb_array_length(exercises) BETWEEN 1 AND 100),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=5000),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_by_name text NOT NULL DEFAULT '', updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 updated_by_name text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_workout_plans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_workout_plans FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.student_workout_plans TO authenticated;
CREATE POLICY plan_read ON public.student_workout_plans FOR SELECT TO authenticated USING (
 (SELECT public.is_gpatf_admin()) OR EXISTS(SELECT 1 FROM public.students s WHERE s.id=student_id AND s.auth_id=auth.uid() AND s.status='active'));
CREATE POLICY plan_insert_staff ON public.student_workout_plans FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_gpatf_admin()));
CREATE POLICY plan_update_staff ON public.student_workout_plans FOR UPDATE TO authenticated USING ((SELECT public.is_gpatf_admin())) WITH CHECK ((SELECT public.is_gpatf_admin()));
CREATE FUNCTION private.stamp_gpatf_plan() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE person text; item jsonb;
BEGIN
 SELECT full_name INTO person FROM public.collaborators WHERE id=auth.uid() AND active;
 IF person IS NULL OR NOT public.is_gpatf_admin() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(NEW.exercises) LOOP
  IF jsonb_typeof(item)<>'object' OR coalesce(length(item->>'name'),0) NOT BETWEEN 1 AND 180 OR coalesce(length(item->>'group'),0) NOT BETWEEN 1 AND 180
     OR coalesce(length(item->>'id'),0) NOT BETWEEN 1 AND 100 OR coalesce(length(item->>'sets'),0)>60 OR coalesce(length(item->>'reps'),0)>60
     OR coalesce(length(item->>'load'),0)>60 OR coalesce(length(item->>'rest'),0)>60 THEN RAISE EXCEPTION 'Invalid exercise'; END IF;
 END LOOP;
 IF TG_OP='INSERT' THEN NEW.created_by=auth.uid(); NEW.created_by_name=person;
 ELSE NEW.created_by=OLD.created_by; NEW.created_by_name=OLD.created_by_name; END IF;
 NEW.updated_by=auth.uid(); NEW.updated_by_name=person; NEW.updated_at=now(); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.stamp_gpatf_plan() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stamp_gpatf_plan BEFORE INSERT OR UPDATE ON public.student_workout_plans FOR EACH ROW EXECUTE FUNCTION private.stamp_gpatf_plan();

ALTER TABLE public.announcements ADD COLUMN image_url text CHECK(image_url IS NULL OR image_url ~ '^https://'), ADD COLUMN link_url text CHECK(link_url IS NULL OR link_url ~ '^https://');
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('gpatf-announcements','gpatf-announcements',true,5242880,ARRAY['image/jpeg','image/png','image/webp']);
CREATE POLICY announcements_media_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='gpatf-announcements' AND (SELECT public.is_gpatf_admin()));
CREATE POLICY announcements_media_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='gpatf-announcements' AND (SELECT public.is_gpatf_admin()));
CREATE POLICY announcements_media_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='gpatf-announcements' AND (SELECT public.is_gpatf_admin()));

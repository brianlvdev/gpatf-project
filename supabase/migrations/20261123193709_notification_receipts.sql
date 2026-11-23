CREATE TABLE public.notification_receipts(user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,event_key text NOT NULL CHECK(length(event_key) BETWEEN 1 AND 400),read_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,event_key));
ALTER TABLE public.notification_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_receipts FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.notification_receipts TO authenticated;
CREATE POLICY notification_receipts_own ON public.notification_receipts FOR ALL TO authenticated USING(user_id=(SELECT auth.uid())) WITH CHECK(user_id=(SELECT auth.uid()));

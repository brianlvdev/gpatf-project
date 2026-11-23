ALTER TABLE public.announcements
 ADD COLUMN kind text NOT NULL DEFAULT 'announcement' CHECK(kind IN ('notice','announcement')),
 ADD COLUMN removed_at timestamptz;
DROP POLICY announcements_read_active_or_admin ON public.announcements;
CREATE POLICY announcements_read_active_or_admin ON public.announcements FOR SELECT TO authenticated
USING ((SELECT public.is_gpatf_admin()) OR (removed_at IS NULL AND active AND (expires_at IS NULL OR expires_at>now())));

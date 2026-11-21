import { FormEvent, useState } from 'react';
import { Announcement } from '@/types';
import { supabase } from '@/lib/supabase';
import AnnouncementCarousel from './AnnouncementCarousel';

export type CreateAnnouncement = (title: string, message: string, media?: { image_url: string | null; link_url: string | null }) => Promise<void>;
export default function AnnouncementsManager({ announcements, onCreate, onToggle, onDelete }: { announcements: Announcement[]; onCreate: CreateAnnouncement; onToggle: (id: string, active: boolean) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const fields = new FormData(form); setBusy(true); setMessage(''); let uploaded: string | null = null;
    try {
      const link = String(fields.get('link') ?? '').trim(); if (link && new URL(link).protocol !== 'https:') throw new Error('Use um link que comece com https://.');
      const image = fields.get('image'); let imageUrl: string | null = null;
      if (image instanceof File && image.size) {
        if (image.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(image.type)) throw new Error('Escolha uma imagem JPG, PNG ou WebP de até 5 MB.');
        uploaded = `${crypto.randomUUID()}.${image.type.split('/')[1]}`; const upload = await supabase.storage.from('gpatf-announcements').upload(uploaded, image); if (upload.error) throw new Error('Não foi possível enviar a imagem.'); imageUrl = supabase.storage.from('gpatf-announcements').getPublicUrl(uploaded).data.publicUrl;
      }
      await onCreate(String(fields.get('title')), String(fields.get('message')), { image_url: imageUrl, link_url: link || null }); form.reset(); setMessage('Anúncio publicado no carrossel.'); uploaded = null;
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível publicar.'); if (uploaded) await supabase.storage.from('gpatf-announcements').remove([uploaded]); } finally { setBusy(false); }
  }
  async function action(work: () => Promise<void>) { setBusy(true); try { await work(); setMessage('Anúncio atualizado.'); } catch { setMessage('Não foi possível atualizar. Tente novamente.'); } finally { setBusy(false); } }
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Comunicação</p><h1>Anúncios e avisos</h1><p className="section-lede">Compartilhe novidades, pesquisas e atividades no carrossel.</p></div></div><AnnouncementCarousel announcements={announcements} /><form className="content-card announcement-form" onSubmit={submit}><h2>Adicionar anúncio</h2><fieldset disabled={busy}><label className="field-label">Título<input name="title" required maxLength={180} /></label><label className="field-label">Mensagem<textarea name="message" required rows={3} maxLength={5000} /></label><label className="field-label">Imagem (opcional)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /><small>Até 5 MB. A imagem será pública no anúncio.</small></label><label className="field-label">Link de pesquisa ou saiba mais (opcional)<input name="link" type="url" placeholder="https://..." /></label><button className="primary-button" type="submit">{busy ? 'Publicando...' : 'Publicar anúncio'}</button></fieldset></form>{message && <p role="status">{message}</p>}<div className="announcement-list">{announcements.map(a => <article className="content-card announcement-admin-row" key={a.id}><div><h3>{a.title}</h3><p>{a.message}</p><span className="pill pill-blue">{a.active ? 'Publicado' : 'Pausado'}</span></div><div className="announcement-actions"><button className="outline-button" disabled={busy} onClick={() => action(() => onToggle(a.id, !a.active))}>{a.active ? 'Pausar' : 'Publicar'}</button><button className="outline-button" disabled={busy} onClick={() => action(() => onDelete(a.id))}>Excluir</button></div></article>)}</div></section>;
}

import ImportantNotices from './ImportantNotices';
import { FormEvent, useState } from 'react';
import { Announcement } from '@/types';
import { supabase } from '@/lib/supabase';
import AnnouncementCarousel from './AnnouncementCarousel';

export type CreateAnnouncement = (title: string, message: string, media?: { kind: 'notice' | 'announcement'; image_url: string | null; link_url: string | null }) => Promise<void>;
export default function AnnouncementsManager({ announcements, onCreate, onToggle, onDelete }: { announcements: Announcement[]; onCreate: CreateAnnouncement; onToggle: (id: string, active: boolean) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [kind,setKind] = useState<'notice'|'announcement'>('announcement');
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
      await onCreate(String(fields.get('title')), String(fields.get('message')), { kind, image_url: imageUrl, link_url: link || null }); form.reset(); setMessage(kind==='notice'?'Aviso publicado no topo da visão geral.':'Anúncio publicado no carrossel.'); uploaded = null;
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Não foi possível publicar.'); if (uploaded) await supabase.storage.from('gpatf-announcements').remove([uploaded]); } finally { setBusy(false); }
  }
  async function action(work: () => Promise<void>) { setBusy(true); try { await work(); setMessage('Anúncio atualizado.'); } catch { setMessage('Não foi possível atualizar. Tente novamente.'); } finally { setBusy(false); } }
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Comunicação</p><h1>Anúncios e avisos</h1><p className="section-lede">Publique avisos importantes no topo e novidades no carrossel.</p></div></div><ImportantNotices announcements={announcements} /><AnnouncementCarousel announcements={announcements} /><form className="content-card announcement-form" onSubmit={submit}><h2>{kind==='notice'?'Adicionar aviso':'Adicionar anúncio'}</h2><fieldset disabled={busy}><label className="field-label">Tipo de publicação<select value={kind} onChange={e=>setKind(e.target.value as 'notice'|'announcement')}><option value="announcement">Anúncio — carrossel discreto</option><option value="notice">Aviso — destaque no topo</option></select></label><label className="field-label">Título<input name="title" required maxLength={180} /></label><label className="field-label">Mensagem<textarea name="message" required rows={3} maxLength={5000} /></label><label className="field-label">Imagem (opcional)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /><small>Até 5 MB. A imagem será pública no anúncio.</small></label><label className="field-label">Link de pesquisa ou saiba mais (opcional)<input name="link" type="url" placeholder="https://..." /></label><button className="primary-button" type="submit">{busy ? 'Publicando...' : kind==='notice'?'Publicar aviso':'Publicar anúncio'}</button></fieldset></form>{message && <p role="status">{message}</p>}<div className="announcement-list">{announcements.map(a => <article className="content-card announcement-admin-row" key={a.id}><div><small className="communication-kind">{a.kind==='notice'?'Aviso importante':'Anúncio'}</small><h3>{a.title}</h3><p>{a.message}</p><span className="pill pill-blue">{a.active ? 'Publicado' : 'Pausado'}</span></div><div className="announcement-actions"><button className="outline-button" disabled={busy} onClick={() => action(() => onToggle(a.id, !a.active))}>{a.active ? 'Pausar' : 'Publicar'}</button><button className="outline-button" disabled={busy} onClick={() => action(() => onDelete(a.id))} aria-label={`Remover ${a.kind==='notice'?'aviso':'anúncio'}: ${a.title}`}>Remover {a.kind==='notice'?'aviso':'anúncio'}</button></div></article>)}</div></section>;
}

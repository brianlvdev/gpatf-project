import { useEffect, useState } from 'react';
import { Announcement } from '@/types';

export default function AnnouncementCarousel({ announcements }: { announcements: Announcement[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const visible = announcements.filter(a => a.active && (!a.expires_at || Date.parse(a.expires_at) > Date.now()));
  const current = visible[index % (visible.length || 1)];
  useEffect(() => { if (paused || visible.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const timer = window.setInterval(() => setIndex(i => i + 1), 6500); return () => window.clearInterval(timer); }, [paused, visible.length]);
  if (!current) return null;
  return <section className="announcement-carousel" aria-label="Novidades da academia" aria-roledescription="carrossel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)}><div className="carousel-slide" key={current.id}>{current.image_url && <img className="carousel-image" src={current.image_url} alt={current.title} />}<div className="carousel-copy"><p className="eyebrow">Acontece no GPATF</p><h2>{current.title}</h2><p>{current.message}</p>{current.link_url?.startsWith('https://') && <a className="primary-button" href={current.link_url} target="_blank" rel="noopener noreferrer">Saiba mais</a>}</div></div>{visible.length > 1 && <div className="carousel-controls"><button className="outline-button" onClick={() => setIndex(i => (i + visible.length - 1) % visible.length)} aria-label="Anúncio anterior">Anterior</button><span>{index % visible.length + 1} de {visible.length}</span><button className="outline-button" onClick={() => setIndex(i => (i + 1) % visible.length)} aria-label="Próximo anúncio">Próximo</button><button className="link-button" onClick={() => setPaused(p => !p)}>{paused ? 'Reproduzir' : 'Pausar'}</button></div>}</section>;
}

import { Bell } from 'lucide-react';
import { Announcement } from '@/types';
import { publishedCommunications } from '@/lib/communications';
export default function ImportantNotices({announcements}:{announcements:Announcement[]}) {
 const notices=publishedCommunications(announcements,'notice');
 if(!notices.length)return null;
 return <section className="important-notices" aria-label="Avisos importantes">{notices.map(a=><article key={a.id} className="important-notice"><Bell size={24} aria-hidden="true"/><div><p className="eyebrow">Aviso importante</p><h2>{a.title}</h2><p className="notice-message">{a.message}</p>{a.image_url&&<img src={a.image_url} alt={a.title}/ >}{a.link_url?.startsWith('https://')&&<a href={a.link_url} target="_blank" rel="noopener noreferrer">Saiba mais</a>}</div></article>)}</section>;
}

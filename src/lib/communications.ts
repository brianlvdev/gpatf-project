import type { Announcement } from '@/types';
export function publishedCommunications(items:Announcement[],kind:'notice'|'announcement',now=Date.now()) {
 return items.filter(a=>(a.kind??'announcement')===kind&&a.active&&!a.removed_at&&(!a.expires_at||Date.parse(a.expires_at)>now));
}

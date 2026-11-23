import { useEffect, useId, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { todayInSantaMaria } from '@/lib/registration';
import { siteNotifications, SiteNotification, NotificationTarget } from '@/lib/notifications';

export default function NotificationCenter({staff,onNavigate}:{staff:boolean;onNavigate:(target:NotificationTarget)=>void}) {
 const [open,setOpen]=useState(false);const [items,setItems]=useState<SiteNotification[]>([]);const [read,setRead]=useState<string[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const root=useRef<HTMLDivElement>(null);const panelId=useId();
 useEffect(()=>{let live=true;
 async function load(){const today=todayInSantaMaria();const since=new Date(Date.parse(today)-30*86400000).toISOString().slice(0,10);
 const [messages,publications,schedules,plans,students,justifications,confirmations,attendance,receipts,messageReads,planRequests]=await Promise.all([
 supabase.from('support_messages').select('id,author_name,body,created_at').eq('is_staff',!staff).order('created_at',{ascending:false}).limit(50),
 supabase.from('announcements').select('*').eq('active',true).is('removed_at',null).order('created_at',{ascending:false}).limit(50),
 supabase.from('workout_schedules').select('*').gte('scheduled_date',today).order('scheduled_date').limit(100),
 supabase.from('student_workout_plans').select('*').order('updated_at',{ascending:false}).limit(1000),
 supabase.from('students').select('*').order('created_at',{ascending:false}).limit(1000),
 supabase.from('absence_justifications').select('*').gte('created_at',since).order('created_at',{ascending:false}).limit(100),
 supabase.from('attendance_confirmations').select('*').gte('attendance_date',since).order('confirmed_at',{ascending:false}).limit(100),
 supabase.from('attendance').select('*').gte('attendance_date',since).order('attendance_date',{ascending:false}).limit(100),
 supabase.from('notification_receipts').select('event_key').order('read_at',{ascending:false}).limit(1000),
 supabase.from('support_reads').select('message_id').limit(1000),
 supabase.from('workout_plan_requests').select('*').limit(1000)]);
 if(!live)return;if([messages,publications,schedules,plans,students,justifications,confirmations,attendance,receipts,messageReads,planRequests].some(r=>r.error)){setError('Não foi possível atualizar todas as notificações.');setLoading(false);return;}
 setItems(siteNotifications({staff,today,requests:planRequests.data??[],messages:messages.data??[],announcements:publications.data??[],schedules:schedules.data??[],plans:plans.data??[],students:students.data??[],justifications:justifications.data??[],confirmations:confirmations.data??[],attendance:attendance.data??[]}));
 setRead(old=>[...new Set([...old,...(receipts.data??[]).map(r=>r.event_key),...(messageReads.data??[]).map(r=>`message:${r.message_id}`)])]);setError('');setLoading(false);
 }
 void load();const timer=window.setInterval(load,30000);return()=>{live=false;window.clearInterval(timer);};},[staff]);
 useEffect(()=>{if(!open)return;function outside(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(false);}function escape(e:KeyboardEvent){if(e.key==='Escape'){setOpen(false);root.current?.querySelector('button')?.focus();}}document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[open]);
 const unread=items.filter(i=>!read.includes(i.key)).length;const topics=Array.from(new Set(items.map(i=>i.topic)));
 async function mark(list:SiteNotification[]){if(!list.length)return;setBusy(true);try{const r=await supabase.from('notification_receipts').upsert(list.map(i=>({event_key:i.key})),{onConflict:'user_id,event_key'});if(r.error)throw r.error;const msg=list.filter(i=>i.messageId);if(msg.length){const m=await supabase.from('support_reads').upsert(msg.map(i=>({message_id:i.messageId})),{onConflict:'user_id,message_id'});if(m.error)throw m.error;}setRead(old=>[...new Set([...old,...list.map(i=>i.key)])]);}catch{setError('Não foi possível registrar a leitura.');}finally{setBusy(false);}}
 return <div className="notification-center" ref={root}><button type="button" className="icon-button notification-bell" aria-label={`Notificações, ${unread} não lidas`} aria-expanded={open} aria-controls={panelId} onClick={()=>setOpen(v=>!v)}><Bell size={20}/>{unread>0&&<span className="notification-count">{unread>99?'99+':unread}</span>}</button>{open&&<section id={panelId} className="notification-dropdown" role="region" aria-label="Notificações do site"><header><h2>Notificações</h2><button className="icon-button" aria-label="Fechar notificações" onClick={()=>setOpen(false)}><X size={18}/></button></header><button className="link-button mark-notifications" disabled={busy||!unread} onClick={()=>mark(items.filter(i=>!read.includes(i.key)))}>Marcar todas como lidas</button>{loading&&<p role="status">Carregando notificações...</p>}{error&&<p role="alert">{error}</p>}<div className="notification-topics">{topics.map(topic=><section key={topic}><h3>{topic}</h3>{items.filter(i=>i.topic===topic).map(i=><button key={i.key} className={`notification-item ${read.includes(i.key)?'is-read':'is-unread'}`} disabled={busy} onClick={async()=>{await mark([i]);setOpen(false);onNavigate(i.target);window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}><strong>{i.title}</strong><span>{i.detail}</span><small>{new Date(i.date).toLocaleString('pt-BR')}</small></button>)}</section>)}</div>{!loading&&!items.length&&!error&&<p>Nenhuma notificação por enquanto.</p>}<small className="notification-refresh">Atualiza a cada 30 segundos · eventos recentes por assunto</small></section>}</div>;
}

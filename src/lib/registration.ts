import { FunctionsHttpError } from '@supabase/supabase-js';
import type { Student } from '@/types';
import { supabase } from '@/lib/supabase';

export const CERTIFICATE_BUCKET = 'gpatf-certificates';

export function todayInSantaMaria() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export function certificateStatus(expiresOn: string | null, today = todayInSantaMaria(), path?: string | null) {
  if (!expiresOn) return path ? 'Atestado anexado · validade não informada' : 'Nenhum atestado registrado';
  const days = (Date.parse(expiresOn) - Date.parse(today)) / 86_400_000;
  const formatted = expiresOn.split('-').reverse().join('/');
  if (days < 0) return `Vencido em ${formatted}`;
  if (days === 0) return `Vence hoje (${formatted})`;
  return `Válido até ${formatted} · ${days === 1 ? 'Falta 1 dia' : `Faltam ${days} dias`}`;
}

export async function registerAccount(action: 'self' | 'student' | 'collaborator' | 'certificate' | 'own_certificate' | 'own_avatar', fields: FormData) {
  fields.set('action', action);
  const { data, error } = await supabase.functions.invoke<{ student?: Student }>('register-account', { body: fields });
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (typeof body?.message === 'string') throw new Error(body.message);
  }
  if (error) throw new Error('Não foi possível concluir a operação. Tente novamente.');
  return data;
}

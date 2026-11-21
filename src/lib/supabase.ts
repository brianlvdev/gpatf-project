import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const FILE_BUCKET = 'gpatf-files';

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function accountEmailFromPhone(phone: string): string {
  return `${normalizePhone(phone)}@gpatf.local`;
}

export function normalizeName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
}

export function accountEmailFromName(name: string): string {
  return `${normalizeName(name)}@gpatf.local`;
}

export function accountEmailFromIdentifier(identifier: string): string {
  return /^[\d\s()+.-]+$/.test(identifier) && normalizePhone(identifier).length >= 8 ? accountEmailFromPhone(identifier) : accountEmailFromName(identifier);
}

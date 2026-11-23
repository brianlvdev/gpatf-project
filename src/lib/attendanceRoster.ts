import type { Student } from '@/types';
import { searchText } from './exercises';
export function filterAttendanceRoster(students:Student[],confirmed:Set<string>,query:string,filter:string) {
 return students.filter(s=>searchText(`${s.full_name} ${s.phone??''}`).includes(searchText(query)) && (filter==='all'||(filter==='confirmed'?confirmed.has(s.id):!confirmed.has(s.id)))).sort((a,b)=>a.full_name.localeCompare(b.full_name,'pt-BR'));
}

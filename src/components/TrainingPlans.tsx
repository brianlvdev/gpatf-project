import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { Student, StudentPlan, ExerciseItem, Collaborator } from '@/types';
import { exerciseGroups, searchText } from '@/lib/exercises';
import { certificateStatus } from '@/lib/registration';
import { supabase } from '@/lib/supabase';

export function CollaboratorsList() {
  const [people, setPeople] = useState<Collaborator[]>([]);
  const [status, setStatus] = useState('Carregando colaboradores...');
  useEffect(() => { let live = true; supabase.from('collaborators').select('*').eq('active', true).order('full_name').then(({ data, error }) => { if (live) { setPeople(data ?? []); setStatus(error ? 'Não foi possível carregar a equipe.' : ''); } }); return () => { live = false; }; }, []);
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Nossa equipe</p><h1>Colaboradores</h1><p className="section-lede">Profissionais com acesso à academia.</p></div></div><div className="team-grid">{people.map(person => <article key={person.id} className="content-card"><div className="team-initial">{person.full_name.charAt(0).toUpperCase()}</div><h2>{person.full_name}</h2><p>{person.email}</p><span className="pill pill-blue">{person.role === 'master' ? 'Administração' : 'Colaborador'}</span></article>)}</div>{status && <p role="status">{status}</p>}{!status && !people.length && <p>Nenhum colaborador cadastrado.</p>}</section>;
}

export default function TrainingPlans({ students }: { students: Student[] }) {
  const [plans, setPlans] = useState<StudentPlan[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  async function refresh() { const { data, error: failure } = await supabase.from('student_workout_plans').select('*'); if (failure) { setError('Não foi possível consultar as fichas. Tente novamente.'); setLoading(false); return; } setPlans(data ?? []); setError(''); setLoading(false); }
  useEffect(() => { void refresh(); }, []);
  const filtered = students.filter(s => searchText(s.full_name).includes(searchText(search)));
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Prescrição individual</p><h1>Fichas de treino</h1><p className="section-lede">Monte e acompanhe o treino de cada aluno.</p></div></div><label className="search-box plan-search"><Search size={18} /><input aria-label="Buscar aluno" placeholder="Buscar aluno pelo nome" value={search} onChange={e => setSearch(e.target.value)} /></label>{error && <p role="alert">{error} <button onClick={refresh}>Tentar novamente</button></p>}{loading ? <p>Carregando fichas...</p> : !error && [false, true].map(hasPlan => {
    const group = filtered.filter(s => plans.some(p => p.student_id === s.id) === hasPlan);
    return <section key={String(hasPlan)} className="plan-group"><h2>{hasPlan ? 'Alunos com ficha de treino' : 'Alunos sem ficha de treino'} <span className="pill pill-blue">{group.length}</span></h2>{group.map(s => { const plan = plans.find(p => p.student_id === s.id); return <article className="content-card plan-student" key={s.id}><div><h3>{s.full_name}</h3><p>{plan ? `Ficha feita por ${plan.created_by_name}` : 'Ficha de treino ainda não criada'}</p>{plan && <small>Última edição: {plan.updated_by_name} · {new Date(plan.updated_at).toLocaleDateString('pt-BR')}</small>}<p className="certificate-caption">Atestado: {certificateStatus(s.medical_certificate_expires_on)}</p></div><button className="primary-button" onClick={() => setSelected(s)}>{plan ? 'Editar treino' : 'Criar ficha'}</button></article>; })}{!group.length && <p className="muted-text">Nenhum aluno neste grupo.</p>}</section>;
  })}{selected && <PlanEditor key={selected.id} student={selected} plan={plans.find(p => p.student_id === selected.id)} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await refresh(); }} />}</section>;
}

function PlanEditor({ student, plan, onClose, onSaved }: { student: Student; plan?: StudentPlan; onClose: () => void; onSaved: () => Promise<void> }) {
  const [items, setItems] = useState<ExerciseItem[]>(plan?.exercises ?? []);
  const [notes, setNotes] = useState(plan?.notes ?? '');
  const [group, setGroup] = useState('Todos');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const options = Object.entries(exerciseGroups).flatMap(([category, names]) => names.map(name => ({ group: category, name }))).filter(e => (group === 'Todos' || e.group === group) && searchText(`${e.group} ${e.name} ${e.name.startsWith('Rosca') ? 'bíceps' : ''}`).includes(searchText(query)));
  function update(id: string, field: keyof ExerciseItem, value: string) { setItems(old => old.map(i => i.id === id ? { ...i, [field]: value } : i)); }
  async function save() {
    if (!items.length) { setError('Adicione pelo menos um exercício.'); return; }
    setSaving(true); setError('');
    try { const { error: failure } = await supabase.from('student_workout_plans').upsert({ student_id: student.id, exercises: items, notes }, { onConflict: 'student_id' }); if (failure) throw failure; await onSaved(); } catch { setError('Não foi possível salvar a ficha. Suas alterações continuam abertas.'); } finally { setSaving(false); }
  }
  return <><button className="drawer-backdrop" aria-label="Fechar editor de treino" disabled={saving} onClick={onClose} /><aside className="edit-drawer training-drawer" role="dialog" aria-modal="true" aria-label={`Ficha de treino de ${student.full_name}`}><header className="drawer-header"><div><p className="eyebrow">Ficha de treino</p><h2>{student.full_name}</h2><p>{certificateStatus(student.medical_certificate_expires_on)}</p></div><button className="icon-button" disabled={saving} onClick={onClose} aria-label="Fechar"><X /></button></header><fieldset disabled={saving}><legend>Adicionar exercícios</legend><div className="exercise-filters"><label className="field-label">Grupo muscular<select value={group} onChange={e => setGroup(e.target.value)}>{['Todos', ...Object.keys(exerciseGroups)].map(g => <option key={g}>{g}</option>)}</select></label><label className="field-label">Pesquisar exercício<input type="search" placeholder="Digite: bíceps, perna, remada..." value={query} onChange={e => setQuery(e.target.value)} /></label></div><div className="exercise-options" aria-label="Resultados de exercícios"><span className="muted-text" role="status">{options.length} exercícios encontrados</span>{options.map(e => <button className="exercise-option" key={e.name} onClick={() => setItems(old => [...old, { ...e, id: crypto.randomUUID(), sets: '', reps: '', load: '', rest: '' }])}><span><strong>{e.name}</strong><small>{e.group}</small></span><Plus size={18} /></button>)}{!options.length && <p>Nenhum resultado. Tente outro nome ou grupo.</p>}</div><h3>Exercícios selecionados ({items.length})</h3>{items.map((item, index) => <article key={item.id} className="exercise-item"><div className="card-heading"><strong>{index + 1}. {item.name}</strong><button className="icon-button danger-icon" aria-label={`Remover ${item.name}`} onClick={() => setItems(old => old.filter(i => i.id !== item.id))}><Trash2 size={17} /></button></div><div className="exercise-prescription">{([['sets', 'Séries'], ['reps', 'Repetições / tempo'], ['load', 'Carga'], ['rest', 'Descanso']] as const).map(([field, label]) => <label key={field} className="field-label">{label}<input maxLength={60} value={item[field]} onChange={e => update(item.id, field, e.target.value)} /></label>)}</div></article>)}<label className="field-label">Orientações para o aluno<textarea rows={3} maxLength={5000} value={notes} onChange={e => setNotes(e.target.value)} /></label></fieldset>{error && <p role="alert">{error}</p>}<button className="primary-button full-button" disabled={saving} onClick={save}>{saving ? 'Salvando ficha...' : 'Salvar ficha de treino'}</button></aside></>;
}

export function StudentTrainingPlan({ studentId }: { studentId: string }) {
  const [plan, setPlan] = useState<StudentPlan | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let live = true; supabase.from('student_workout_plans').select('*').eq('student_id', studentId).maybeSingle().then(({ data, error }) => { if (live) { setPlan(data); setError(error ? 'Não foi possível carregar sua ficha de treino.' : ''); } }); return () => { live = false; }; }, [studentId]);
  return <section className="content-card student-plan"><p className="eyebrow">Seu programa</p><h2>Minha ficha de treino</h2>{error ? <p role="alert">{error}</p> : !plan ? <p>A equipe ainda não cadastrou sua ficha de treino.</p> : <><p>Ficha feita por {plan.created_by_name}</p><div className="student-exercises">{plan.exercises.map((item, index) => <article key={item.id}><strong>{index + 1}. {item.name}</strong><p>{item.group}</p><span>Séries: {item.sets || '—'} · Repetições / tempo: {item.reps || '—'} · Carga: {item.load || '—'} · Descanso: {item.rest || '—'}</span></article>)}</div>{plan.notes && <p className="plan-notes">{plan.notes}</p>}</>}</section>;
}

import AttendanceManager from './AttendanceRoster';
import SupportChat from './SupportChat';
import TrainingPlans, { CollaboratorsList } from './TrainingPlans';
import AnnouncementsManager, { CreateAnnouncement } from './AnnouncementsManager';
import AnnouncementCarousel from './AnnouncementCarousel';
import { FormEvent, useState } from 'react';
import { Archive, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, FileText, LayoutDashboard, LogOut, Menu, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react';
import { AbsenceJustification, Announcement, Attendance, AttendanceConfirmation, AttendanceStatus, Student, StudentStatus, WorkoutSchedule } from '@/types';

import CertificateFields from '@/components/CertificateFields';
import RegistrationDrawer from '@/components/RegistrationDrawer';
import { certificateStatus, CERTIFICATE_BUCKET, registerAccount, todayInSantaMaria } from '@/lib/registration';
import { supabase } from '@/lib/supabase';

interface AdminDashboardProps {
  onRefreshStudents: () => Promise<void>;
  onRegisterStudent: (fields: FormData) => Promise<void>;
  onRegisterCollaborator?: (fields: FormData) => Promise<void>;
  students: Student[];
  schedules: WorkoutSchedule[];
  attendance: Attendance[];
  confirmations: AttendanceConfirmation[];
  justifications: AbsenceJustification[];
  announcements: Announcement[];
  onUpdateStudent: (studentId: string, values: Partial<Student>) => Promise<void>;
  onSetStudentStatus: (studentId: string, status: StudentStatus) => Promise<void>;
  onCreateSchedule: (values: { studentId: string; title: string; description: string; date: string; startTime: string; endTime: string; location: string; workoutPlan: string }) => Promise<void>;
  onUpdateWorkoutPlan: (scheduleId: string, plan: string) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  onSetAttendance: (studentId: string, date: string, status: AttendanceStatus, note: string) => Promise<void>;
  onReviewJustification: (id: string, status: 'approved' | 'rejected', note: string) => Promise<void>;
  onCreateAnnouncement: CreateAnnouncement;
  onToggleAnnouncement: (id: string, active: boolean) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

type AdminView = 'overview' | 'students' | 'agenda' | 'attendance' | 'announcements' | 'plans' | 'collaborators';

const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`)).replace('.', '');
const formatTime = (time: string) => time.slice(0, 5);

export default function AdminDashboard({ onRefreshStudents, onRegisterStudent, onRegisterCollaborator, students, schedules, attendance, confirmations, justifications, announcements, onUpdateStudent, onSetStudentStatus, onCreateSchedule, onUpdateWorkoutPlan, onDeleteSchedule, onSetAttendance, onReviewJustification, onCreateAnnouncement, onToggleAnnouncement, onDeleteAnnouncement, onSignOut }: AdminDashboardProps) {
  const [registration, setRegistration] = useState<'student' | 'collaborator' | null>(null);
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const activeStudents = students.filter((student) => student.status === 'active');
  const today = todayInSantaMaria();
  const todaysSchedules = schedules.filter((schedule) => schedule.scheduled_date === today && schedule.status !== 'cancelled');
  const pendingJustifications = justifications.filter((item) => item.status === 'pending');
  const filteredStudents = students.filter((student) => student.full_name.toLowerCase().includes(search.toLowerCase()) || (student.phone ?? '').includes(search));

  const navigate = (view: AdminView) => {
    setActiveView(view);
    setMenuOpen(false);
  };

  const showFeedback = (text: string) => {
    setFeedback(text);
    window.setTimeout(() => setFeedback(''), 3500);
  };

  const handleStatus = async (student: Student, status: StudentStatus) => {
    setSaving(true);
    try {
      await onSetStudentStatus(student.id, status);
      if (selectedStudent?.id === student.id) setSelectedStudent({ ...student, status });
      showFeedback(status === 'blocked' ? 'Cadastro bloqueado.' : status === 'active' ? 'Cadastro reativado.' : 'Cadastro marcado como inativo.');
    } catch {
      showFeedback('Não foi possível atualizar o cadastro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell admin-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button type="button" className="sidebar-brand home-brand" onClick={() => navigate('overview')} aria-label="GPATF, voltar ao início"><div className="logo-frame"><img src="/image.png" alt="Logo GPATF" /></div><div><strong>GPATF</strong><span>Administração</span></div></button>
        <nav className="side-nav">
          <button className={activeView === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><LayoutDashboard size={20} /> Visão geral</button>
          <button className={activeView === 'students' ? 'active' : ''} onClick={() => navigate('students')}><Users size={20} /> Alunos <span className="nav-count">{activeStudents.length}</span></button>
          <button className={activeView === 'plans' ? 'active' : ''} onClick={() => navigate('plans')}><FileText size={20} /> Fichas de treino</button>
          <button className={activeView === 'collaborators' ? 'active' : ''} onClick={() => navigate('collaborators')}><Users size={20} /> Colaboradores</button>
          <button className={activeView === 'agenda' ? 'active' : ''} onClick={() => navigate('agenda')}><CalendarDays size={20} /> Agenda</button>
          <button className={activeView === 'attendance' ? 'active' : ''} onClick={() => navigate('attendance')}><CheckCircle2 size={20} /> Presença</button>
          <button className={activeView === 'announcements' ? 'active' : ''} onClick={() => navigate('announcements')}><Bell size={20} /> Anúncios e avisos</button>
        </nav>
        <SupportChat students={students} sidebar /><div className="admin-side-status"><div className="status-pulse" /><div><strong>Painel ativo</strong><span>Dados atualizados</span></div></div>
        {onRegisterCollaborator && <button type="button" className="primary-button sidebar-add" onClick={() => { setMenuOpen(false); setRegistration('collaborator'); }}><Plus size={18} /> Adicionar colaborador</button>}
        <button type="button" className="logout-button" onClick={onSignOut}><LogOut size={18} aria-hidden="true" /> Sair</button>
      </aside>
      {menuOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={23} /></button><button type="button" className="topbar-logo" onClick={() => navigate('overview')} aria-label="GPATF, voltar ao início"><img src="/image.png" alt="" /></button><div className="topbar-context"><span>Administração</span><strong>{activeView === 'overview' ? 'Visão geral' : activeView === 'students' ? 'Alunos' : activeView === 'agenda' ? 'Agenda' : activeView === 'attendance' ? 'Controle de presença' : activeView === 'plans' ? 'Fichas de treino' : activeView === 'collaborators' ? 'Colaboradores' : 'Anúncios e avisos'}</strong></div><div className="admin-header-actions">

          <button type="button" className="primary-button" onClick={() => setRegistration('student')}><Plus size={18} aria-hidden="true" /> Cadastrar aluno</button>
        </div><div className="topbar-user"><SupportChat students={students} /><div className="avatar avatar-small admin-avatar"><ShieldCheck size={17} /></div><span>Equipe GPATF</span></div></header>
        {feedback && <div className="toast"><CheckCircle2 size={18} /> {feedback}</div>}

        {activeView === 'overview' && <AdminOverview students={students} todaysSchedules={todaysSchedules} pendingJustifications={pendingJustifications} announcements={announcements} onNavigate={navigate} onReviewJustification={onReviewJustification} onCreateAnnouncement={onCreateAnnouncement} />}
        {activeView === 'students' && <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Acompanhamento individual</p><h1>Alunos</h1><p className="section-lede">Consulte fichas e mantenha os cadastros atualizados.</p></div></div><div className="toolbar"><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou telefone" /></div><span className="toolbar-count">{filteredStudents.length} cadastro{filteredStudents.length === 1 ? '' : 's'}</span></div><div className="student-admin-list">{filteredStudents.map((student) => <StudentAdminRow key={student.id} student={student} onEdit={() => setSelectedStudent(student)} onStatus={handleStatus} />)}{filteredStudents.length === 0 && <div className="empty-state large-empty"><Users size={34} /><strong>Nenhum aluno encontrado</strong><p>Tente buscar por outro nome ou telefone.</p></div>}</div></section>}
        {activeView === 'agenda' && <AgendaManager students={activeStudents} schedules={schedules} showForm={showScheduleForm} setShowForm={setShowScheduleForm} saving={saving} setSaving={setSaving} onCreate={onCreateSchedule} onUpdatePlan={onUpdateWorkoutPlan} onDelete={onDeleteSchedule} onFeedback={showFeedback} />}
        {activeView === 'attendance' && <AttendanceManager students={students} attendance={attendance} confirmations={confirmations} schedules={schedules} onSetAttendance={onSetAttendance} onFeedback={showFeedback} />}
        {activeView === 'announcements' && <AnnouncementsManager announcements={announcements} onCreate={onCreateAnnouncement} onToggle={onToggleAnnouncement} onDelete={onDeleteAnnouncement} />}
        {activeView === 'plans' && <TrainingPlans students={students} />}
        {activeView === 'collaborators' && <CollaboratorsList key={registration ?? 'team'} />}
      </main>
      {registration && <RegistrationDrawer key={registration} kind={registration} onClose={() => setRegistration(null)} onSubmit={async (fields) => {
        if (registration === 'student') await onRegisterStudent(fields);
        else if (onRegisterCollaborator) await onRegisterCollaborator(fields);
        setRegistration(null);
        showFeedback(registration === 'student' ? 'Aluno cadastrado com sucesso.' : 'Colaborador cadastrado com sucesso.');
      }} />}
      {selectedStudent && <StudentEditDrawer key={selectedStudent.id} student={selectedStudent} absenceCount={attendance.filter((item) => item.student_id === selectedStudent.id && item.status === 'absent').length} onCertificateSaved={async (updated) => { setSelectedStudent(updated); await onRefreshStudents(); }} onClose={() => setSelectedStudent(null)} onSave={async (values) => { await onUpdateStudent(selectedStudent.id, values); setSelectedStudent({ ...selectedStudent, ...values }); showFeedback('Ficha atualizada com sucesso.'); }} onStatus={(status) => handleStatus(selectedStudent, status)} saving={saving} />}
    </div>
  );
}

function AdminOverview({ students, todaysSchedules, pendingJustifications, announcements, onNavigate, onReviewJustification }: { students: Student[]; todaysSchedules: WorkoutSchedule[]; pendingJustifications: AbsenceJustification[]; announcements: Announcement[]; onNavigate: (view: AdminView) => void; onReviewJustification: (id: string, status: 'approved' | 'rejected', note: string) => Promise<void>; onCreateAnnouncement: (title: string, message: string) => Promise<void> }) {
  const [summarySearch,setSummarySearch] = useState('');
  const matchesStudent = (id: string) => (students.find(s=>s.id===id)?.full_name ?? '').toLowerCase().includes(summarySearch.toLowerCase());
  const [reviewing, setReviewing] = useState('');
  const activeStudents = students.filter(s => s.status === 'active').length;

  const review = async (item: AbsenceJustification, status: 'approved' | 'rejected') => {
    setReviewing(item.id);
    await onReviewJustification(item.id, status, '');
    setReviewing('');
  };

  return <section className="view-section"><section className="admin-welcome"><div><p className="eyebrow">Painel da equipe</p><h1>Bom trabalho hoje.</h1><p className="section-lede">Aqui está um resumo da Academia GPATF.</p></div><div className="admin-date"><span>Hoje</span><strong>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date())}</strong></div></section><label className="field-label plan-search">Pesquisar aluno nos resumos<input type="search" value={summarySearch} onChange={e=>setSummarySearch(e.target.value)} /></label><AnnouncementCarousel announcements={announcements} /><section className="metric-grid admin-metrics"><div className="metric-card"><div className="metric-icon blue"><Users size={21} /></div><div><strong>{activeStudents}</strong><span>alunos ativos</span></div><button onClick={() => onNavigate('students')}><ChevronRight size={17} /></button></div><div className="metric-card"><div className="metric-icon green"><CalendarDays size={21} /></div><div><strong>{todaysSchedules.length}</strong><span>treinos hoje</span></div><button onClick={() => onNavigate('agenda')}><ChevronRight size={17} /></button></div><div className="metric-card"><div className="metric-icon sand"><FileText size={21} /></div><div><strong>{pendingJustifications.length}</strong><span>justificativas pendentes</span></div><button onClick={() => onNavigate('attendance')}><ChevronRight size={17} /></button></div></section><div className="dashboard-grid admin-grid"><section className="content-card"><div className="card-heading"><div><p className="eyebrow">Atenção da equipe</p><h2>Justificativas recentes</h2></div><button className="link-button" onClick={() => onNavigate('attendance')}>Ver todas <ChevronRight size={16} /></button></div>{pendingJustifications.length ? pendingJustifications.filter(i=>matchesStudent(i.student_id)).slice(0, 4).map((item) => <div className="review-row" key={item.id}><div className="review-avatar"><FileText size={18} /></div><div className="review-main"><strong>{students.find((student) => student.id === item.student_id)?.full_name ?? 'Aluno'}</strong><span>{formatDate(item.absence_date)} · {item.reason}</span></div><div className="review-actions"><button className="icon-action success" disabled={reviewing === item.id} onClick={() => review(item, 'approved')} aria-label="Aprovar"><Check size={17} /></button><button className="icon-action danger" disabled={reviewing === item.id} onClick={() => review(item, 'rejected')} aria-label="Recusar"><X size={17} /></button></div></div>) : <div className="empty-state compact-empty"><CheckCircle2 size={28} /><strong>Tudo em dia</strong><p>Nenhuma justificativa aguardando análise.</p></div>}</section><section className="content-card notice-admin-card"><div className="card-heading"><div><p className="eyebrow">Comunicação</p><h2>Aviso na tela principal</h2></div><Bell size={21} className="heading-icon" /></div>{announcements.length ? <div className="active-notice"><span className="notice-live"><span /> Publicado</span><h3>{announcements[0].title}</h3><p>{announcements[0].message}</p></div> : <div className="empty-state compact-empty"><Bell size={28} /><p>Nenhum aviso publicado.</p></div>}<button className="outline-button full-button" onClick={() => onNavigate('announcements')}>Gerenciar anúncios</button></section></div><section className="content-card today-card"><div className="card-heading"><div><p className="eyebrow">Agenda de hoje</p><h2>Treinos programados</h2></div><button className="link-button" onClick={() => onNavigate('agenda')}>Gerenciar agenda <ChevronRight size={16} /></button></div>{todaysSchedules.length ? <div className="today-grid">{todaysSchedules.filter(i=>matchesStudent(i.student_id)).map((schedule) => <div className="today-item" key={schedule.id}><span>{formatTime(schedule.start_time)}</span><div><strong>{schedule.title}</strong><small>{students.find((student) => student.id === schedule.student_id)?.full_name ?? 'Aluno'}</small></div><Clock3 size={16} /></div>)}</div> : <p className="muted-text">Nenhum treino marcado para hoje.</p>}</section></section>;
}

function StudentAdminRow({ student, onEdit, onStatus }: { student: Student; onEdit: () => void; onStatus: (student: Student, status: StudentStatus) => void }) {
  return <div className="student-admin-row"><button className="avatar avatar-medium" onClick={onEdit} aria-label={`Abrir ficha de ${student.full_name}`}><UserRound size={20} /></button><div className="student-row-main"><button className="student-name-link" onClick={onEdit}>{student.full_name}</button><span>{student.phone ?? 'Sem telefone'} · Cadastro em {formatDate(student.created_at.slice(0, 10))}</span></div><span className={`status-badge ${student.status}`}>{student.status === 'active' ? 'Ativo' : student.status === 'blocked' ? 'Bloqueado' : 'Inativo'}</span><button className="outline-button" onClick={onEdit}><Pencil size={16} /> Abrir ficha</button><button className="icon-button row-more" aria-label="Mais opções" onClick={() => onStatus(student, student.status === 'active' ? 'blocked' : 'active')}>{student.status === 'active' ? <Archive size={17} /> : <Check size={17} />}</button></div>;
}

function StudentEditDrawer({ student, absenceCount, onCertificateSaved, onClose, onSave, onStatus, saving }: { student: Student; absenceCount: number; onCertificateSaved: (student: Student) => Promise<void>; onClose: () => void; onSave: (values: Partial<Student>) => Promise<void>; onStatus: (status: StudentStatus) => Promise<void>; saving: boolean }) {
  const [certificateLink, setCertificateLink] = useState('');
  const [certificateError, setCertificateError] = useState('');
  const [loadingCertificate, setLoadingCertificate] = useState(false);

  const [savingCertificate, setSavingCertificate] = useState(false);
  const [certificateFeedback, setCertificateFeedback] = useState('');

  async function saveCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSavingCertificate(true);
    setCertificateFeedback('');
    try {
      const fields = new FormData(form);
      fields.set('studentId', student.id);
      const result = await registerAccount('certificate', fields);
      if (!result?.student) throw new Error('Não foi possível confirmar a atualização do atestado.');
      setCertificateLink('');
      setCertificateError('');
      form.reset();
      await onCertificateSaved(result.student);
      setCertificateFeedback('Atestado salvo com sucesso.');
    } catch (error) {
      setCertificateFeedback(error instanceof Error ? error.message : 'Não foi possível salvar o atestado.');
    } finally {
      setSavingCertificate(false);
    }
  }

  async function loadCertificateLink() {
    if (!student.medical_certificate_path) return;
    setLoadingCertificate(true);
    setCertificateError('');
    const { data, error } = await supabase.storage.from(CERTIFICATE_BUCKET).createSignedUrl(student.medical_certificate_path, 300);
    if (error || !data) setCertificateError('Não foi possível abrir o atestado.');
    else setCertificateLink(data.signedUrl);
    setLoadingCertificate(false);
  }

  const [values, setValues] = useState({ full_name: student.full_name, birth_date: student.birth_date, address: student.address, phone: student.phone ?? '', emergency_contact_name: student.emergency_contact_name, emergency_contact_phone: student.emergency_contact_phone, comorbidities: student.comorbidities });
  const update = (field: keyof typeof values, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onSave(values); };
  return <><button className="drawer-backdrop" aria-label="Fechar ficha" onClick={onClose} /><aside className="edit-drawer"><div className="drawer-header"><div><p className="eyebrow">Ficha do aluno</p><h2>{student.full_name}</h2><span className={`status-badge ${student.status}`}>{student.status === 'active' ? 'Cadastro ativo' : student.status === 'blocked' ? 'Cadastro bloqueado' : 'Cadastro inativo'}</span></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={21} /></button></div><form className="drawer-form" onSubmit={submit}><label className="field-label">Nome completo<input required value={values.full_name} onChange={(event) => update('full_name', event.target.value)} /></label><div className="two-columns"><label className="field-label">Nascimento<input required type="date" value={values.birth_date} onChange={(event) => update('birth_date', event.target.value)} /></label><label className="field-label">Telefone <span className="optional-label">(opcional)</span><input value={values.phone} onChange={(event) => update('phone', event.target.value)} /></label></div><label className="field-label">Endereço<input required value={values.address} onChange={(event) => update('address', event.target.value)} /></label><div className="drawer-divider" /><p className="form-section-label standalone"><ShieldCheck size={17} /> Contato de emergência</p><div className="two-columns"><label className="field-label">Nome<input required value={values.emergency_contact_name} onChange={(event) => update('emergency_contact_name', event.target.value)} /></label><label className="field-label">Telefone<input required value={values.emergency_contact_phone} onChange={(event) => update('emergency_contact_phone', event.target.value)} /></label></div><label className="field-label">Cuidados importantes<textarea rows={4} value={values.comorbidities} onChange={(event) => update('comorbidities', event.target.value)} /></label><button className="primary-button button-large" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar alterações'} <Check size={18} /></button></form><div className="drawer-footer"><p>Atestado para atividade física</p>
    <p>{certificateStatus(student.medical_certificate_expires_on, undefined, student.medical_certificate_path)}</p>
    {student.medical_certificate_path && <div className="status-controls">
      <button type="button" disabled={loadingCertificate} onClick={loadCertificateLink}>{loadingCertificate ? 'Carregando...' : 'Gerar link da foto'}</button>
      {certificateLink && <a href={certificateLink} target="_blank" rel="noreferrer">Abrir foto do atestado</a>}
      {certificateError && <span role="alert">{certificateError}</span>}
    </div>}
    <form className="drawer-form" onSubmit={saveCertificate}>
      <CertificateFields required />
      <button type="submit" className="primary-button" disabled={savingCertificate}>{savingCertificate ? 'Salvando...' : student.medical_certificate_path ? 'Substituir atestado' : 'Anexar atestado'}</button>
      {certificateFeedback && <p role="status">{certificateFeedback}</p>}
    </form>
    <p>Faltas registradas: <strong>{absenceCount}</strong></p><p>Controle do cadastro</p><div className="status-controls"><button disabled={saving || student.status === 'active'} onClick={() => onStatus('active')}><Check size={16} /> Ativar</button><button disabled={saving || student.status === 'blocked'} onClick={() => onStatus('blocked')}><Archive size={16} /> Bloquear</button><button disabled={saving || student.status === 'inactive'} onClick={() => onStatus('inactive')}><X size={16} /> Inativar</button></div></div></aside></>;
}

function AgendaManager({ students, schedules, showForm, setShowForm, saving, setSaving, onCreate, onUpdatePlan, onDelete, onFeedback }: { students: Student[]; schedules: WorkoutSchedule[]; showForm: boolean; setShowForm: (value: boolean) => void; saving: boolean; setSaving: (value: boolean) => void; onCreate: (values: { studentId: string; title: string; description: string; date: string; startTime: string; endTime: string; location: string; workoutPlan: string }) => Promise<void>; onUpdatePlan: AdminDashboardProps['onUpdateWorkoutPlan']; onDelete: (id: string) => Promise<void>; onFeedback: (message: string) => void }) {
  const [agendaSearch, setAgendaSearch] = useState('');
  const filteredSchedules = schedules.filter(w => (students.find(s=>s.id===w.student_id)?.full_name ?? '').toLowerCase().includes(agendaSearch.toLowerCase())).sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date)||a.start_time.localeCompare(b.start_time));
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [title, setTitle] = useState('Treino de força');
  const [description, setDescription] = useState('');
  const [workoutPlan, setWorkoutPlan] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [location, setLocation] = useState('Academia GPATF');
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await onCreate({ studentId, title, description, date, startTime, endTime, location, workoutPlan }); setWorkoutPlan(''); setShowForm(false); onFeedback('Treino adicionado à agenda.'); } catch { onFeedback('Não foi possível criar o treino.'); } finally { setSaving(false); } };
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Planejamento</p><h1>Agenda de treinos</h1><p className="section-lede">Crie e organize os próximos compromissos dos alunos.</p></div><button className="primary-button" onClick={() => setShowForm(!showForm)}><Plus size={18} /> Novo treino</button></div>{showForm && <form className="content-card schedule-form" onSubmit={submit}><div className="card-heading"><div><h2>Novo treino</h2><p>Escolha o aluno e o horário.</p></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}><X size={20} /></button></div><div className="two-columns"><label className="field-label">Aluno<input type="search" aria-label="Filtrar alunos para agendamento" value={agendaSearch} onChange={e=>setAgendaSearch(e.target.value)} placeholder="Pesquisar aluno"/><select required value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.filter(s=>s.full_name.toLowerCase().includes(agendaSearch.toLowerCase()) || s.id===studentId).map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}</select></label><label className="field-label">Nome do treino<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label></div><div className="two-columns"><label className="field-label">Data<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field-label">Local<input required value={location} onChange={(event) => setLocation(event.target.value)} /></label></div><div className="two-columns"><label className="field-label">Início<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label className="field-label">Fim<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div><label className="field-label">Observação<textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: levar garrafinha de água" /></label><label className="field-label">Ficha de treino (opcional)<textarea rows={5} maxLength={5000} value={workoutPlan} onChange={(event) => setWorkoutPlan(event.target.value)} placeholder="Ex.: Leg press, 3 séries de 10 repetições" /></label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Adicionar à agenda'} <Check size={17} /></button></form>}<div className="content-card schedule-admin-list"><div className="card-heading"><div><p className="eyebrow">Todos os alunos</p><h2>Próximos treinos</h2><label className="field-label">Buscar aluno<input type="search" value={agendaSearch} onChange={e=>setAgendaSearch(e.target.value)} /></label></div><span className="toolbar-count">{schedules.length} agendados</span></div>{filteredSchedules.length ? filteredSchedules.map((schedule,index) => <div className="agenda-entry" key={schedule.id}>{(index===0 || filteredSchedules[index-1].scheduled_date!==schedule.scheduled_date)&&<h3 className="agenda-day-heading">{formatDate(schedule.scheduled_date)}</h3>}<div className="admin-schedule-row"><div className="schedule-date"><strong>{new Date(`${schedule.scheduled_date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${schedule.scheduled_date}T12:00:00`)).replace('.', '')}</span></div><div className="schedule-main"><span className="schedule-weekday">{formatDate(schedule.scheduled_date)} · {formatTime(schedule.start_time)}</span><strong>{schedule.title}</strong><p>{students.find((student) => student.id === schedule.student_id)?.full_name ?? 'Aluno'} <span className="dot-separator">·</span> {schedule.location}</p><WorkoutPlanEditor schedule={schedule} onSave={onUpdatePlan} /></div><button className="icon-button danger-icon" onClick={() => onDelete(schedule.id)} aria-label="Excluir treino"><Trash2 size={17} /></button></div></div>) : <div className="empty-state large-empty"><CalendarDays size={34} /><strong>Agenda vazia</strong><p>Adicione um treino para começar.</p></div>}</div></section>;
}

function WorkoutPlanEditor({ schedule, onSave }: {
  schedule: WorkoutSchedule;
  onSave: AdminDashboardProps['onUpdateWorkoutPlan'];
}) {
  const [plan, setPlan] = useState(schedule.workout_plan ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await onSave(schedule.id, plan);
      setMessage('Ficha salva.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a ficha.');
    } finally {
      setSaving(false);
    }
  }
  return <details className="workout-plan">
    <summary>{schedule.workout_plan ? 'Editar ficha de treino' : 'Adicionar ficha de treino'}</summary>
    <form className="form-stack" onSubmit={submit}>
      <label className="field-label">Ficha de treino<textarea rows={5} maxLength={5000} value={plan} onChange={(event) => setPlan(event.target.value)} /></label>
      <button className="outline-button" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar ficha'}</button>
      {message && <p role="status">{message}</p>}
    </form>
  </details>;
}

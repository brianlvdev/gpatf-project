import { FormEvent, useState } from 'react';
import { Archive, Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, FileText, LayoutDashboard, LogOut, Menu, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react';
import { AbsenceJustification, Announcement, Attendance, AttendanceStatus, Student, StudentStatus, WorkoutSchedule } from '@/types';

import CertificateFields from '@/components/CertificateFields';
import RegistrationDrawer from '@/components/RegistrationDrawer';
import { certificateStatus, CERTIFICATE_BUCKET, registerAccount } from '@/lib/registration';
import { supabase } from '@/lib/supabase';

interface AdminDashboardProps {
  onRefreshStudents: () => Promise<void>;
  onRegisterStudent: (fields: FormData) => Promise<void>;
  onRegisterCollaborator?: (fields: FormData) => Promise<void>;
  students: Student[];
  schedules: WorkoutSchedule[];
  attendance: Attendance[];
  justifications: AbsenceJustification[];
  announcements: Announcement[];
  onUpdateStudent: (studentId: string, values: Partial<Student>) => Promise<void>;
  onSetStudentStatus: (studentId: string, status: StudentStatus) => Promise<void>;
  onCreateSchedule: (values: { studentId: string; title: string; description: string; date: string; startTime: string; endTime: string; location: string }) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  onSetAttendance: (studentId: string, date: string, status: AttendanceStatus, note: string) => Promise<void>;
  onReviewJustification: (id: string, status: 'approved' | 'rejected', note: string) => Promise<void>;
  onCreateAnnouncement: (title: string, message: string) => Promise<void>;
  onToggleAnnouncement: (id: string, active: boolean) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

type AdminView = 'overview' | 'students' | 'agenda' | 'attendance' | 'announcements';

const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`)).replace('.', '');
const formatTime = (time: string) => time.slice(0, 5);

export default function AdminDashboard({ onRefreshStudents, onRegisterStudent, onRegisterCollaborator, students, schedules, attendance, justifications, announcements, onUpdateStudent, onSetStudentStatus, onCreateSchedule, onDeleteSchedule, onSetAttendance, onReviewJustification, onCreateAnnouncement, onToggleAnnouncement, onDeleteAnnouncement, onSignOut }: AdminDashboardProps) {
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
  const today = new Date().toISOString().slice(0, 10);
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
          <button className={activeView === 'agenda' ? 'active' : ''} onClick={() => navigate('agenda')}><CalendarDays size={20} /> Agenda</button>
          <button className={activeView === 'attendance' ? 'active' : ''} onClick={() => navigate('attendance')}><CheckCircle2 size={20} /> Presença</button>
          <button className={activeView === 'announcements' ? 'active' : ''} onClick={() => navigate('announcements')}><Bell size={20} /> Avisos</button>
          {onRegisterCollaborator && <button onClick={() => { setMenuOpen(false); setRegistration('collaborator'); }}><Plus size={20} /> Cadastrar colaborador</button>}
        </nav>
        <button type="button" className="primary-button sidebar-register" onClick={() => { setMenuOpen(false); setRegistration('student'); }}><Plus size={20} /> Cadastrar aluno</button>
        <div className="admin-side-status"><div className="status-pulse" /><div><strong>Painel ativo</strong><span>Dados atualizados</span></div></div>
      </aside>
      {menuOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={23} /></button><button type="button" className="topbar-logo" onClick={() => navigate('overview')} aria-label="GPATF, voltar ao início"><img src="/image.png" alt="" /></button><div className="topbar-context"><span>Administração</span><strong>{activeView === 'overview' ? 'Visão geral' : activeView === 'students' ? 'Alunos' : activeView === 'agenda' ? 'Agenda' : activeView === 'attendance' ? 'Controle de presença' : 'Avisos'}</strong></div><div className="topbar-user"><div className="avatar avatar-small admin-avatar"><ShieldCheck size={17} /></div><span>Equipe GPATF</span><button type="button" className="topbar-signout" onClick={onSignOut}><LogOut size={18} aria-hidden="true" /> Sair</button></div></header>
        {feedback && <div className="toast"><CheckCircle2 size={18} /> {feedback}</div>}

        {activeView === 'overview' && <AdminOverview students={students} todaysSchedules={todaysSchedules} pendingJustifications={pendingJustifications} announcements={announcements} onNavigate={navigate} onReviewJustification={onReviewJustification} onCreateAnnouncement={onCreateAnnouncement} />}
        {activeView === 'students' && <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Acompanhamento individual</p><h1>Alunos</h1><p className="section-lede">Consulte fichas e mantenha os cadastros atualizados.</p></div><button className="primary-button" onClick={() => setRegistration('student')}><Plus size={20} /> Cadastrar aluno</button></div><div className="toolbar"><div className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou telefone" /></div><span className="toolbar-count">{filteredStudents.length} cadastro{filteredStudents.length === 1 ? '' : 's'}</span></div><div className="student-admin-list">{filteredStudents.map((student) => <StudentAdminRow key={student.id} student={student} onEdit={() => setSelectedStudent(student)} onStatus={handleStatus} />)}{filteredStudents.length === 0 && <div className="empty-state large-empty"><Users size={34} /><strong>Nenhum aluno encontrado</strong><p>Tente buscar por outro nome ou telefone.</p></div>}</div></section>}
        {activeView === 'agenda' && <AgendaManager students={activeStudents} schedules={schedules} showForm={showScheduleForm} setShowForm={setShowScheduleForm} saving={saving} setSaving={setSaving} onCreate={onCreateSchedule} onDelete={onDeleteSchedule} onFeedback={showFeedback} />}
        {activeView === 'attendance' && <AttendanceManager students={activeStudents} attendance={attendance} schedules={schedules} onSetAttendance={onSetAttendance} onFeedback={showFeedback} />}
        {activeView === 'announcements' && <AnnouncementsManager announcements={announcements} showForm={showAnnouncementForm} setShowForm={setShowAnnouncementForm} onCreate={onCreateAnnouncement} onToggle={onToggleAnnouncement} onDelete={onDeleteAnnouncement} onFeedback={showFeedback} />}
      </main>
      {registration && <RegistrationDrawer key={registration} kind={registration} onClose={() => setRegistration(null)} onSubmit={async (fields) => {
        if (registration === 'student') await onRegisterStudent(fields);
        else if (onRegisterCollaborator) await onRegisterCollaborator(fields);
        setRegistration(null);
        showFeedback(registration === 'student' ? 'Aluno cadastrado com sucesso.' : 'Colaborador cadastrado com sucesso.');
      }} />}
      {selectedStudent && <StudentEditDrawer key={selectedStudent.id} student={selectedStudent} onCertificateSaved={async (updated) => { setSelectedStudent(updated); await onRefreshStudents(); }} onClose={() => setSelectedStudent(null)} onSave={async (values) => { await onUpdateStudent(selectedStudent.id, values); setSelectedStudent({ ...selectedStudent, ...values }); showFeedback('Ficha atualizada com sucesso.'); }} onStatus={(status) => handleStatus(selectedStudent, status)} saving={saving} />}
    </div>
  );
}

function AdminOverview({ students, todaysSchedules, pendingJustifications, announcements, onNavigate, onReviewJustification, onCreateAnnouncement }: { students: Student[]; todaysSchedules: WorkoutSchedule[]; pendingJustifications: AbsenceJustification[]; announcements: Announcement[]; onNavigate: (view: AdminView) => void; onReviewJustification: (id: string, status: 'approved' | 'rejected', note: string) => Promise<void>; onCreateAnnouncement: (title: string, message: string) => Promise<void> }) {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [reviewing, setReviewing] = useState('');
  const activeStudents = students.filter((student) => student.status === 'active').length;

  const submitAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onCreateAnnouncement(announcementTitle, announcementMessage);
    setAnnouncementTitle('');
    setAnnouncementMessage('');
    setShowAnnouncementForm(false);
  };

  const review = async (item: AbsenceJustification, status: 'approved' | 'rejected') => {
    setReviewing(item.id);
    await onReviewJustification(item.id, status, '');
    setReviewing('');
  };

  return <section className="view-section"><section className="admin-welcome"><div><p className="eyebrow">Painel da equipe</p><h1>Bom trabalho hoje.</h1><p className="section-lede">Aqui está um resumo da Academia GPATF.</p></div><div className="admin-date"><span>Hoje</span><strong>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date())}</strong></div></section><section className="metric-grid admin-metrics"><div className="metric-card"><div className="metric-icon blue"><Users size={21} /></div><div><strong>{activeStudents}</strong><span>alunos ativos</span></div><button onClick={() => onNavigate('students')}><ChevronRight size={17} /></button></div><div className="metric-card"><div className="metric-icon green"><CalendarDays size={21} /></div><div><strong>{todaysSchedules.length}</strong><span>treinos hoje</span></div><button onClick={() => onNavigate('agenda')}><ChevronRight size={17} /></button></div><div className="metric-card"><div className="metric-icon sand"><FileText size={21} /></div><div><strong>{pendingJustifications.length}</strong><span>justificativas pendentes</span></div><button onClick={() => onNavigate('attendance')}><ChevronRight size={17} /></button></div></section><div className="dashboard-grid admin-grid"><section className="content-card"><div className="card-heading"><div><p className="eyebrow">Atenção da equipe</p><h2>Justificativas recentes</h2></div><button className="link-button" onClick={() => onNavigate('attendance')}>Ver todas <ChevronRight size={16} /></button></div>{pendingJustifications.length ? pendingJustifications.slice(0, 4).map((item) => <div className="review-row" key={item.id}><div className="review-avatar"><FileText size={18} /></div><div className="review-main"><strong>{students.find((student) => student.id === item.student_id)?.full_name ?? 'Aluno'}</strong><span>{formatDate(item.absence_date)} · {item.reason}</span></div><div className="review-actions"><button className="icon-action success" disabled={reviewing === item.id} onClick={() => review(item, 'approved')} aria-label="Aprovar"><Check size={17} /></button><button className="icon-action danger" disabled={reviewing === item.id} onClick={() => review(item, 'rejected')} aria-label="Recusar"><X size={17} /></button></div></div>) : <div className="empty-state compact-empty"><CheckCircle2 size={28} /><strong>Tudo em dia</strong><p>Nenhuma justificativa aguardando análise.</p></div>}</section><section className="content-card notice-admin-card"><div className="card-heading"><div><p className="eyebrow">Comunicação</p><h2>Aviso na tela principal</h2></div><Bell size={21} className="heading-icon" /></div>{announcements.length ? <div className="active-notice"><span className="notice-live"><span /> Publicado</span><h3>{announcements[0].title}</h3><p>{announcements[0].message}</p></div> : <div className="empty-state compact-empty"><Bell size={28} /><p>Nenhum aviso publicado.</p></div>}<button className="outline-button full-button" onClick={() => setShowAnnouncementForm((value) => !value)}><Plus size={17} /> Criar novo aviso</button>{showAnnouncementForm && <form className="mini-form" onSubmit={submitAnnouncement}><input required value={announcementTitle} onChange={(event) => setAnnouncementTitle(event.target.value)} placeholder="Título do aviso" /><textarea required rows={3} value={announcementMessage} onChange={(event) => setAnnouncementMessage(event.target.value)} placeholder="Mensagem para os alunos" /><button className="primary-button" type="submit">Publicar aviso</button></form>}</section></div><section className="content-card today-card"><div className="card-heading"><div><p className="eyebrow">Agenda de hoje</p><h2>Treinos programados</h2></div><button className="link-button" onClick={() => onNavigate('agenda')}>Gerenciar agenda <ChevronRight size={16} /></button></div>{todaysSchedules.length ? <div className="today-grid">{todaysSchedules.map((schedule) => <div className="today-item" key={schedule.id}><span>{formatTime(schedule.start_time)}</span><div><strong>{schedule.title}</strong><small>{students.find((student) => student.id === schedule.student_id)?.full_name ?? 'Aluno'}</small></div><Clock3 size={16} /></div>)}</div> : <p className="muted-text">Nenhum treino marcado para hoje.</p>}</section></section>;
}

function StudentAdminRow({ student, onEdit, onStatus }: { student: Student; onEdit: () => void; onStatus: (student: Student, status: StudentStatus) => void }) {
  return <div className="student-admin-row"><div className="avatar avatar-medium"><UserRound size={20} /></div><div className="student-row-main"><strong>{student.full_name}</strong><span>{student.phone ?? 'Sem telefone'} · Cadastro em {formatDate(student.created_at.slice(0, 10))}</span></div><span className={`status-badge ${student.status}`}>{student.status === 'active' ? 'Ativo' : student.status === 'blocked' ? 'Bloqueado' : 'Inativo'}</span><button className="outline-button" onClick={onEdit}><Pencil size={16} /> Abrir ficha</button><button className="icon-button row-more" aria-label="Mais opções" onClick={() => onStatus(student, student.status === 'active' ? 'blocked' : 'active')}>{student.status === 'active' ? <Archive size={17} /> : <Check size={17} />}</button></div>;
}

function StudentEditDrawer({ student, onCertificateSaved, onClose, onSave, onStatus, saving }: { student: Student; onCertificateSaved: (student: Student) => Promise<void>; onClose: () => void; onSave: (values: Partial<Student>) => Promise<void>; onStatus: (status: StudentStatus) => Promise<void>; saving: boolean }) {
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
    <p>{certificateStatus(student.medical_certificate_expires_on)}</p>
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
    <p>Controle do cadastro</p><div className="status-controls"><button disabled={saving || student.status === 'active'} onClick={() => onStatus('active')}><Check size={16} /> Ativar</button><button disabled={saving || student.status === 'blocked'} onClick={() => onStatus('blocked')}><Archive size={16} /> Bloquear</button><button disabled={saving || student.status === 'inactive'} onClick={() => onStatus('inactive')}><X size={16} /> Inativar</button></div></div></aside></>;
}

function AgendaManager({ students, schedules, showForm, setShowForm, saving, setSaving, onCreate, onDelete, onFeedback }: { students: Student[]; schedules: WorkoutSchedule[]; showForm: boolean; setShowForm: (value: boolean) => void; saving: boolean; setSaving: (value: boolean) => void; onCreate: (values: { studentId: string; title: string; description: string; date: string; startTime: string; endTime: string; location: string }) => Promise<void>; onDelete: (id: string) => Promise<void>; onFeedback: (message: string) => void }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? '');
  const [title, setTitle] = useState('Treino de força');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [location, setLocation] = useState('Academia GPATF');
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); try { await onCreate({ studentId, title, description, date, startTime, endTime, location }); setShowForm(false); onFeedback('Treino adicionado à agenda.'); } catch { onFeedback('Não foi possível criar o treino.'); } finally { setSaving(false); } };
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Planejamento</p><h1>Agenda de treinos</h1><p className="section-lede">Crie e organize os próximos compromissos dos alunos.</p></div><button className="primary-button" onClick={() => setShowForm(!showForm)}><Plus size={18} /> Novo treino</button></div>{showForm && <form className="content-card schedule-form" onSubmit={submit}><div className="card-heading"><div><h2>Novo treino</h2><p>Escolha o aluno e o horário.</p></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}><X size={20} /></button></div><div className="two-columns"><label className="field-label">Aluno<select required value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option key={student.id} value={student.id}>{student.full_name}</option>)}</select></label><label className="field-label">Nome do treino<input required value={title} onChange={(event) => setTitle(event.target.value)} /></label></div><div className="two-columns"><label className="field-label">Data<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field-label">Local<input required value={location} onChange={(event) => setLocation(event.target.value)} /></label></div><div className="two-columns"><label className="field-label">Início<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label><label className="field-label">Fim<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label></div><label className="field-label">Observação<textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: levar garrafinha de água" /></label><button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Adicionar à agenda'} <Check size={17} /></button></form>}<div className="content-card schedule-admin-list"><div className="card-heading"><div><p className="eyebrow">Todos os alunos</p><h2>Próximos treinos</h2></div><span className="toolbar-count">{schedules.length} agendados</span></div>{schedules.length ? schedules.map((schedule) => <div className="admin-schedule-row" key={schedule.id}><div className="schedule-date"><strong>{new Date(`${schedule.scheduled_date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${schedule.scheduled_date}T12:00:00`)).replace('.', '')}</span></div><div className="schedule-main"><span className="schedule-weekday">{formatDate(schedule.scheduled_date)} · {formatTime(schedule.start_time)}</span><strong>{schedule.title}</strong><p>{students.find((student) => student.id === schedule.student_id)?.full_name ?? 'Aluno'} <span className="dot-separator">·</span> {schedule.location}</p></div><button className="icon-button danger-icon" onClick={() => onDelete(schedule.id)} aria-label="Excluir treino"><Trash2 size={17} /></button></div>) : <div className="empty-state large-empty"><CalendarDays size={34} /><strong>Agenda vazia</strong><p>Adicione um treino para começar.</p></div>}</div></section>;
}

function AttendanceManager({ students, attendance, schedules, onSetAttendance, onFeedback }: { students: Student[]; attendance: Attendance[]; schedules: WorkoutSchedule[]; onSetAttendance: (studentId: string, date: string, status: AttendanceStatus, note: string) => Promise<void>; onFeedback: (message: string) => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const relevantSchedules = schedules.filter((schedule) => schedule.scheduled_date === date);
  const current = (studentId: string) => attendance.find((item) => item.student_id === studentId && item.attendance_date === date)?.status ?? 'pending';
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Registro diário</p><h1>Controle de presença</h1><p className="section-lede">Confirme quem participou de cada atividade.</p></div><div className="round-icon"><CheckCircle2 size={24} /></div></div><div className="attendance-toolbar content-card"><label className="field-label">Dia da presença<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><div className="attendance-summary"><span><strong>{relevantSchedules.length}</strong> treino{relevantSchedules.length === 1 ? '' : 's'} no dia</span><span><strong>{students.length}</strong> alunos ativos</span></div></div><div className="content-card attendance-card"><div className="attendance-head"><span>Aluno</span><span>Status do dia</span></div>{students.map((student) => <div className="attendance-row" key={student.id}><div className="avatar avatar-medium"><UserRound size={19} /></div><div className="student-row-main"><strong>{student.full_name}</strong><span>{relevantSchedules.find((schedule) => schedule.student_id === student.id)?.title ?? 'Sem treino agendado'}</span></div><div className="attendance-buttons"><button className={current(student.id) === 'present' ? 'active present' : ''} onClick={async () => { await onSetAttendance(student.id, date, 'present', ''); onFeedback('Presença confirmada.'); }}>Presente</button><button className={current(student.id) === 'absent' ? 'active absent' : ''} onClick={async () => { await onSetAttendance(student.id, date, 'absent', ''); onFeedback('Falta registrada.'); }}>Ausente</button><button className={current(student.id) === 'justified' ? 'active justified' : ''} onClick={async () => { await onSetAttendance(student.id, date, 'justified', ''); onFeedback('Presença marcada como justificada.'); }}>Justificada</button></div></div>)}{students.length === 0 && <div className="empty-state large-empty"><Users size={34} /><strong>Nenhum aluno ativo</strong></div>}</div></section>;
}

function AnnouncementsManager({ announcements, showForm, setShowForm, onCreate, onToggle, onDelete, onFeedback }: { announcements: Announcement[]; showForm: boolean; setShowForm: (value: boolean) => void; onCreate: (title: string, message: string) => Promise<void>; onToggle: (id: string, active: boolean) => Promise<void>; onDelete: (id: string) => Promise<void>; onFeedback: (message: string) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onCreate(title, message); setTitle(''); setMessage(''); setShowForm(false); onFeedback('Aviso publicado na tela dos alunos.'); };
  return <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Comunicação</p><h1>Avisos</h1><p className="section-lede">Deixe um recado importante visível para os alunos.</p></div><button className="primary-button" onClick={() => setShowForm(!showForm)}><Plus size={18} /> Novo aviso</button></div>{showForm && <form className="content-card announcement-form" onSubmit={submit}><div className="card-heading"><div><h2>Publicar aviso</h2><p>O aviso ficará visível no painel principal.</p></div><button type="button" className="icon-button" onClick={() => setShowForm(false)}><X size={20} /></button></div><label className="field-label">Título<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Recesso da academia" /></label><label className="field-label">Mensagem<textarea required rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva uma mensagem clara e acolhedora" /></label><button className="primary-button" type="submit">Publicar aviso <Bell size={17} /></button></form>}<div className="announcement-list">{announcements.map((announcement) => <div className={`content-card announcement-admin-row ${announcement.active ? '' : 'inactive'}`} key={announcement.id}><div className="announcement-icon"><Bell size={20} /></div><div><span className="notice-live"><span /> {announcement.active ? 'Publicado' : 'Pausado'}</span><h3>{announcement.title}</h3><p>{announcement.message}</p><small>Publicado em {new Intl.DateTimeFormat('pt-BR').format(new Date(announcement.created_at))}</small></div><div className="announcement-actions"><button className="outline-button" onClick={async () => { await onToggle(announcement.id, !announcement.active); onFeedback(announcement.active ? 'Aviso pausado.' : 'Aviso publicado.'); }}>{announcement.active ? 'Pausar' : 'Publicar'}</button><button className="icon-button danger-icon" onClick={async () => { await onDelete(announcement.id); onFeedback('Aviso removido.'); }} aria-label="Excluir aviso"><Trash2 size={17} /></button></div></div>)}{announcements.length === 0 && <div className="content-card empty-state large-empty"><Bell size={34} /><strong>Nenhum aviso publicado</strong><p>Crie o primeiro recado para os alunos.</p></div>}</div></section>;
}

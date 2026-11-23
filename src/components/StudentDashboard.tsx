import SupportChat from './SupportChat';
import AnnouncementCarousel from './AnnouncementCarousel';
import { StudentTrainingPlan } from './TrainingPlans';
import { FormEvent, useMemo, useState } from 'react';
import { Bell, CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, FileText, HeartPulse, LogOut, MapPin, Menu, ShieldCheck, UserRound } from 'lucide-react';
import { AbsenceJustification, Announcement, Attendance, AttendanceConfirmation, Student, WorkoutSchedule } from '@/types';

import StudentProfileEditor from '@/components/StudentProfileEditor';
import { certificateStatus, todayInSantaMaria } from '@/lib/registration';

interface StudentDashboardProps {
  student: Student;
  schedules: WorkoutSchedule[];
  attendance: Attendance[];
  confirmations: AttendanceConfirmation[];
  justifications: AbsenceJustification[];
  announcements: Announcement[];
  avatarUrl: string | null;
  onEditProfile: (fields: FormData) => Promise<void>;
  onUploadCertificate: (fields: FormData) => Promise<void>;
  onUploadAvatar: (fields: FormData) => Promise<void>;
  onConfirmPresence: (schedule: WorkoutSchedule) => Promise<void>;
  onSubmitJustification: (date: string, reason: string, file: File | null) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const formatWeekday = (date: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(`${date}T12:00:00`));
const formatTime = (time: string) => time.slice(0, 5);

export default function StudentDashboard({ student, schedules, attendance, confirmations, justifications, announcements, avatarUrl, onEditProfile, onUploadCertificate, onUploadAvatar, onConfirmPresence, onSubmitJustification, onSignOut }: StudentDashboardProps) {
  const [presenceBusy, setPresenceBusy] = useState(false);
  async function togglePresence(schedule: WorkoutSchedule) { if(presenceBusy) return; setPresenceBusy(true); try { await onConfirmPresence(schedule); } catch { setMessage('Não foi possível atualizar a presença. Tente novamente.'); } finally { setPresenceBusy(false); } }
  const [activeView, setActiveView] = useState<'overview' | 'agenda' | 'profile' | 'absence'>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  const [absenceDate, setAbsenceDate] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [absenceFile, setAbsenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const nextSchedule = schedules.find((schedule) => schedule.status === 'scheduled' && schedule.scheduled_date >= todayInSantaMaria());
  const presentCount = attendance.filter((item) => item.status === 'present').length;
  const confirmedDates = useMemo(() => new Set(confirmations.map((item) => item.attendance_date)), [confirmations]);

  const submitAbsence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    try {
      await onSubmitJustification(absenceDate, absenceReason, absenceFile);
      setAbsenceDate('');
      setAbsenceReason('');
      setAbsenceFile(null);
      setMessage('Sua justificativa foi enviada para a equipe GPATF.');
    } catch {
      setMessage('Não foi possível enviar agora. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigate = (view: 'overview' | 'agenda' | 'profile' | 'absence') => {
    setActiveView(view);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <button type="button" className="sidebar-brand home-brand" onClick={() => navigate('overview')} aria-label="GPATF, voltar ao início"><div className="logo-frame"><img src="/image.png" alt="Logo GPATF" /></div><div><strong>GPATF</strong><span>Área do aluno</span></div></button>
        <nav className="side-nav">
          <button className={activeView === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><HeartPulse size={20} /> Visão geral</button>
          <button className={activeView === 'agenda' ? 'active' : ''} onClick={() => navigate('agenda')}><CalendarDays size={20} /> Minha agenda</button>
          <button className={activeView === 'profile' ? 'active' : ''} onClick={() => navigate('profile')}><UserRound size={20} /> Minha ficha</button>
          <button className={activeView === 'absence' ? 'active' : ''} onClick={() => navigate('absence')}><FileText size={20} /> Justificar falta</button>
        </nav>
        <SupportChat student={student} />
        <button type="button" className="logout-button" onClick={onSignOut}><LogOut size={18} aria-hidden="true" /> Sair</button>
      </aside>
      {menuOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">{message && <p role="status" className="alert">{message}</p>}
        <header className="topbar"><button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={23} /></button><button type="button" className="topbar-logo" onClick={() => navigate('overview')} aria-label="GPATF, voltar ao início"><img src="/image.png" alt="" /></button><div className="topbar-context"><span>Área do aluno</span><strong>{activeView === 'overview' ? 'Visão geral' : activeView === 'agenda' ? 'Minha agenda' : activeView === 'absence' ? 'Justificar falta' : 'Minha ficha'}</strong></div><div className="topbar-user"><SupportChat student={student} compact /><button className="profile-shortcut" onClick={() => navigate('profile')} aria-label="Abrir meu perfil"><div className="avatar avatar-small">{avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" /> : <UserRound size={17} />}</div><span>{student.full_name.split(' ')[0]}</span></button></div></header>

        {activeView === 'overview' && <>
          <section className="welcome-row"><div><p className="eyebrow">Bom te ver por aqui</p><h1>Olá, {student.full_name.split(' ')[0]}.</h1><p className="section-lede">Seu cuidado começa com um passo de cada vez.</p></div><div className="welcome-date"><CalendarDays size={18} /><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span></div></section>
          <AnnouncementCarousel announcements={announcements} />
          <section className="metric-grid student-metrics"><div className="metric-card"><div className="metric-icon blue"><CalendarDays size={21} /></div><div><strong>{schedules.length}</strong><span>treinos na agenda</span></div></div><div className="metric-card"><div className="metric-icon green"><CheckCircle2 size={21} /></div><div><strong>{presentCount}</strong><span>presenças confirmadas</span></div></div></section>
          <StudentTrainingPlan studentId={student.id} />
          <div className="dashboard-grid"><section className="content-card next-card"><div className="card-heading"><div><p className="eyebrow">Próximo compromisso</p><h2>Seu próximo treino</h2></div><button className="link-button" onClick={() => navigate('agenda')}>Ver agenda <ChevronRight size={16} /></button></div>{nextSchedule ? <div className="next-training"><div className="date-tile"><strong>{new Date(`${nextSchedule.scheduled_date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${nextSchedule.scheduled_date}T12:00:00`)).replace('.', '')}</span></div><div className="training-info"><span className="pill pill-blue">{formatWeekday(nextSchedule.scheduled_date)}</span><h3>{nextSchedule.title}</h3><p><Clock3 size={15} /> {formatTime(nextSchedule.start_time)}{nextSchedule.end_time ? ` às ${formatTime(nextSchedule.end_time)}` : ''} <span className="dot-separator">·</span> <MapPin size={15} /> {nextSchedule.location}</p></div><button className={confirmedDates.has(nextSchedule.scheduled_date) ? 'confirm-button confirmed' : 'confirm-button'} disabled={presenceBusy} onClick={() => togglePresence(nextSchedule)} >{confirmedDates.has(nextSchedule.scheduled_date) ? <><Check size={17} /> Remover presença</> : 'Confirmar presença'}</button></div> : <div className="empty-state"><CalendarDays size={28} /><strong>Nenhum treino agendado</strong><p>A equipe GPATF avisará quando houver uma nova atividade.</p></div>}</section><section className="content-card quick-card"><div className="card-heading"><div><p className="eyebrow">Acesso rápido</p><h2>O que você precisa?</h2></div></div><button className="quick-action" onClick={() => navigate('profile')}><div className="quick-action-icon soft"><UserRound size={19} /></div><div><strong>Conferir minha ficha</strong><span>Seus dados e cuidados importantes</span></div><ChevronRight size={17} /></button><button className="quick-action" onClick={() => navigate('absence')}><div className="quick-action-icon"><FileText size={19} /></div><div><strong>Justificar uma falta</strong><span>Envie uma explicação para a equipe</span></div><ChevronRight size={17} /></button></section></div>
          <section className="content-card agenda-preview"><div className="card-heading"><div><p className="eyebrow">Acompanhe de perto</p><h2>Próximos treinos</h2></div><button className="link-button" onClick={() => navigate('agenda')}>Abrir agenda <ChevronRight size={16} /></button></div><div className="schedule-list">{schedules.slice(0, 3).map((schedule) => <ScheduleRow key={schedule.id} schedule={schedule} confirmed={confirmedDates.has(schedule.scheduled_date)} onConfirm={() => togglePresence(schedule)} />)}{schedules.length === 0 && <p className="muted-text">Ainda não há atividades cadastradas.</p>}</div></section>
        </>}

        {activeView === 'agenda' && <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Organize sua semana</p><h1>Minha agenda</h1><p className="section-lede">Aqui você visualiza seus próximos treinos.</p></div><div className="round-icon"><CalendarDays size={24} /></div></div><div className="schedule-list large-list">{schedules.map((schedule) => <ScheduleRow key={schedule.id} schedule={schedule} confirmed={confirmedDates.has(schedule.scheduled_date)} onConfirm={() => onConfirmPresence(schedule)} />)}{schedules.length === 0 && <div className="empty-state large-empty"><CalendarDays size={34} /><strong>Nenhum treino na agenda</strong><p>Quando a equipe marcar uma atividade, ela aparecerá aqui.</p></div>}</div></section>}

        {activeView === 'profile' && <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Informações importantes</p><h1>Minha ficha</h1><p className="section-lede">Confira seus dados e os cuidados que a equipe deve conhecer.</p></div><div className="profile-header-avatar">{avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" /> : <UserRound size={30} />}</div></div><div className="profile-layout"><div className="content-card profile-card"><div className="profile-card-title"><UserRound size={19} /><h2>Dados pessoais</h2></div><InfoLine label="Nome completo" value={student.full_name} /><InfoLine label="Data de nascimento" value={new Intl.DateTimeFormat('pt-BR').format(new Date(`${student.birth_date}T12:00:00`))} /><InfoLine label="Telefone" value={student.phone ?? 'Não informado'} /><InfoLine label="Endereço" value={student.address} /><InfoLine label="Atestado para atividade física" value={certificateStatus(student.medical_certificate_expires_on, undefined, student.medical_certificate_path)} /></div><div className="content-card profile-card"><div className="profile-card-title"><ShieldCheck size={19} /><h2>Contato de emergência</h2></div><InfoLine label="Nome" value={student.emergency_contact_name} /><InfoLine label="Telefone" value={student.emergency_contact_phone} /><div className="health-note"><HeartPulse size={20} /><div><strong>Cuidados importantes</strong><p>{student.comorbidities || 'Nenhum cuidado informado no cadastro.'}</p></div></div></div></div><StudentProfileEditor student={student} onEditProfile={onEditProfile} onUploadCertificate={onUploadCertificate} onUploadAvatar={onUploadAvatar} /></section>}

        {activeView === 'absence' && <section className="view-section"><div className="section-title-row"><div><p className="eyebrow">Comunicação com a equipe</p><h1>Justificar uma falta</h1><p className="section-lede">Conte o que aconteceu. Sua justificativa será analisada pela administração.</p></div><div className="round-icon"><FileText size={24} /></div></div><div className="absence-layout"><form className="content-card form-card" onSubmit={submitAbsence}><div className="card-heading"><div><h2>Enviar justificativa</h2><p>Preencha os dados abaixo.</p></div></div><label className="field-label">Data da falta<input required type="date" value={absenceDate} onChange={(event) => setAbsenceDate(event.target.value)} /></label><label className="field-label">O que aconteceu?<textarea required rows={5} value={absenceReason} onChange={(event) => setAbsenceReason(event.target.value)} placeholder="Escreva uma breve explicação..." /></label><label className="upload-box compact"><div className="upload-icon"><FileText size={20} /></div><div><strong>{absenceFile ? absenceFile.name : 'Anexar atestado ou documento'}</strong><small>Opcional · PDF, JPG ou PNG</small></div><input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setAbsenceFile(event.target.files?.[0] ?? null)} /></label>{message && <div className={message.includes('não foi') ? 'alert alert-error' : 'alert alert-success'}>{message}</div>}<button className="primary-button button-large" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar justificativa'} <ArrowIcon /></button></form><div className="content-card history-card"><div className="card-heading"><div><p className="eyebrow">Acompanhe</p><h2>Minhas justificativas</h2></div></div>{justifications.length ? justifications.map((item) => <div className="justification-row" key={item.id}><div className="justification-date"><strong>{new Date(`${item.absence_date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${item.absence_date}T12:00:00`)).replace('.', '')}</span></div><div><strong>{item.reason}</strong><span className={`status-text ${item.status}`}>{item.status === 'pending' ? 'Em análise' : item.status === 'approved' ? 'Aprovada' : 'Não aprovada'}</span></div></div>) : <div className="empty-state"><FileText size={28} /><p>Você ainda não enviou justificativas.</p></div>}</div></div></section>}
      </main>
    </div>
  );
}

function ScheduleRow({ schedule, confirmed, onConfirm }: { schedule: WorkoutSchedule; confirmed: boolean; onConfirm: () => void }) {
  return <div className="schedule-row"><div className="schedule-date"><strong>{new Date(`${schedule.scheduled_date}T12:00:00`).getDate()}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(`${schedule.scheduled_date}T12:00:00`)).replace('.', '')}</span></div><div className="schedule-main"><span className="schedule-weekday">{formatWeekday(schedule.scheduled_date)}</span><strong>{schedule.title}</strong><p><Clock3 size={14} /> {formatTime(schedule.start_time)}{schedule.end_time ? ` às ${formatTime(schedule.end_time)}` : ''} <span className="dot-separator">·</span> <MapPin size={14} /> {schedule.location}</p>{schedule.workout_plan && <details className="workout-plan"><summary>Ficha de treino</summary><p>{schedule.workout_plan}</p></details>}</div><div className="schedule-action">{schedule.status === 'cancelled' ? <span className="pill pill-gray">Cancelado</span> : confirmed ? <button className="outline-button" onClick={onConfirm}>Remover presença</button> : <button className="outline-button" onClick={onConfirm}>Confirmar presença</button>}</div></div>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="info-line"><span>{label}</span><strong>{value}</strong></div>;
}

function ArrowIcon() {
  return <ChevronRight size={19} />;
}

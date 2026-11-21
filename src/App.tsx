import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import AuthScreen, { AuthRole, SignupValues } from '@/components/AuthScreen';
import AdminDashboard from '@/components/AdminDashboard';
import StudentDashboard from '@/components/StudentDashboard';
import { supabase, ADMIN_EMAIL, ADMIN_AUTH_PASSWORD, accountEmailFromIdentifier, accountEmailFromName, accountEmailFromPhone, FILE_BUCKET } from '@/lib/supabase';
import { AbsenceJustification, Announcement, Attendance, AttendanceConfirmation, AttendanceStatus, Student, StudentStatus, WorkoutSchedule } from '@/types';

const genericError = 'Não foi possível concluir agora. Confira os dados e tente novamente.';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [confirmations, setConfirmations] = useState<AttendanceConfirmation[]>([]);
  const [justifications, setJustifications] = useState<AbsenceJustification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      if (data.session) {
        await loadSessionData(data.session);
      }
      if (mounted) setIsBooting(false);
    }).catch(() => {
      if (mounted) setIsBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setRole(null);
        setStudent(null);
        setStudents([]);
        setSchedules([]);
        setAttendance([]);
        setConfirmations([]);
        setJustifications([]);
        setAnnouncements([]);
        setAvatarUrl(null);
        return;
      }
      if (nextSession && event === 'SIGNED_IN') {
        (async () => {
          await loadSessionData(nextSession);
        })();
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadSessionData(nextSession: Session) {
    setSession(nextSession);
    if (nextSession.user.email === ADMIN_EMAIL) {
      setRole('students');
      await loadAdminData();
      return;
    }
    const { data: currentStudent, error } = await supabase.from('students').select('*').eq('auth_id', nextSession.user.id).maybeSingle();
    if (error || !currentStudent) {
      await supabase.auth.signOut();
      setAuthError(genericError);
      return;
    }
    if (currentStudent.status === 'blocked' || currentStudent.status === 'inactive') {
      await supabase.auth.signOut();
      setAuthError('Este cadastro está bloqueado ou inativo. Procure a equipe GPATF.');
      return;
    }
    setRole('student');
    setStudent(currentStudent as Student);
    await loadStudentData(currentStudent as Student);
  }

  async function loadStudentData(currentStudent: Student) {
    const [scheduleResponse, attendanceResponse, confirmationResponse, justificationResponse, announcementResponse] = await Promise.all([
      supabase.from('workout_schedules').select('*').eq('student_id', currentStudent.id).order('scheduled_date', { ascending: true }),
      supabase.from('attendance').select('*').eq('student_id', currentStudent.id).order('attendance_date', { ascending: false }),
      supabase.from('attendance_confirmations').select('*').eq('student_id', currentStudent.id).order('attendance_date', { ascending: false }),
      supabase.from('absence_justifications').select('*').eq('student_id', currentStudent.id).order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }),
    ]);
    if (scheduleResponse.error || attendanceResponse.error || confirmationResponse.error || justificationResponse.error || announcementResponse.error) {
      setAuthError(genericError);
      return;
    }
    setSchedules((scheduleResponse.data ?? []) as WorkoutSchedule[]);
    setAttendance((attendanceResponse.data ?? []) as Attendance[]);
    setConfirmations((confirmationResponse.data ?? []) as AttendanceConfirmation[]);
    setJustifications((justificationResponse.data ?? []) as AbsenceJustification[]);
    setAnnouncements((announcementResponse.data ?? []) as Announcement[]);
    if (currentStudent.avatar_path) {
      const { data } = await supabase.storage.from(FILE_BUCKET).createSignedUrl(currentStudent.avatar_path, 3600);
      setAvatarUrl(data?.signedUrl ?? null);
    } else {
      setAvatarUrl(null);
    }
  }

  async function loadAdminData() {
    const [studentsResponse, scheduleResponse, attendanceResponse, justificationResponse, announcementResponse] = await Promise.all([
      supabase.from('students').select('*').order('full_name', { ascending: true }),
      supabase.from('workout_schedules').select('*').order('scheduled_date', { ascending: true }),
      supabase.from('attendance').select('*').order('attendance_date', { ascending: false }),
      supabase.from('absence_justifications').select('*').order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    ]);
    if (studentsResponse.error || scheduleResponse.error || attendanceResponse.error || justificationResponse.error || announcementResponse.error) {
      setAuthError(genericError);
      return;
    }
    setStudents((studentsResponse.data ?? []) as Student[]);
    setSchedules((scheduleResponse.data ?? []) as WorkoutSchedule[]);
    setAttendance((attendanceResponse.data ?? []) as Attendance[]);
    setJustifications((justificationResponse.data ?? []) as AbsenceJustification[]);
    setAnnouncements((announcementResponse.data ?? []) as Announcement[]);
  }

  async function handleLogin(loginRole: AuthRole, identifier: string, password: string) {
    setIsLoading(true);
    setAuthError('');
    setNotice('');
    try {
      const email = loginRole === 'admin' ? ADMIN_EMAIL : accountEmailFromIdentifier(identifier);
      let authSession: Session | null = null;
      if (loginRole === 'admin') {
        if (identifier.trim().toLowerCase() !== 'adm' || password !== 'adm123') throw new Error('login');
        const signInResponse = await supabase.auth.signInWithPassword({ email, password: ADMIN_AUTH_PASSWORD });
        if (!signInResponse.error && signInResponse.data.session) {
          authSession = signInResponse.data.session;
        } else {
          const signupResponse = await supabase.auth.signUp({ email, password: ADMIN_AUTH_PASSWORD });
          if (!signupResponse.error && signupResponse.data.session) {
            authSession = signupResponse.data.session;
          } else {
            const retryResponse = await supabase.auth.signInWithPassword({ email, password: ADMIN_AUTH_PASSWORD });
            if (!retryResponse.error) authSession = retryResponse.data.session;
          }
        }
      } else {
        const signInResponse = await supabase.auth.signInWithPassword({ email, password });
        if (!signInResponse.error) authSession = signInResponse.data.session;
      }
      if (!authSession) throw new Error('login');
      await loadSessionData(authSession);
    } catch {
      setAuthError(loginRole === 'admin' ? 'Nome de acesso ou senha incorretos.' : 'Telefone ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignup(values: SignupValues) {
    setIsLoading(true);
    setAuthError('');
    setNotice('');
    try {
      const email = values.phone.trim() ? accountEmailFromPhone(values.phone) : accountEmailFromName(values.fullName);
      const signupResponse = await supabase.auth.signUp({ email, password: values.password });
      if (signupResponse.error || !signupResponse.data.user || !signupResponse.data.session) throw new Error('signup');
      const { data: createdStudent, error: studentError } = await supabase.from('students').insert({
        full_name: values.fullName,
        birth_date: values.birthDate,
        address: values.address,
        phone: values.phone.trim() || null,
        emergency_contact_name: values.emergencyContactName,
        emergency_contact_phone: values.emergencyContactPhone,
        comorbidities: values.comorbidities,
      }).select('*').maybeSingle();
      if (studentError || !createdStudent) throw new Error('profile');
      if (values.avatar) {
        const extension = values.avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `avatars/${signupResponse.data.user.id}/profile-${Date.now()}.${extension}`;
        const uploadResponse = await supabase.storage.from(FILE_BUCKET).upload(path, values.avatar, { upsert: true, contentType: values.avatar.type });
        if (!uploadResponse.error) {
          await supabase.from('students').update({ avatar_path: path }).eq('id', createdStudent.id);
          (createdStudent as Student).avatar_path = path;
        }
      }
      await loadSessionData(signupResponse.data.session);
    } catch {
      await supabase.auth.signOut();
      setAuthError('Não foi possível concluir o cadastro. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleConfirmPresence(schedule: WorkoutSchedule) {
    if (!student) return;
    const { error } = await supabase.from('attendance_confirmations').upsert({ student_id: student.id, schedule_id: schedule.id, attendance_date: schedule.scheduled_date }, { onConflict: 'student_id,attendance_date' });
    if (error) throw new Error('confirmation');
    await loadStudentData(student);
  }

  async function handleSubmitJustification(date: string, reason: string, file: File | null) {
    if (!student) return;
    let filePath: string | null = null;
    if (file) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      filePath = `justifications/${student.auth_id}/${Date.now()}-${safeName}`;
      const uploadResponse = await supabase.storage.from(FILE_BUCKET).upload(filePath, file, { contentType: file.type });
      if (uploadResponse.error) throw new Error('upload');
    }
    const { error } = await supabase.from('absence_justifications').insert({ student_id: student.id, absence_date: date, reason, file_path: filePath });
    if (error) throw new Error('justification');
    await loadStudentData(student);
  }

  async function handleUpdateStudent(studentId: string, values: Partial<Student>) {
    const { error } = await supabase.from('students').update(values).eq('id', studentId);
    if (error) throw new Error('student');
    await loadAdminData();
  }

  async function handleSetStudentStatus(studentId: string, status: StudentStatus) {
    const { error } = await supabase.rpc('set_student_status', { p_student_id: studentId, p_status: status });
    if (error) throw new Error('status');
    await loadAdminData();
  }

  async function handleCreateSchedule(values: { studentId: string; title: string; description: string; date: string; startTime: string; endTime: string; location: string }) {
    const { error } = await supabase.from('workout_schedules').insert({ student_id: values.studentId, title: values.title, description: values.description, scheduled_date: values.date, start_time: values.startTime, end_time: values.endTime || null, location: values.location });
    if (error) throw new Error('schedule');
    await loadAdminData();
  }

  async function handleDeleteSchedule(scheduleId: string) {
    const { error } = await supabase.from('workout_schedules').delete().eq('id', scheduleId);
    if (error) throw new Error('schedule');
    await loadAdminData();
  }

  async function handleSetAttendance(studentId: string, date: string, status: AttendanceStatus, note: string) {
    const { error } = await supabase.from('attendance').upsert({ student_id: studentId, attendance_date: date, status, note, confirmed_at: new Date().toISOString() }, { onConflict: 'student_id,attendance_date' });
    if (error) throw new Error('attendance');
    await loadAdminData();
  }

  async function handleReviewJustification(id: string, status: 'approved' | 'rejected', note: string) {
    const { error } = await supabase.from('absence_justifications').update({ status, admin_note: note, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error('review');
    await loadAdminData();
  }

  async function handleCreateAnnouncement(title: string, message: string) {
    const { error } = await supabase.from('announcements').insert({ title, message });
    if (error) throw new Error('announcement');
    await loadAdminData();
  }

  async function handleToggleAnnouncement(id: string, active: boolean) {
    const { error } = await supabase.from('announcements').update({ active }).eq('id', id);
    if (error) throw new Error('announcement');
    await loadAdminData();
  }

  async function handleDeleteAnnouncement(id: string) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw new Error('announcement');
    await loadAdminData();
  }

  if (isBooting) return <div className="loading-screen"><div className="loading-mark"><img src="/image.png" alt="Logo GPATF" /></div><div className="loading-line" /><p>Preparando seu espaço GPATF...</p></div>;
  if (!session || !role) return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} isLoading={isLoading} error={authError} notice={notice} />;
  if (role === 'admin') return <AdminDashboard students={students} schedules={schedules} attendance={attendance} justifications={justifications} announcements={announcements} onUpdateStudent={handleUpdateStudent} onSetStudentStatus={handleSetStudentStatus} onCreateSchedule={handleCreateSchedule} onDeleteSchedule={handleDeleteSchedule} onSetAttendance={handleSetAttendance} onReviewJustification={handleReviewJustification} onCreateAnnouncement={handleCreateAnnouncement} onToggleAnnouncement={handleToggleAnnouncement} onDeleteAnnouncement={handleDeleteAnnouncement} onSignOut={handleSignOut} />;
  if (!student) return <div className="loading-screen"><p>Carregando sua ficha...</p></div>;
  return <StudentDashboard student={student} schedules={schedules} attendance={attendance} confirmations={confirmations} justifications={justifications} announcements={announcements} avatarUrl={avatarUrl} onConfirmPresence={handleConfirmPresence} onSubmitJustification={handleSubmitJustification} onSignOut={handleSignOut} />;
}

export default App;

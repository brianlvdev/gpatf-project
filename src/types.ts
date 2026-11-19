export type UserRole = 'student' | 'admin';
export type StudentStatus = 'active' | 'blocked' | 'inactive';
export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'pending' | 'present' | 'absent' | 'justified';
export type JustificationStatus = 'pending' | 'approved' | 'rejected';

export interface Student {
  id: string;
  auth_id: string;
  full_name: string;
  birth_date: string;
  address: string;
  phone: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  comorbidities: string;
  avatar_path: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSchedule {
  id: string;
  student_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  status: ScheduleStatus;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string;
  confirmed_at: string | null;
}

export interface AttendanceConfirmation {
  id: string;
  student_id: string;
  schedule_id: string | null;
  attendance_date: string;
  confirmed_at: string;
}

export interface AbsenceJustification {
  id: string;
  student_id: string;
  absence_date: string;
  reason: string;
  file_path: string | null;
  status: JustificationStatus;
  admin_note: string;
  reviewed_at: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

import { FormEvent, ReactNode, useState } from 'react';
import CertificateFields from '@/components/CertificateFields';
import { todayInSantaMaria } from '@/lib/registration';
import type { Student } from '@/types';

type Save = (fields: FormData) => Promise<void>;

function ProfileForm({ children, label, onSave, resetAfterSave = false }: {
  children: ReactNode;
  label: string;
  onSave: Save;
  resetAfterSave?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setMessage('');
    try {
      await onSave(new FormData(form));
      if (resetAfterSave) form.reset();
      setMessage('Alterações salvas.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar agora.');
    } finally {
      setSaving(false);
    }
  }

  return <form className="form-stack profile-edit-form" onSubmit={submit}>
    {children}
    <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Salvando…' : label}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}

export default function StudentProfileEditor({ student, onEditProfile, onUploadCertificate, onUploadAvatar }: {
  student: Student;
  onEditProfile: Save;
  onUploadCertificate: Save;
  onUploadAvatar: Save;
}) {
  return <div className="profile-edit-grid">
    <section className="content-card">
      <h2>Editar meus dados</h2>
      <ProfileForm label="Salvar dados" onSave={onEditProfile}>
        <label className="field-label">Nome completo<input required name="fullName" defaultValue={student.full_name} /></label>
        <label className="field-label">Data de nascimento<input required type="date" name="birthDate" max={todayInSantaMaria()} defaultValue={student.birth_date} /></label>
        <label className="field-label">Endereço<input required name="address" defaultValue={student.address} /></label>
        <label className="field-label">Telefone de contato<input type="tel" name="phone" defaultValue={student.phone ?? ''} /></label>
        <p className="form-hint">Continue usando o telefone ou nome que você usou no cadastro para entrar na conta.</p>
        <label className="field-label">Nome do contato de emergência<input required name="emergencyContactName" defaultValue={student.emergency_contact_name} /></label>
        <label className="field-label">Telefone de emergência<input required type="tel" name="emergencyContactPhone" defaultValue={student.emergency_contact_phone} /></label>
        <label className="field-label">Cuidados importantes<textarea rows={3} name="comorbidities" defaultValue={student.comorbidities} /></label>
      </ProfileForm>
    </section>
    <section className="content-card">
      <h2>Minhas fotos e documentos</h2>
      <ProfileForm label="Salvar foto de perfil" onSave={onUploadAvatar} resetAfterSave>
        <label className="field-label">Foto de perfil (JPG ou PNG, até 5 MB)
          <input required type="file" name="avatar" accept="image/jpeg,image/png" />
        </label>
      </ProfileForm>
      <ProfileForm label={student.medical_certificate_path ? 'Substituir meu atestado' : 'Enviar meu atestado'} onSave={onUploadCertificate} resetAfterSave>
        <CertificateFields required />
      </ProfileForm>
    </section>
  </div>;
}

import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import StudentRegistrationFields from '@/components/StudentRegistrationFields';
import { todayInSantaMaria } from '@/lib/registration';

interface RegistrationDrawerProps {
  kind: 'student' | 'collaborator';
  onClose: () => void;
  onSubmit: (fields: FormData) => Promise<void>;
}

export default function RegistrationDrawer({ kind, onClose, onSubmit }: RegistrationDrawerProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const title = kind === 'student' ? 'Cadastrar aluno' : 'Cadastrar colaborador';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(new FormData(event.currentTarget));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir o cadastro.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="drawer-backdrop" aria-label="Fechar cadastro" onClick={onClose} disabled={saving} />
      <aside className="edit-drawer" role="dialog" aria-modal="true" aria-labelledby="registration-title">
        <div className="drawer-header">
          <h2 id="registration-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} disabled={saving} aria-label="Fechar">
            <X size={21} />
          </button>
        </div>
        <form className="drawer-form" onSubmit={submit}>
          {kind === 'student' ? <>
            <StudentRegistrationFields />
            <div className="drawer-divider" />
            <p className="form-section-label standalone">Atestado para atividade física (opcional)</p>
            <label className="field-label">Foto do atestado (JPG ou PNG, até 5 MB)
              <input type="file" name="certificate" accept="image/jpeg,image/png" />
            </label>
            <label className="field-label">Data de emissão
              <input type="date" name="issuedOn" max={todayInSantaMaria()} />
            </label>
            <p className="form-hint">Se anexar a foto, informe a data de emissão. A validade é de um ano.</p>
          </> : <>
            <label className="field-label">E-mail acadêmico da UFSM
              <input name="email" type="email" required placeholder="nome@acad.ufsm.br" />
            </label>
            <label className="field-label">Senha inicial (mínimo de 12 caracteres)
              <input name="password" type="password" required minLength={12} autoComplete="new-password" />
            </label>
          </>}
          {error && <p role="alert">{error}</p>}
          <button className="primary-button button-large" type="submit" disabled={saving}>
            {saving ? 'Cadastrando...' : title}
          </button>
        </form>
      </aside>
    </>
  );
}

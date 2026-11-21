import { FormEvent, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Eye, EyeOff, HeartPulse, LockKeyhole, Phone, ShieldCheck, UserRound } from 'lucide-react';

import CertificateFields from '@/components/CertificateFields';
import StudentRegistrationFields from '@/components/StudentRegistrationFields';

export type AuthRole = 'student' | 'admin';

interface AuthScreenProps {
  onLogin: (role: AuthRole, identifier: string, password: string) => Promise<void>;
  onSignup: (values: FormData) => Promise<void>;
  isLoading: boolean;
  error: string;
  notice: string;
}

export default function AuthScreen({ onLogin, onSignup, isLoading, error, notice }: AuthScreenProps) {
  const [role, setRole] = useState<AuthRole>('student');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(role, identifier, password);
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSignup(new FormData(event.currentTarget));
  };

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="brand-lockup">
          <div className="logo-frame logo-frame-large"><img src="/image.png" alt="Logo GPATF" /></div>
          <div>
            <p className="eyebrow eyebrow-light">Academia GPATF</p>
            <h1>Movimento que cuida.</h1>
          </div>
        </div>
        <p className="hero-copy">Treinos com acolhimento, segurança e acompanhamento para uma vida mais ativa aos 60+.</p>
        <div className="hero-points">
          <div><CheckCircle2 size={20} /><span>Agenda de treinos sempre à mão</span></div>
          <div><HeartPulse size={20} /><span>Cuidado pensado para cada pessoa</span></div>
          <div><ShieldCheck size={20} /><span>Informações protegidas</span></div>
        </div>
        <div className="hero-footer"><CalendarDays size={16} /> <span>Grupo de Pesquisa Aplicada em Treinamento de Força</span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="mobile-brand"><div className="logo-frame"><img src="/image.png" alt="Logo GPATF" /></div><strong>GPATF 60+</strong></div>
          <div className="auth-heading">
            <p className="eyebrow">Acesso seguro</p>
            <h2>{mode === 'login' ? 'Que bom ter você aqui.' : 'Vamos criar sua ficha.'}</h2>
            <p>{mode === 'login' ? 'Entre para acompanhar seus treinos e sua rotina.' : 'Preencha seus dados para começar a cuidar do seu movimento.'}</p>
          </div>

          <div className="role-switch" aria-label="Tipo de acesso">
            <button className={role === 'student' ? 'active' : ''} type="button" onClick={() => { setRole('student'); setMode('login'); }}><UserRound size={17} /> Área do aluno</button>
            <button className={role === 'admin' ? 'active' : ''} type="button" onClick={() => { setRole('admin'); setMode('login'); }}><ShieldCheck size={17} /> Administração</button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {notice && <div className="alert alert-success">{notice}</div>}

          {mode === 'login' ? (
            <form className="form-stack" onSubmit={handleLogin}>
              <label className="field-label">{role === 'student' ? 'Telefone ou nome completo' : 'E-mail da equipe'}
                <div className="input-with-icon"><Phone size={19} /><input required type={role === 'admin' ? 'email' : 'text'} autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? '(00) 00000-0000 ou seu nome' : 'nome@acad.ufsm.br'} /></div>
              </label>
              <label className="field-label">Senha
                <div className="input-with-icon"><LockKeyhole size={19} /><input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" /><button className="input-action" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </label>
              <button className="primary-button button-large" type="submit" disabled={isLoading}>{isLoading ? 'Entrando...' : 'Entrar'} <ArrowRight size={19} /></button>
              {role === 'student' ? <button className="text-button" type="button" onClick={() => setMode('signup')}>Ainda não tenho cadastro <span>Fazer cadastro</span></button> : <p className="form-hint"><ShieldCheck size={15} /> Acesso exclusivo da equipe GPATF</p>}
            </form>
          ) : (
            <form className="form-stack signup-form" onSubmit={handleSignup}>
              <StudentRegistrationFields />
              <CertificateFields />
              <button className="primary-button button-large" type="submit" disabled={isLoading}>{isLoading ? 'Criando sua ficha...' : 'Concluir cadastro'} <ArrowRight size={19} /></button>
              <button className="text-button" type="button" onClick={() => setMode('login')}>Já tenho cadastro <span>Voltar para o acesso</span></button>
            </form>
          )}
        </div>
        <p className="auth-note">Ao continuar, seus dados serão usados apenas para acompanhar sua rotina na Academia GPATF.</p>
      </section>
    </main>
  );
}

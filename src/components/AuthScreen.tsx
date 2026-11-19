import { FormEvent, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Eye, EyeOff, HeartPulse, LockKeyhole, Phone, ShieldCheck, UserRound } from 'lucide-react';

export type AuthRole = 'student' | 'admin';

export interface SignupValues {
  fullName: string;
  birthDate: string;
  address: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  comorbidities: string;
  password: string;
  avatar: File | null;
}

interface AuthScreenProps {
  onLogin: (role: AuthRole, identifier: string, password: string) => Promise<void>;
  onSignup: (values: SignupValues) => Promise<void>;
  isLoading: boolean;
  error: string;
  notice: string;
}

const emptySignup: SignupValues = {
  fullName: '',
  birthDate: '',
  address: '',
  phone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  comorbidities: '',
  password: '',
  avatar: null,
};

export default function AuthScreen({ onLogin, onSignup, isLoading, error, notice }: AuthScreenProps) {
  const [role, setRole] = useState<AuthRole>('student');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signup, setSignup] = useState<SignupValues>(emptySignup);

  const updateSignup = (field: keyof SignupValues, value: string | File | null) => {
    setSignup((current) => ({ ...current, [field]: value }));
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(role, identifier, password);
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSignup(signup);
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
              <label className="field-label">{role === 'student' ? 'Telefone ou nome completo' : 'Nome de acesso'}
                <div className="input-with-icon"><Phone size={19} /><input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={role === 'student' ? '(00) 00000-0000 ou seu nome' : 'adm'} /></div>
              </label>
              <label className="field-label">Senha
                <div className="input-with-icon"><LockKeyhole size={19} /><input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Digite sua senha" /><button className="input-action" type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
              </label>
              <button className="primary-button button-large" type="submit" disabled={isLoading}>{isLoading ? 'Entrando...' : 'Entrar'} <ArrowRight size={19} /></button>
              {role === 'student' ? <button className="text-button" type="button" onClick={() => setMode('signup')}>Ainda não tenho cadastro <span>Fazer cadastro</span></button> : <p className="form-hint"><ShieldCheck size={15} /> Acesso exclusivo da equipe GPATF</p>}
            </form>
          ) : (
            <form className="form-stack signup-form" onSubmit={handleSignup}>
              <div className="form-section-label"><span>01</span><div><strong>Seus dados</strong><small>Como podemos chamar você?</small></div></div>
              <div className="two-columns">
                <label className="field-label field-wide">Nome completo<input required value={signup.fullName} onChange={(event) => updateSignup('fullName', event.target.value)} placeholder="Ex.: Maria da Silva" /></label>
                <label className="field-label">Data de nascimento<input required type="date" value={signup.birthDate} onChange={(event) => updateSignup('birthDate', event.target.value)} /></label>
              </div>
              <label className="field-label">Endereço<input required value={signup.address} onChange={(event) => updateSignup('address', event.target.value)} placeholder="Rua, número e bairro" /></label>
              <div className="two-columns">
                <label className="field-label">Telefone <span className="optional-label">(opcional)</span><input value={signup.phone} onChange={(event) => updateSignup('phone', event.target.value)} placeholder="(00) 00000-0000" /></label>
                <label className="field-label">Senha de acesso<input required minLength={6} type={showPassword ? 'text' : 'password'} value={signup.password} onChange={(event) => updateSignup('password', event.target.value)} placeholder="Mínimo de 6 caracteres" /></label>
              </div>
              <div className="form-section-label"><span>02</span><div><strong>Contato de emergência</strong><small>Para cuidarmos melhor de você</small></div></div>
              <div className="two-columns">
                <label className="field-label">Nome do contato<input required value={signup.emergencyContactName} onChange={(event) => updateSignup('emergencyContactName', event.target.value)} placeholder="Nome completo" /></label>
                <label className="field-label">Telefone do contato<input required value={signup.emergencyContactPhone} onChange={(event) => updateSignup('emergencyContactPhone', event.target.value)} placeholder="(00) 00000-0000" /></label>
              </div>
              <div className="form-section-label"><span>03</span><div><strong>Saúde e perfil</strong><small>Conte o que a equipe precisa saber</small></div></div>
              <label className="field-label">Comorbidades ou cuidados importantes<textarea rows={3} value={signup.comorbidities} onChange={(event) => updateSignup('comorbidities', event.target.value)} placeholder="Ex.: pressão alta, dores no joelho..." /></label>
              <label className="upload-box"><div className="upload-icon"><UserRound size={20} /></div><div><strong>{signup.avatar ? signup.avatar.name : 'Adicionar foto de perfil'}</strong><small>Opcional · JPG ou PNG</small></div><input type="file" accept="image/png,image/jpeg" onChange={(event) => updateSignup('avatar', event.target.files?.[0] ?? null)} /></label>
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

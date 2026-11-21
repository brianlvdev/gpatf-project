import { UserRound } from 'lucide-react';

export default function StudentRegistrationFields() {
  return (
    <>
    <div className="form-section-label"><span>01</span><div><strong>Seus dados</strong><small>Como podemos chamar você?</small></div></div>
    <div className="two-columns">
      <label className="field-label field-wide">Nome completo<input required name="fullName" placeholder="Ex.: Maria da Silva" /></label>
      <label className="field-label">Data de nascimento<input required type="date" name="birthDate" /></label>
    </div>
    <label className="field-label">Endereço<input required name="address" placeholder="Rua, número e bairro" /></label>
    <div className="two-columns">
      <label className="field-label">Telefone <span className="optional-label">(opcional)</span><input name="phone" placeholder="(00) 00000-0000" /></label>
      <label className="field-label">Senha de acesso<input required minLength={6} type="password" autoComplete="new-password" name="password" placeholder="Mínimo de 6 caracteres" /></label>
    </div>
    <div className="form-section-label"><span>02</span><div><strong>Contato de emergência</strong><small>Para cuidarmos melhor de você</small></div></div>
    <div className="two-columns">
      <label className="field-label">Nome do contato<input required name="emergencyContactName" placeholder="Nome completo" /></label>
      <label className="field-label">Telefone do contato<input required name="emergencyContactPhone" placeholder="(00) 00000-0000" /></label>
    </div>
    <div className="form-section-label"><span>03</span><div><strong>Saúde e perfil</strong><small>Conte o que a equipe precisa saber</small></div></div>
    <label className="field-label">Comorbidades ou cuidados importantes<textarea rows={3} name="comorbidities" placeholder="Ex.: pressão alta, dores no joelho..." /></label>
    <label className="upload-box"><div className="upload-icon"><UserRound size={20} /></div><div><strong>Adicionar foto de perfil</strong><small>Opcional · JPG ou PNG</small></div><input type="file" accept="image/png,image/jpeg" name="avatar" /></label>
    </>
  );
}

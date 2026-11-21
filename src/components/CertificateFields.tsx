import { todayInSantaMaria } from '@/lib/registration';

export default function CertificateFields({ required = false }: { required?: boolean }) {
  return (
    <fieldset className="certificate-fields">
      <legend>Atestado de aptidão física{required ? '' : ' (opcional)'}</legend>
      <label className="field-label">Foto do atestado (JPG ou PNG, até 5 MB)
        <input type="file" name="certificate" accept="image/jpeg,image/png" required={required} />
      </label>
      <label className="field-label">Data de emissão
        <input type="date" name="issuedOn" max={todayInSantaMaria()} required={required} />
      </label>
      <p className="form-hint">Ao anexar a foto, informe a data de emissão. A validade é de um ano.</p>
    </fieldset>
  );
}

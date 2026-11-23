import { todayInSantaMaria } from '@/lib/registration';

export default function CertificateFields({ required = false }: { required?: boolean }) {
  return (
    <fieldset className="certificate-fields">
      <legend>Atestado de aptidão física{required ? '' : ' (opcional)'}</legend>
      <label className="field-label">Foto do atestado (JPG ou PNG, até 5 MB)
        <input type="file" name="certificate" accept="image/jpeg,image/png" required={required} />
      </label>
      <label className="field-label">Data de emissão (opcional)
        <input type="date" name="issuedOn" max={todayInSantaMaria()} />
      </label>
      <p className="form-hint">Se informar a emissão, a validade será calculada em um ano. Sem data, a validade ficará não informada.</p>
    </fieldset>
  );
}

import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const url = Deno.env.get('SUPABASE_URL')!;
const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const maxImageBytes = 5 * 1024 * 1024;
const avatarBucket = 'gpatf-files';
const certificateBucket = 'gpatf-certificates';

function reply(status: number, message?: string) {
  return Response.json(message ? { message } : { ok: true }, { status, headers });
}

function readDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function todayInSantaMaria() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

async function readImage(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.size) return null;
  if (value.size > maxImageBytes) throw new Error('image');
  const bytes = new Uint8Array(await value.slice(0, 8).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!png && !jpeg) throw new Error('image');
  return { file: value, extension: png ? 'png' : 'jpg', type: png ? 'image/png' : 'image/jpeg' };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers });
  if (request.method !== 'POST') return reply(405, 'Método inválido.');
  if (Number(request.headers.get('content-length')) > 2 * maxImageBytes + 65536) {
    return reply(413, 'Cada foto pode ter até 5 MB.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, 'Confira os dados do cadastro.');
  }
  const field = (name: string) => String(form.get(name) ?? '').trim();
  const action = field('action');
  if (!['self', 'student', 'collaborator'].includes(action)) return reply(400, 'Cadastro inválido.');

  if (action !== 'self') {
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return reply(401, 'Entre novamente para continuar.');
    const { data, error } = await service.auth.getUser(token);
    if (error || !data.user) return reply(401, 'Entre novamente para continuar.');
    const role = data.user.app_metadata.gpatf_role;
    if (role !== 'master' && (role !== 'admin' || action === 'collaborator')) {
      return reply(403, 'Sua conta não tem permissão para este cadastro.');
    }
  }

  const password = String(form.get('password') ?? '');
  if (password.length < (action === 'collaborator' ? 12 : 6) ||
      new TextEncoder().encode(password).length > 72) {
    return reply(400, 'Confira o tamanho da senha.');
  }
  if (action === 'collaborator') {
    const email = field('email').toLowerCase();
    if (!/^[^\s@]+@acad\.ufsm\.br$/.test(email) || email.length > 254) {
      return reply(400, 'Use o e-mail acadêmico da UFSM (@acad.ufsm.br).');
    }
    const { error } = await service.auth.admin.createUser({
      email, password, email_confirm: true, app_metadata: { gpatf_role: 'admin' },
    });
    return error ? accountError(error) : reply(201);
  }

  const fullName = field('fullName');
  const phone = field('phone');
  const digits = phone.replace(/\D/g, '');
  const birthDate = field('birthDate');
  const address = field('address');
  const emergencyName = field('emergencyContactName');
  const emergencyPhone = field('emergencyContactPhone');
  const comorbidities = field('comorbidities');
  const nameId = fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  if (!fullName || !address || !emergencyName || !emergencyPhone ||
      !readDate(birthDate) || birthDate > todayInSantaMaria() ||
      (phone ? !/^\d{8,15}$/.test(digits) : !nameId || nameId.length > 64) ||
      [fullName, address, emergencyName, emergencyPhone, comorbidities].some(value => value.length > 2000)) {
    return reply(400, 'Confira o nome, as datas, os telefones e os campos obrigatórios.');
  }

  const issuedOn = action === 'student' ? field('issuedOn') : '';
  let avatar: Awaited<ReturnType<typeof readImage>>;
  let certificate: Awaited<ReturnType<typeof readImage>>;
  try {
    avatar = await readImage(form.get('avatar'));
    certificate = action === 'student' ? await readImage(form.get('certificate')) : null;
  } catch {
    return reply(400, 'Envie fotos JPG ou PNG com até 5 MB cada.');
  }
  if (Boolean(certificate) !== Boolean(issuedOn) ||
      (issuedOn && (!readDate(issuedOn) || issuedOn > todayInSantaMaria()))) {
    return reply(400, 'Anexe a foto do atestado e informe uma data de emissão válida.');
  }

  const email = `${digits || nameId}@gpatf.local`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return accountError(error);
  if (!data.user) return reply(500, 'Não foi possível criar a conta.');
  const authId = data.user.id;
  const avatarPath = avatar ? `avatars/${authId}/profile.${avatar.extension}` : null;
  const certificatePath = certificate ? `${authId}/atestado.${certificate.extension}` : null;

  try {
    if (avatar && avatarPath) {
      const result = await service.storage.from(avatarBucket).upload(avatarPath, avatar.file, { contentType: avatar.type });
      if (result.error) throw result.error;
    }
    if (certificate && certificatePath) {
      const result = await service.storage.from(certificateBucket).upload(certificatePath, certificate.file, { contentType: certificate.type });
      if (result.error) throw result.error;
    }
    const { error: profileError } = await service.from('students').insert({
      auth_id: authId,
      full_name: fullName,
      birth_date: birthDate,
      address,
      phone: phone || null,
      emergency_contact_name: emergencyName,
      emergency_contact_phone: emergencyPhone,
      comorbidities,
      avatar_path: avatarPath,
      medical_certificate_path: certificatePath,
      medical_certificate_issued_on: issuedOn || null,
    });
    if (profileError) throw profileError;
    return reply(201);
  } catch {
    // If the insert completed despite a transport error, keep the complete registration.
    const profile = await service.from('students').select('id').eq('auth_id', authId).maybeSingle();
    if (!profile.error && profile.data) return reply(201);
    if (profile.error) {
      console.error('Could not verify student registration before cleanup', authId);
      return reply(500, 'Não foi possível confirmar o cadastro. Procure a equipe GPATF.');
    }
    const cleanup = await Promise.allSettled([
      avatarPath && service.storage.from(avatarBucket).remove([avatarPath]),
      certificatePath && service.storage.from(certificateBucket).remove([certificatePath]),
    ]);
    const deletion = await service.auth.admin.deleteUser(authId);
    if (deletion.error || cleanup.some(result => result.status === 'rejected' || (result.value && result.value.error))) {
      console.error('Incomplete student registration cleanup', authId);
    }
    return reply(500, 'Não foi possível concluir o cadastro. Tente novamente ou procure a equipe GPATF.');
  }
});

function accountError(error: { code?: string }) {
  if (error.code === 'email_exists' || error.code === 'user_already_exists') {
    return reply(409, 'Já existe uma conta com esses dados. Procure a equipe GPATF se precisar de ajuda.');
  }
  if (error.code === 'weak_password') return reply(400, 'Escolha uma senha mais forte.');
  console.error('Auth account creation failed', error.code);
  return reply(500, 'Não foi possível criar a conta. Procure a equipe GPATF.');
}

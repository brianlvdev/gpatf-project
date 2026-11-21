# Cadastro e acesso da equipe GPATF

## O que causava a falha

O site registrava a conta com `signUp` e exigia uma sessão imediata para gravar a ficha. Quando a confirmação de e-mail estava ativa, o Supabase podia criar o usuário sem devolver a sessão. Os endereços internos `@gpatf.local` também não recebem e-mail. Se a gravação da ficha falhasse, a conta já criada podia bloquear a próxima tentativa.

O cadastro passa pela função `register-account`. Ela confirma os endereços internos pelo servidor, vincula a conta à ficha e tenta remover a conta e as fotos se a criação da ficha falhar. O login dos alunos continua usando o telefone ou, para cadastros sem telefone, o nome completo.

## Ativação no projeto GPATF

Ao usar um projeto Supabase novo, aplique as migrações na ordem do repositório. Esse banco começa vazio. Contas, fichas e arquivos do Bolt precisam de exportação e importação próprias caso existam dados a preservar. Configure as variáveis do frontend primeiro em uma prévia de publicação e teste antes de trocar o ambiente em uso.

1. Vincule o CLI ao **projeto GPATF** e aplique as migrações com `supabase db push`. A nova migração substitui as permissões ligadas ao endereço administrativo antigo e cria o armazenamento privado dos atestados.
2. Publique a função com `supabase functions deploy register-account --no-verify-jwt`. O cadastro público usa a mesma função e as operações da equipe verificam o token e o papel diretamente no servidor. As chaves privadas ficam nas variáveis de ambiente da função.
3. Em **Authentication → Users**, crie a conta master com um e-mail válido, senha própria e **Auto Confirm User**. No SQL Editor, substitua o UUID abaixo pelo ID dessa conta e confira se uma linha foi retornada. Crie apenas um master. Para mudar a pessoa responsável, remova o papel da conta anterior e revogue as sessões dela.

   ```sql
   UPDATE auth.users
   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
       || '{"gpatf_role":"master"}'::jsonb
   WHERE id = '<UUID da conta master confirmada>'::uuid
     AND email_confirmed_at IS NOT NULL
   RETURNING id, email;
   ```

4. Desative a conta administrativa legada, caso exista, e revogue as sessões dela. As credenciais antigas apareceram no código e permanecem no histórico do Git. Se a senha foi usada em outro lugar, troque-a também nesse serviço.
5. Publique o frontend com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do GPATF. Entre na opção **Administração** com o e-mail e a senha da conta master. Pelo menu **Cadastrar colaborador**, crie administradores com endereço `@acad.ufsm.br` e senha inicial. A validação do domínio confere o formato do endereço.
6. Teste com dados fictícios no ambiente de homologação. Faça um cadastro público, crie um aluno pelo painel e anexe um atestado emitido em 19/11/2026. Confirme que o perfil mostra 19/11/2027 e que a imagem só abre pela equipe. Confira também que a sessão administrativa continua ativa após criar o aluno e que um administrador comum não pode criar outro colaborador.

## Pontos encontrados para acompanhamento

- O cadastro antigo pode ter deixado contas sem ficha. Antes de remover um usuário legado sem vínculo em `students.auth_id`, confirme o endereço e a identidade com a equipe e confira que ele não é uma conta administrativa. Depois, refaça o cadastro. Em caso de erro durante uma limpeza automática, o log da função contém o ID interno para investigação.
- O login sem telefone usa o nome normalizado. Homônimos precisam usar identificadores distintos, por exemplo o telefone. Alterar o telefone ou nome na ficha administrativa atualmente não altera a credencial de login já emitida. Use para entrar o identificador informado no cadastro.
- Alunos podem enviar a foto e indicar a data de emissão no cadastro ou pela opção Minha ficha depois de entrar. A edição de telefone ou nome atualiza os dados de contato, e o identificador de login continua sendo o informado no cadastro. A equipe pode conferir a imagem pela ficha e anexar ou substituir o atestado de um aluno existente. A data enviada no autocadastro é informada pelo aluno e deve ser conferida pela equipe.
- O cadastro público continua aberto. Antes de uso em escala, configure proteção contra abuso para a função pública e monitore o volume de cadastros. O formulário ainda não tem recuperação de senha para os identificadores internos.
- Bloquear um aluno impede sua entrada pelo frontend. As permissões legadas de acesso a dados do próprio aluno precisam ser revisadas para também revogar o acesso de sessões já ativas no momento do bloqueio.

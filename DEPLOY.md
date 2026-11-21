# Publicação GPATF

Frontend: https://gpatf-ufsm.wiryravioli9.chatgpt.site
Backend: projeto Supabase GPATF (`wgjteeursuxmbjymzzaa`), organização no plano Free.

O endereço acima é um subdomínio da hospedagem existente. Não foi comprado domínio nem ativado plano pago. O domínio personalizado do Supabase é um adicional pago da API, não hospedagem deste frontend React.

## Build reproduzível

1. Copie `.env.example` para `.env.local` e informe a chave publicável do projeto. Nunca coloque a chave `service_role` em variáveis `VITE_`.
2. Execute `npm ci`, `npm run typecheck` e `npm run build`.
3. Publique a pasta `dist` em uma hospedagem estática. O backend continua no Supabase.

O Sites usa `.openai/hosting.json`, preservando o projeto existente. As variáveis `VITE_` são incorporadas durante o build; alterações exigem novo build e deploy.

## Revisão em 21/11/2026

- Botão Sair no rodapé dos menus de aluno e administração, com rolagem em telas baixas.
- Falhas no carregamento agora aparecem na interface, com opção de tentar novamente ou sair; falhas no logout são tratadas.
- Datas de referência usam o fuso de Santa Maria; treino concluído não aparece como próximo treino.
- Migração `enforce_active_student_access` aplicada: contas bloqueadas/inativas não acessam os dados e arquivos por novas requisições; justificativas começam pendentes; confirmações precisam corresponder à aula do aluno.
- Testes SQL executados em transação com ROLLBACK: isolamento entre alunos, confirmação válida, rejeição de data incorreta, rejeição de autoaprovação, bloqueio e reativação administrativa. Nenhum dado de teste foi preservado.
- TypeScript e build passaram; `npm audit` terminou com zero vulnerabilidades reportadas.

## Limites e acompanhamento

- A prévia local não pôde ser aberta pelo navegador da sessão. A posição visual e o fluxo completo autenticado precisam de conferência com uma conta real.
- O cadastro público da Edge Function ainda precisa de proteção contra abuso antes de divulgação ampla. Não há recuperação automática para os identificadores internos `@gpatf.local`.
- O Supabase mantém o aviso de proteção contra senhas vazadas desativada. Nenhum recurso pago foi ativado.
- O aviso de `SECURITY DEFINER` em `set_student_status` é intencional: a função restringe a operação a admin/master e é necessária porque alunos não têm permissão de escrever a coluna status. A negativa para aluno comum foi testada.
- Links de arquivos já assinados podem continuar válidos até a expiração; o bloqueio impede novas consultas/assinaturas. Dados já baixados não são revogados.
- Nome/telefone editados na ficha não alteram o identificador original de login.
- Esta revisão não equivale a uma auditoria exaustiva de segurança.

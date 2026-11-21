# Colaboradores, fichas e anúncios

## Funcionalidades

- Menu Colaboradores lista as contas admin/master existentes e os novos colaboradores. O cadastro agora solicita nome completo. Em contas antigas sem nome registrado, aparece o identificador do e-mail.
- Adicionar colaborador fica na parte inferior do menu lateral, em azul, disponível para a conta master conforme a permissão existente.
- Fichas de treino separa alunos com e sem programa. Cada ficha contém exercícios, grupo muscular, séries, repetições/tempo, carga, descanso e orientações. A lista pesquisa sem Enter e ignora acentos. O catálogo inicial contém mais de 70 exercícios e pode ser ampliado em src/lib/exercises.ts.
- Qualquer colaborador pode editar a ficha de qualquer aluno. O banco registra automaticamente o criador e o último editor. O aluno vê o programa na visão geral.
- O cartão do aluno mostra autoria e situação/data de validade do atestado. Essa situação indica a existência e validade do arquivo, sem substituir a avaliação de aptidão pela equipe.
- Anúncios e avisos permite texto, upload de imagem JPG/PNG/WebP até 5 MB e link HTTPS. Os anúncios ativos aparecem no carrossel dos painéis. Há pausa, navegação e respeito à preferência de movimento reduzido.
- Removido o cartão 60+ movimento e saúde. Os dois indicadores restantes foram centralizados.

## Backend

Aplicados ao Supabase GPATF: tabelas collaborators e student_workout_plans, gatilhos de sincronização de colaboradores e autoria, políticas RLS e bucket público gpatf-announcements. Apenas imagens destinadas à publicação são armazenadas nesse bucket; atestados continuam no bucket privado existente.

Atualizada a função register-account para guardar o nome do colaborador nos metadados gerenciados pelo servidor. Cadastros antigos continuam compatíveis.

## Verificação

TypeScript e build concluídos. Teste SQL em transação com ROLLBACK verificou criação da ficha por colaborador, autoria imposta pelo banco, leitura da própria ficha pelo aluno, negativa de edição e de leitura da lista de colaboradores para aluno, e bloqueio de acesso à ficha após inativação. Dados temporários não foram preservados.

Ainda falta conferir visualmente os painéis autenticados em desktop e celular com contas de teste e confirmar a publicação na Vercel. A existência do PR não significa que a atualização já está no endereço de produção.

# Notificações por assunto e verificação do PR #6 publicado

## Verificação no endereço de produção

- Sessão administrativa existente, após recarregar para a versão publicada do PR #6.
- Loading apareceu antes da aba Mensagens em tela de computador e celular. Em computador, `aria-busy=true`/indicador presente durante a troca, conteúdo disponível em cerca de 553 ms no teste e CSS de entrada de 0,48 s. A medida inclui a latência da automação e não é uma medição de fluidez por quadros.
- Aba Mensagens carregou o histórico, filtrou por nome e enviou uma mensagem claramente identificada como teste em tela de celular.
- Aviso temporário apareceu antes do título da visão geral; anúncio temporário apareceu no carrossel compacto mais abaixo, que alternou automaticamente com o anúncio existente.
- Os dois conteúdos temporários foram removidos logicamente e essa remoção foi confirmada no banco. O anúncio original foi preservado. A mensagem de teste permaneceu no histórico.
- Problemas encontrados: largura excessiva de alguns cartões/conversas no celular; publicações removidas ainda apareciam na lista administrativa (apesar de ocultas na visão geral).

## Correções e nova solicitação

- Novo dropdown no sino de ambos os perfis, agrupando eventos recentes por assunto: Mensagens, Avisos, Anúncios, Agenda, Fichas, Presença, Justificativas, Cadastros (equipe) e alertas de atestados quando pertinentes.
- Leitura persistida por usuário com RLS. Clicar leva à página pertinente; mensagens também atualizam a leitura do atendimento. Existe Marcar todas como lidas.
- Consulta a cada 30 s, com limites de eventos recentes por fonte. Não é um log de auditoria completo de todas as operações históricas. Cada perfil recebe os dados permitidos pelas políticas existentes.
- Ícone de chat para Mensagens/contato e sino para Anúncios e avisos.
- Ajustes de largura para cartões, resumos, conversas e ações no celular.
- Consulta administrativa também exclui publicações removidas.

## Validação desta branch

TypeScript/build passaram. Oito testes automatizados cobrem filtros, comunicações e composição das notificações por perfil. SQL em transação com rollback confirmou leitura do próprio registro, isolamento entre contas e rejeição de leitura gravada em nome de outro usuário. Advisors não reportaram novos avisos.

Ainda falta conferência visual autenticada do novo dropdown e das correções de largura na prévia/publicação. Os testes publicados acima se referem ao PR #6, não a esta branch.

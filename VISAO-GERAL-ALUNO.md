# Visão geral simplificada e solicitação de treino

- Treinos na agenda virou um botão que abre Minha agenda.
- Removida a seção redundante Acompanhe de perto no fim da visão geral.
- O programa completo saiu da visão geral. Quando existe ficha, aparece Ver minha ficha de treino, que leva à agenda.
- Minha agenda mostra primeiro a ficha do personal e depois os horários, em áreas separadas. Exercícios mantêm a ordem prescrita, com grupo muscular, máquina, séries, repetições/tempo, carga, descanso, orientações e autoria.
- Sem ficha, aparece explicação e Solicitar minha ficha de treino. Depois do envio, a solicitação fica registrada com data e o botão fica indisponível, inclusive após recarregar ou entrar por outro aparelho.
- Pedidos aparecem destacados primeiro na lista de alunos sem ficha para a equipe e no tópico Fichas de treino do sino. Ao existir um programa, o pedido deixa de aparecer como pendente, mas o registro permanece para impedir outra solicitação.

Backend: tabela workout_plan_requests com uma linha por aluno, RLS de leitura própria/equipe e inserção limitada à própria ficha ativa sem programa. Clientes não podem atualizar nem apagar o pedido. Migração já aplicada ao Supabase GPATF.

Teste SQL com rollback confirmou criação do próprio pedido, rejeição de duplicidade, negativa de pedir por outro aluno/apagar o pedido, isolamento entre alunos, visibilidade para a equipe e negativa de solicitação quando já existe ficha. Dados temporários não foram mantidos. Teste automatizado verifica notificação do pedido e sua saída dos pendentes quando o programa existe.

Verificação visual autenticada desta nova versão ainda pendente. A abertura de PR não publica a alteração no frontend.

# Ajustes de interface e atendimento

- Foto e nome no cabeçalho do aluno abrem o perfil. Na lista administrativa, nome, avatar e botão abrem a ficha.
- Cadastro, ficha, treino e atendimento usam janelas centrais com fundo desfocado, rolagem interna, foco contido e fechamento por Escape. Menu lateral de navegação continua como navegação.
- Data de emissão do atestado opcional no frontend, Edge Function e banco. Foto sem data fica com validade não informada, sem inventar uma data.
- Confirmação de presença pode ser removida pelo próprio aluno. Falhas aparecem na interface; ações simultâneas são evitadas.
- Ajuda e sino abrem atendimento. A equipe acessa todas as conversas; aluno acessa a própria. Nome, função e data são definidos pelo banco. Leituras são individuais por conta, e o sino consulta novas mensagens a cada 15 segundos. A equipe pode pesquisar o aluno e responder.
- Indicador de programa sem ficha ganhou estilo e texto secundário mais suave.
- Agenda possui busca e separação visual por dia. Busca também no agendamento, presença, resumos e atendimento, além das pesquisas existentes na lista e fichas.

Backend aplicado: migração support_and_optional_certificate e register-account versão 5. TypeScript e build passaram. Teste SQL com rollback verificou certificado sem data, autoria não falsificável, envio, resposta e isolamento dos registros de leitura. Nenhuma conversa de teste foi mantida.

Pendente: teste visual autenticado em desktop/celular e confirmação dos fluxos de atendimento com contas de teste. Alterações de frontend aguardam merge/publicação, não estão automaticamente em produção pela existência desta branch.

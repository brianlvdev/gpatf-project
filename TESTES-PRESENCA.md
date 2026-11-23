# Controle de presença e verificação publicada

O novo controle lista todos os cadastrados sem filtro (inclusive sem agenda), com pesquisa sem acentos, confirmação pelo aluno independente da chamada, páginas de 15 alunos, contadores e ações de registro. Testes com 42 alunos passaram para lista completa, filtros complementares e busca por nome/telefone. TypeScript e build passaram.

Na versão publicada do PR #4, foram abertas as janelas de cadastro de aluno, colaborador, perfil, treino e chat em tamanhos de computador e celular. A geometria DOM confirmou centro da janela alinhado ao centro da área visível, conteúdo dentro dos limites e backdrop-filter blur(6px) nos dez casos. Não foram salvas alterações nas fichas.

Mensagem identificada como [Teste GPATF] enviada pela equipe ao aluno de teste e persistida no histórico com autor e data. Essa mensagem não foi apagada. Verificação do lado do aluno e do ciclo completo de notificação ainda depende do login dele.

Falha encontrada: CSS anterior escondia o sino do cabeçalho em telas menores. Corrigida nesta branch. A correção ainda precisa ser publicada e conferida no endereço de produção.
`nConcluído com contas fornecidas pelo usuário: aluno recebeu a notificação da equipe, leu e respondeu; administração recebeu a resposta e o contador zerou após leitura. Confirmar/remover presença passou em computador e celular, restaurando a confirmação inicial (sem confirmação para o dia testado). Chat do aluno também centralizado com blur nos dois tamanhos. Incluídos número da máquina por exercício e Voltar à visão geral nas páginas internas; estes ajustes aguardam publicação.

# Project memory

## Product intent & audience

- Aplicação web com sistema de autenticação e painel administrativo.
- Público-alvo: administradores que gerenciam o sistema via painel dedicado.

## Brand personality & voice

- Comunicação em português (BR).
- Tom direto e funcional, com respostas objetivas.

## Visual design & UX direction

- Framework: Vite + React (JSX).
- Estilização com Tailwind CSS; ícones via `lucide-react`.
- Alias de importação `@/` mapeia para `src/`.
- Sem dependências adicionais de UI/themes além do que já existe, salvo necessidade justificada.

## Decisions, constraints & rationale

- Credenciais administrativas padrão: usuário `adm`, senha `adm123`.
- Sistema cria automaticamente o acesso administrativo na primeira entrada.
- Após criação inicial, as credenciais permanecem fixas para acesso ao painel.

## Open questions & assumptions

- Assume-se que as credenciais padrão não são alteradas pelo usuário após criação (não confirmado).
- Desconhece-se se há funcionalidade de troca de senha ou gestão de múltiplos usuários administradores.
- Não há detalhes sobre a estrutura completa do painel administrativo ou funcionalidades específicas beyond autenticação.
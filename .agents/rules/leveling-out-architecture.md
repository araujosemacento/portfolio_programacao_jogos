# Diretrizes de Arquitetura: Leveling Out & Projetos p5.js

## 1. Prioridade do Motor Visual (p5.js First)
- A lógica de renderização, visualizações dinâmicas, física/fluidos (tubo de ensaio), animações de feedback e inputs espaciais (slider analógico, botões de jogada) devem ser desenvolvidos diretamente no canvas do **p5.js**.
- O SvelteKit atua como casca de apoio (roteamento de slugs, inicialização de clientes, metadados e modais de código).

## 2. Compatibilidade com Hospedagem Estática (GitHub Pages)
- O front-end do projeto deve se manter 100% estático (`@sveltejs/adapter-static`).
- O suporte a salas dinâmicas deve utilizar slugs aninhados (`/projeto/[slug]/[sala]`) operando client-side via fallback da SPA (`404.html`), garantindo carregamento direto mesmo sem pré-renderização no build.

## 3. Backend em Tempo Real: PocketBase Autohospedado
- **Motor de Backend**: **PocketBase** (binário único em Go + SQLite embarcado), selecionado por seu consumo de memória ínfimo (~15-30 MB de RAM) e facilidade de manutenção.
- **Túnel e Exposição**: O servidor local é exposto para a internet através de um túnel reverso com terminação TLS (como **Tailscale Funnel** ou **Cloudflare Tunnel**), permitindo que conexões externas (incluindo 4G/5G com CGNAT) conectem-se via SSE (*Server-Sent Events*) e REST sem necessidade de abrir portas no roteador.
- **Efemeridade e Privacidade por Design**:
  - Usuários são estritamente **anônimos**, sem cadastro de contas, senhas ou persistência de identidade de longo prazo.
  - A persistência de dados é **efêmera**: existe apenas enquanto a sala e a partida estiverem em andamento para permitir reconexões de rede tolerantes via `sessionStorage`.
  - O banco SQLite deve contar com **rotinas automáticas de higienização** (`pb_hooks/cleanup.pb.js`) com agendamento (cron) para expirar e deletar salas inativas, garantindo uso zero de espaço desnecessário em disco.

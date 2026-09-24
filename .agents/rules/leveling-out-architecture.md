# Diretrizes de Arquitetura: Leveling Out & Projetos p5.js

## 1. Prioridade do Motor Visual (p5.js First)
- Sempre que viável, a lógica de renderização, visualizações dinâmicas, física/fluidos, animações de feedback e inputs espaciais (arrastar slider, botões do jogo) devem ser desenvolvidos diretamente no canvas do **p5.js**.
- O SvelteKit atua como casca de apoio (roteamento de páginas, metadados, modais de código e inicialização de rede).

## 2. Compatibilidade com Hospedagem Estática (GitHub Pages)
- O projeto deve se manter 100% estático (`@sveltejs/adapter-static`).
- Não assumir a presença de um servidor Node/Express backend próprio para endpoints de API dinâmicos ou servidores de socket dedicados.
- Rotas dinâmicas como salas e identificadores devem levar em conta o fallback do GitHub Pages (`404.html`) ou o uso de query/hash parameters.

## 3. Sincronização Multiplayer Serverless / Peer-to-Peer
- Para multiplayer em tempo real em páginas estáticas, priorizar:
  - **WebRTC DataChannels** (ex: PeerJS ou Trystero) para comunicação P2P direta entre navegadores sem custo de infraestrutura.
  - **BaaS Realtime** (ex: Supabase Realtime Broadcast ou Firebase Realtime) quando for necessária persistência de estado ou presença resiliente.

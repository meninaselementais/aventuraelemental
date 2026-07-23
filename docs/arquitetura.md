# 🧩 Arquitetura — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Three.js 0.178 | Vite 7 | Plataforma: Web (PWA)

---

## 1. Estrutura Completa das Pastas

```
quero-fazer-um-jogo-em-3d/
├── index.html                          # Entrypoint HTML (única página)
├── package.json                        # Dependências e scripts
├── package-lock.json                   # Lock de versões
├── vite.config.js                      # Servidor Vite + API de ranking
├── README.md                           # Instruções básicas
├── COMPARTILHAR-JOGO.cmd               # Script batch para compartilhar
├── compartilhar-jogo.mjs               # Script Node.js para túnel público
├── LINK-PUBLICO.txt                    # URL pública salva
│
├── data/
│   └── ranking.json                    # Persistência do ranking (JSON)
│
├── public/
│   ├── icon.svg                        # Ícone PWA
│   ├── manifest.webmanifest            # Manifesto PWA
│   ├── sw.js                           # Service Worker (cache offline)
│   └── assets/                         # Modelos 3D, texturas, animações
│       ├── sala-inicial.glb            # Sala da mina (nível 1)
│       ├── elemental-character.glb     # Fallback GLB da personagem
│       ├── elemental-walking.fbx       # Personagem FBX com animação base
│       ├── elemental-idle.json         # Animação parada (AnimationClip)
│       ├── elemental-slow-walking.json # Animação de passos lentos
│       ├── elemental-jumping.json      # Animação de pulo
│       ├── elemental-fast-run.json     # Animação de corrida
│       └── elemental.jpg               # Foto da personagem (guia Lia)
│
├── src/
│   ├── main.js                         # Engine do jogo (~1518 linhas)
│   ├── questions.js                    # Banco de perguntas (~232 linhas)
│   ├── notebook.js                     # Caderno interativo (~298 linhas)
│   └── style.css                       # Estilos da interface (~179 linhas)
│
├── mixamo-elemental-clean/             # Modelo limpo exportado do Mixamo
│   ├── elemental-clean.obj
│   ├── elemental-texture.png
│   ├── elemental-texture.webp
│   └── elemental.mtl
│
└── personagem-nova-preparada/          # Modelo alternativo da personagem
    ├── menina-fogo-pronta.glb
    └── accurig-colorido/
```

---

## 2. Função de Cada Arquivo

### Raiz

| Arquivo | Função |
|---|---|
| `index.html` | Única página do jogo. Contém todas as seções/modalidades como overlays (tela inicial, escolha de matéria, HUD, painel de perguntas, caderno, ranking, transição). Carrega `src/main.js` como módulo. |
| `package.json` | Define o projeto como módulo ES (`"type": "module"`). Dependências: `three@^0.178`. Dev: `vite@^7`. Scripts: `dev`, `build`, `preview`. |
| `vite.config.js` | Configura o Vite com plugin customizado que implementa uma API REST interna `/api/ranking` (GET/POST) usando o sistema de middlewares do Vite. Gerencia fila de escrita e ordenação do ranking. |
| `README.md` | Guia rápido de instalação, comandos e regras do jogo. |

### `src/`

| Arquivo | Linhas | Função |
|---|---|---|
| `main.js` | 1518 | Motor completo do jogo. Inicializa Three.js, gerencia cena 3D, constrói salas proceduralmente, controla personagem (movimento, animação, pulo), câmera第三人称, interação com portas/painéis, sistema de perguntas, HUD, ranking, som, controles desktop e mobile. |
| `questions.js` | 232 | Define as 5 matérias + modo MIX. Contém 125 perguntas (25 por matéria) em 5 níveis de dificuldade. Exporta `getQuestion()` e `normalizeAnswer()`. |
| `notebook.js` | 298 | Sistema de caderno com canvas HTML5. Suporte a lápis/caneta/borracha, múltiplas páginas (até 40), undo/redo, salvamento automático em localStorage por matéria. |
| `style.css` | 179 | Todos os estilos: overlays, modais, HUD, controles touch, caderno, ranking, animações. Design responsivo com media queries para mobile. |

### `public/`

| Arquivo | Função |
|---|---|
| `sw.js` | Service Worker para funcionalidade PWA offline. |
| `manifest.webmanifest` | Manifesto PWA com nome, ícone, cores e orientação. |
| `assets/` | Modelos 3D (.glb, .fbx), animações (.json AnimationClip) e texturas. |

### `data/`

| Arquivo | Função |
|---|---|
| `ranking.json` | Array JSON com entradas do ranking. Cada entrada: `{ name, subject, score, level, updatedAt }`. Lido/escrito pela API em `vite.config.js`. |

---

## 3. Fluxo de Execução do Jogo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INICIALIZAÇÃO                                │
│  restorePlayer() → init3D() → setupControls() → updateHUD()        │
│  init3D:  scene, camera, renderer, clock, buildRoom(), addLights(), │
│           updateCamera(), animate() (loop de renderização)          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       TELA INICIAL (#start-screen)                  │
│  Botão "Começar aventura" → started=true → #subject-screen abre    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   ESCOLHA DE MATÉRIA (#subject-screen)              │
│  1. Jogador digita nome (mín. 2 caracteres) → connectPlayer()      │
│  2. Salva em localStorage (PLAYER_STORAGE_KEY)                      │
│  3. Habilita botões de matéria                                     │
│  4. Click na matéria → startSubject(subject)                        │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         LOOP DE JOGO                                │
│  buildNextRoom() → buildRoom() → createDoor() → createElemental()  │
│       ↓                                                             │
│  Jogador explora sala (WASD/joystick)                              │
│       ↓                                                             │
│  Encontra painel → aperta E → openMath()                            │
│       ↓                                                             │
│  Responde pergunta → checkAnswer()                                  │
│       ↓                                                             │
│  ┌─ Acerto → unlockDoor() → enterDoor() → nextRoom()              │
│  │                                            ↓                     │
│  │                              roomInLevel++ ou level++            │
│  │                                            ↓                     │
│  │                              buildNextRoom() (nova sala)         │
│  │                                                                  │
│  └─ Erro (1-2) → tenta novamente                                   │
│     Erro (3)  → replaceDoor() (porta muda de lugar)                │
│                → problem=null (nova pergunta)                       │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                 CONCLUSÃO DE NÍVEL/MATÉRIA                          │
│  level >= 5 e roomInLevel > 5 → matéria concluída                  │
│  Mostra #level-modal → "Escolher outra matéria"                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Pontos Fracos da Arquitetura

### 🔴 Crítico

1. **Monolito `main.js` (1518 linhas)**
   - Tudo em um único arquivo: renderização 3D, física, UI, som, ranking, controles, animações
   - Dificulta manutenção, testes e onboarding de novos desenvolvedores
   - Qualquer alteração requer navegar por 1500+ linhas

2. **Acoplamento forte entre sistemas**
   - `updateMovement()` mistura input, física, animação de membros, verificação de distância da porta e UI (mostrar/esconder botão de interação)
   - `animate()` chama `updateMovement()` que faz 7 responsabilidades diferentes

3. **Sem gerenciamento de estado centralizado**
   - ~50 variáveis globais no escopo do módulo (`let started, subjectChosen, modalOpen...`)
   - Estado espalhado entre variáveis, DOM (classes CSS) e localStorage
   - Impossível serializar/restaurar estado do jogo (ex: salvar progresso e continuar depois)

4. **Ranking sem banco de dados**
   - `data/ranking.json` é um arquivo JSON em disco, sem concorrência real (fila mitiga, mas não escala)
   - Se o arquivo corromper, todos os dados são perdidos
   - Sem autenticação: nomes duplicados podem conflitar acidentalmente

### 🟡 Moderado

5. **Sistema de perguntas rígido**
   - Acesso por índice fixo: `MATH[level-1][index]` — não há randomização
   - Jogador sempre vê as mesmas 5 perguntas no mesmo nível, na mesma ordem
   - Sem suporte a variação (ex: mesmo conceito com números diferentes)

6. **Modelos 3D com fallback frágil**
   - 3 níveis de fallback (FBX → GLB → procedural) que raramente são testados
   - Caminhos hardcoded (`/assets/elemental-walking.fbx`)
   - Se todos falharem, `characterGroup` fica sem mesh (só grupos vazios de membros)

7. **Perguntas de matemática nível 1 improvisadas**
   - `mathChoices()` gera alternativas com offsets fixos (`[-2, 3, 5]`)
   - Pode gerar alternativas negativas ou duplicadas para números pequenos
   - Não revisadas por educadores

8. **Sistema de som minimalista**
   - Apenas beeps (osciladores Web Audio)
   - Sem música de fundo, sem efeitos ambientais
   - Sem controle de volume (apenas liga/desliga)

### 🟢 Menor

9. **CSS sem pré-processador**
   - 179 linhas de CSS puro, sem variáveis ou nesting
   - Cores hex repetidas sem constantes

10. **Sem testes automatizados**
    - Nenhum teste unitário ou de integração
    - `normalizeAnswer()` e `getQuestion()` são testáveis mas não têm cobertura

11. **Service Worker manual**
    - `sw.js` precisa ser mantido manualmente (sem Workbox)
    - Estratégia de cache não documentada

12. **Acessibilidade limitada**
    - Poucos atributos `aria-*` (apenas nos modais principais)
    - Foco não gerenciado em transições de tela
    - Sem suporte a leitores de tela para navegação 3D

13. **Perguntas de inglês sem áudio**
    - Sem pronúncia para as palavras em inglês (essencial para crianças de 8 anos)

---

## 5. Sugestões de Melhorias

### 🏗️ Arquiteturais

1. **Modularizar `main.js`**
   - Extrair sistemas para arquivos separados:
     - `src/engine/renderer.js` — init3D, animate, buildRoom
     - `src/engine/character.js` — createElemental, animações
     - `src/engine/movement.js` — input, física, colisão
     - `src/engine/camera.js` — updateCamera, controles de visão
     - `src/engine/doors.js` — createDoor, replaceDoor, unlockDoor
     - `src/ui/hud.js` — updateHUD, overlays
     - `src/ui/math-modal.js` — openMath, checkAnswer
     - `src/audio.js` — beep, playJumpSound, música
     - `src/ranking.js` — API client, cache
     - `src/state.js` — game state centralizado

2. **Implementar gerenciamento de estado**
   - Objeto `GameState` único com todos os estados
   - Métodos `saveState()` / `loadState()` para continuar progresso
   - Event emitter para notificar sistemas de mudanças

3. **Migrar ranking para armazenamento robusto**
   - SQLite (via better-sqlite3) para produção
   - Ou integração com Firebase/Supabase para multiplayer

### 🎮 Gameplay

4. **Randomização de perguntas**
   - Em vez de `MATH[level-1][index]`, usar pool com seleção aleatória sem repetição
   - Criar 8-10 perguntas por nível e sortear 5

5. **Sistema de conquistas**
   - "Respondeu 5 seguidas sem errar"
   - "Completou uma matéria"
   - "Usou o caderno em todas as matérias"

6. **Modo história**
   - Pequenas cutscenes entre níveis com a personagem Lia
   - Narrativa conectando as salas

7. **Áudio para inglês**
   - Usar Web Speech API (`SpeechSynthesis`) para pronunciar palavras
   - Ou pré-gravar arquivos de áudio

### 🎨 Visuais

8. **Mais variação de salas**
   - Novos formatos: corredor, arena, labirinto simples
   - Decoração temática mais rica (moveis, quadros, plantas)

9. **Efeitos de partículas**
   - Fumaça na mina, faíscas no fogo, bolhas na água
   - Partículas ao acertar/errar pergunta

10. **Iluminação dinâmica**
    - Luzes que reagem à resposta (verde ao acertar, vermelho ao errar)
    - Cycle dia/noite (opcional)

### 🔧 Técnicos

11. **Testes automatizados**
    - Unit tests para `normalizeAnswer()`, `getQuestion()`
    - Testes de integração para fluxo de jogo

12. **TypeScript**
    - Adicionar tipos gradualmente (interfaces para perguntas, estado)
    - Melhora autocompletar e previne erros

13. **Workbox para Service Worker**
    - Automatizar cache de assets
    - Estratégia Network First para API, Cache First para modelos 3D

14. **Acessibilidade**
    - Gerenciar foco entre telas
    - Anunciar transições com `aria-live`
    - Contraste mínimo garantido nas cores

### 📱 Mobile

15. **Otimização de performance**
    - LOD (Level of Detail) para objetos distantes
    - Frustum culling mais agressivo
    - Reduzir shadow map resolution em mobile

16. **Suporte a gamepad**
    - API Gamepad para controles físicos
    - Mapeamento: analógico esquerdo = movimento, direito = câmera

---

## 6. Glossário de Variáveis Principais (`main.js`)

| Variável | Tipo | Descrição |
|---|---|---|
| `scene` | `THREE.Scene` | Cena Three.js principal |
| `camera` | `THREE.PerspectiveCamera` | Câmera第三人称 |
| `renderer` | `THREE.WebGLRenderer` | Renderizador WebGL |
| `clock` | `THREE.Clock` | Relógio para delta time |
| `doorGroup` | `THREE.Group` | Grupo da porta atual |
| `doorPivot` | `THREE.Group` | Dobradiça da porta |
| `panelGroup` | `THREE.Group` | Grupo do painel de perguntas |
| `characterGroup` | `THREE.Group` | Grupo da personagem 3D |
| `player.position` | `THREE.Vector3` | Posição do jogador (x,y,z) |
| `yaw` / `pitch` | `number` | Ângulos da câmera |
| `velocity` | `THREE.Vector2` | Velocidade horizontal (x,z) |
| `started` | `boolean` | Jogo iniciado (passou da tela inicial) |
| `subjectChosen` | `boolean` | Matéria escolhida |
| `modalOpen` | `boolean` | Qualquer modal aberto |
| `changingRoom` | `boolean` | Em transição de sala |
| `roomNumber` | `number` | Número absoluto da sala |
| `level` | `number` | Nível atual (1-5) |
| `roomInLevel` | `number` | Sala dentro do nível (1-5) |
| `attempts` | `number` | Tentativas na pergunta atual (0-3) |
| `problem` | `object\|null` | Pergunta atual em cache |
| `currentSubject` | `string` | Matéria atual |
| `roomSpec` | `object` | Especificação da sala atual |

---

*Documentação gerada em 20/07/2026. Não contém alterações de código — análise pura da base existente.*
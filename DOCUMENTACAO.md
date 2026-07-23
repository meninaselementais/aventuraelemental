# 🧩 Documentação Técnica — Aventura das ELEMENTAIS

> Versão: ALPHA 1.21 | Three.js 0.178 | Vite 7 | Plataforma: Web (PWA)

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

## 4. Como Funciona Cada Sistema

### 4.1 Sistema de Renderização 3D (`init3D` / `animate`)

- **Motor**: Three.js via WebGL com `renderer.shadowMap.enabled = true` (PCFSoftShadowMap)
- **Cena**: `THREE.Scene` com `background` e `FogExp2` (névoa exponencial)
- **Câmera**: `PerspectiveCamera(70°, aspect, 0.1, 60)`, ordem de rotação `YXZ`
- **Pixel Ratio**: Limitado a 1.7 (ou 1.35 em mobile) para performance
- **Tone Mapping**: `ACESFilmicToneMapping` com exposição ajustável
- **Loop**: `requestAnimationFrame` com delta time capado em 50ms

### 4.2 Sistema de Salas (`buildRoom` / `createRoomSpec`)

**Especificação da sala** (`roomSpec`):
```js
{
  halfX: 12.5,      // metade da largura
  halfZ: 8,         // metade da profundidade
  height: 5.4,      // altura do teto
  shape: 'mine',    // 'square' | 'rectangle' | 'round' | 'small' | 'large' | 'mine'
  theme: THEMES[3], // tema visual (cores, luzes, detalhes)
  doorScale: 0.96   // escala da porta
}
```

**Formatos de sala**:
| Forma | Construção |
|---|---|
| `square` / `rectangle` | 6 BoxGeometry: piso, teto, 4 paredes |
| `round` | CylinderGeometry para piso/teto, 32 BoxGeometry rotacionadas em círculo para paredes |
| `small` / `large` | Idem square, variando halfX/halfZ/height |
| `mine` | Piso base discreto + carrega `sala-inicial.glb` assíncrono |

**Temas visuais** (5 temas):
| Tema | Cores | Detalhes |
|---|---|---|
| Corredores Dourados | Bege/dourado | Pilares |
| Templo do Fogo | Marrom/vermelho | Cones flamejantes + PointLights laranja |
| Câmara das Águas | Azul/ciano | Torus (anéis d'água) no chão |
| Mina de Carvão | Cinza escuro | Dodecaedros (pedras) + tochas 3D |
| Gruta de Cristal | Roxo/lavanda | Cones de cristal + brilho emissivo |

### 4.3 Sistema de Portas e Painéis (`createDoor` / `replaceDoor`)

**Porta** (`doorGroup`):
- Composta por: `doorPivot` (dobradiça) + `leaf` (folha da porta)
- Moldura (frameTop, frameL, frameR), detalhes metálicos (esferas, argola, coroa torus)
- Material físico: `MeshPhysicalMaterial` com clearcoat
- Posicionada em um dos 3 lados: norte (`side=0`), leste (`side=1`), oeste (`side=2`)
- Offset lateral pseudo-aleatório baseado no número da sala

**Painel** (`panelGroup`):
- Posicionado ao lado da porta (gap de ~1.55 unidades)
- Moldura, tela brilhante (emissive com accentColor), botões decorativos
- Luz pontual (`doorGlow`) pulsante com `sin(time * 0.003)`

**Troca de porta** (`replaceDoor`):
1. Animação de shrink (escala → 0 em 420ms)
2. Remove porta/painel antigos da cena
3. Sorteia novo `doorSide` (evita repetir)
4. Cria nova porta com animação de grow (escala 0 → target em 450ms)

### 4.4 Sistema de Perguntas (`questions.js` + `main.js`)

Ver [seção 5](#5-como-adicionar-uma-nova-matéria) e [seção 6](#6-como-adicionar-perguntas).

Fluxo detalhado na análise anterior da arquitetura de perguntas.

### 4.5 Sistema de Personagem (`createElemental` / animações)

**Carregamento em cascata**:
1. Tenta carregar FBX com animações (`elemental-walking.fbx`)
2. Em paralelo, carrega animações adicionais como AnimationClip JSON:
   - `elemental-slow-walking.json` → slowWalkingAction
   - `elemental-idle.json` → idleAction
   - `elemental-jumping.json` → jumpingAction
   - `elemental-fast-run.json` → runningAction
3. Se FBX falhar → fallback GLB (`elemental-character.glb`)
4. Se GLB falhar → `createProceduralElemental()` (boneco blocado)

**Preparação do modelo** (`prepareElementalModel`):
- Rotaciona 180° (o modelo vem de costas)
- Escala para altura de 2.15 unidades
- Centraliza no chão (bounding box)
- Habilita castShadow/receiveShadow

**Animações in-place** (`makeAnimationInPlace`):
- Remove translação dos quadris (hips) para animações tocarem sem deslocamento
- Permite que o código controle a posição separadamente

**Blending de animações**:
- 5 ações com pesos interpolados: `walkBlend`, `slowWalkBlend`, `runBlend`, `idleBlend`, `jumpBlend`
- Transição suave com `blendSpeed = 1 - exp(-10 * dt)`
- TimeScale ajustado por velocidade para sincronizar passos com movimento

### 4.6 Sistema de Movimentação (`updateMovement`)

**Input**:
- **Desktop**: teclas WASD / setas + Shift (correr) / Ctrl (passos lentos)
- **Mobile**: joystick virtual + botões (Passinhos, Correr, Pular)
- **Prevenção de tecla travada**: se uma tecla de movimento ficar presa >900ms sem evento novo, é resetada

**Física**:
- Velocidade com inércia: `velocity += (target - velocity) * smooth`
- `smooth = 1 - exp(-responsiveness * dt)` onde `responsiveness = 9` (movendo) ou `6` (parado)
- Velocidades: normal 3.05, lento 1.45, rápido 5.15 u/s
- Colisão: clamping nas bordas da sala + resolvedor de movimento para sala inicial
- Sala redonda: clamping radial (`next.setLength(maxRadius)`)

**Pulo** (`triggerJump` / `updateJump`):
- Arco senoidal: `JUMP_HEIGHT * sin(π * progress)^0.92`
- Duração total: `JUMP_ASCEND_DURATION + JUMP_DESCEND_DURATION`
- Impulso horizontal decrescente: 4.5 → 2.15 u/s
- Direção mantida do input no momento do pulo
- Som de pulo (oscilador triangular 230→560Hz)

**Animação procedural de membros** (fallback quando sem animação):
- Braços e pernas oscilam em seno/cosseno com `walkTime`
- Amplitude proporcional à velocidade (`stride = velocity * 0.18`)

### 4.7 Sistema de Câmera (`updateCamera`)

- **Terceira pessoa** atrás do jogador
- Distância: 0.85 a 4.15 unidades, limitada pela parede mais próxima
- Cálculo de colisão da câmera com paredes:
  - Salas retangulares: interseção com os 4 planos
  - Salas redondas: equação quadrática da circunferência
- Altura: `player.y + 2.65 - pitch * 1.45`
- **pitch** controlado por arrasto vertical (mouse/touch), limitado a `[-0.55, 0.65]`
- **yaw** controlado por arrasto horizontal, livre

### 4.8 Sistema de Joystick Mobile

**Joystick** (`#joystick-zone`):
- Área circular de 118px com knob de 52px
- Raio máximo: 38px (normalizado para [-1, 1])
- Pointer Events: down → setPointerCapture → move → up/cancel
- Multi-touch seguro: cada pointer tem ID único

**Zona de câmera** (`#look-zone`):
- Ocupa 52% da largura e 68% da altura no lado direito
- Arrasto converte pixels em ângulos: `yaw -= dx * 0.006`, `pitch -= dy * 0.004`

**Botões mobile**:
- **Pular** (`#jump-button`): circular, gradiente laranja-vermelho
- **Passinhos** (`#slow-step-button`): retangular, gradiente ciano-azul, modo hold
- **Correr** (`#run-button`): retangular, gradiente verde, modo hold

### 4.9 Sistema de HUD (`#hud`)

**Elementos**:
| Elemento | Descrição |
|---|---|
| `.level-pill` | Nível atual em destaque laranja |
| `.hud-player` | Nome do jogador (truncado com ellipsis) |
| `.room-progress` | Matéria atual + "Pergunta X de 5" + 5 dots |
| `.room-dots` | 5 indicadores: verde (feito), laranja (atual), cinza (futuro) |
| `.hud-actions` | Botões: 📒 Caderno, 🏆 Ranking, ♪ Som |

**Mostrado apenas quando** `subjectChosen = true`, escondido nas telas de menu.

### 4.10 Sistema de Níveis e Progressão

```
Matéria (5 níveis × 5 perguntas = 25 desafios)
│
├── Nível 1: Perguntas 1-5 (índices 0-4)
├── Nível 2: Perguntas 1-5
├── Nível 3: Perguntas 1-5
├── Nível 4: Perguntas 1-5
└── Nível 5: Perguntas 1-5
```

**Progressão**:
- `roomInLevel` incrementa a cada porta aberta (1→2→3→4→5)
- Ao completar 5: `level++` e `roomInLevel = 1`
- Ao atingir nível 5 e completar 5 perguntas: matéria concluída
- Score para ranking: `(level - 1) * 5 + roomInLevel` (máx. 25)

### 4.11 Sistema de Salvamento/Ranking

**Persistência local** (localStorage):
- Nome do jogador: `'elementais-player-name'`
- Caderno por matéria: `'elementais-caderno-v1:matematica'` etc.

**Persistência no servidor** (API interna do Vite):
- `GET /api/ranking` → retorna top 50 ordenado por score decrescente
- `POST /api/ranking` → corpo: `{ name, subject, score }`
  - Valida nome (2-24 chars), subject (deve ser uma das 6 matérias)
  - Encontra ou cria entrada por nome (case-insensitive)
  - Só atualiza se score novo > score salvo
  - Retorna `{ newLeader: boolean }` se o jogador virou 1º lugar
- Persiste em `data/ranking.json` com fila de escrita assíncrona

### 4.12 Sistema de Caderno (`notebook.js`)

- **Canvas 2D** com suporte a três ferramentas: lápis, caneta, borracha
- **Lápis**: traço cinza, alpha 0.7, espessura × 0.88
- **Caneta**: traço azul (#2454af), alpha 1.0
- **Borracha**: compositeOperation `destination-out`, espessura × 3.25
- **Múltiplas páginas**: até 40 por matéria, salvas separadamente
- **Undo/Redo**: por página, stack independente
- **Auto-save**: 280ms após última alteração
- **Resize**: Observer redimensiona canvas com devicePixelRatio (cap 2x, 1.5x no Android)
- **Atalhos**: Ctrl+Z (undo), Ctrl+Shift+Z ou Ctrl+Y (redo), Esc (fechar)
- **Toque**: Pointer Events com suporte a `getCoalescedEvents()` para traços suaves

---

## 5. Como Adicionar uma Nova Matéria

### Passo 1: Registrar a matéria em `SUBJECTS` (`src/questions.js`)

```js
export const SUBJECTS = {
  // ... matérias existentes ...
  artes: { name: 'Artes', short: 'ARTES', icon: '🎨' }
};
```

### Passo 2: Criar o banco de perguntas em `BANKS` (`src/questions.js`)

```js
const BANKS = {
  // ... bancos existentes ...
  artes: [
    // Nível 1 (5 perguntas)
    [
      choice('Qual cor primária?', 'Azul', ['Verde', 'Roxo', 'Laranja'], 'CORES'),
      choice('Qual ferramenta pinta?', 'Pincel', ['Martelo', 'Serrote', 'Colher'], 'FERRAMENTAS'),
      choice('Qual é uma cor quente?', 'Vermelho', ['Azul', 'Verde', 'Roxo'], 'CORES'),
      choice('Qual material usamos para desenhar?', 'Lápis', ['Tesoura', 'Cola', 'Régua'], 'MATERIAIS'),
      choice('Misturar azul e amarelo resulta em:', 'Verde', ['Vermelho', 'Roxo', 'Preto'], 'MISTURAS')
    ],
    // Nível 2 (5 perguntas)
    [ /* ... */ ],
    // Níveis 3-5...
  ]
};
```

### Passo 3: Adicionar ao seletor de matérias no HTML (`index.html`)

```html
<button data-subject="artes"><b>🎨</b><span>Artes<small>Cores e formas</small></span></button>
```

### Passo 4: Adicionar à lista de matérias válidas no ranking (`vite.config.js`)

```js
const validSubjects = new Set(['math', 'portuguese', 'science', 'history', 'english', 'mix', 'artes']);
```

### Passo 5: (Opcional) Adicionar alias no caderno (`src/notebook.js`)

```js
const SUBJECT_ALIASES = {
  // ... aliases existentes ...
  artes: 'artes'
};
const SUBJECT_NAMES = {
  // ... nomes existentes ...
  artes: 'Artes'
};
```

---

## 6. Como Adicionar Perguntas

### Formato `choice` (múltipla escolha)

```js
choice('Enunciado da pergunta?', 'Resposta Correta', ['Errada 1', 'Errada 2', 'Errada 3'], 'DICA')
```

- `prompt`: texto da pergunta
- `answer`: resposta correta (string)
- `wrong` array: exatamente 3 alternativas erradas
- `hint`: dica curta mostrada acima da pergunta
- Total: 4 alternativas (1 certa + 3 erradas)

### Formato `typed` (digitação)

```js
typed('Enunciado da pergunta?', 'resposta', 'DICA')
```

- O jogador digita a resposta em um campo de texto
- A comparação usa `normalizeAnswer()`, então é case-insensitive e ignora acentos

### Onde adicionar

Localize o array do nível desejado (0-4) dentro da matéria:

```js
// Exemplo: adicionar pergunta extra no nível 3 de Ciências
BANKS.science[2].push(
  choice('Qual planeta é conhecido como planeta vermelho?', 'Marte', ['Vênus', 'Saturno', 'Netuno'], 'PLANETAS')
);
```

**Atenção**: Cada nível deve ter **exatamente 5 perguntas**. O jogo acessa por índice (0-4). Se você quiser mais variedade, implemente seleção aleatória em vez de acesso por índice.

---

## 7. Como Adicionar Novos Tipos de Perguntas

### 7.1 Pergunta com imagem

Seria necessário:
1. Adicionar campo `image` ao objeto da pergunta
2. Modificar `openMath()` em `main.js` para renderizar `<img>` quando `problem.image` existir
3. Armazenar imagens em `public/assets/`

### 7.2 Pergunta de verdadeiro/falso

```js
// Nova fábrica
const trueFalse = (prompt, answer, hint) => ({
  prompt,
  answer: answer ? 'Verdadeiro' : 'Falso',
  choices: ['Verdadeiro', 'Falso'],
  hint,
  inputMode: 'choice'
});
```

### 7.3 Pergunta de ordenação

Requereria mudanças significativas na UI (arrastar itens) e no sistema de validação.

### 7.4 Múltipla escolha com timer

Adicionar campo `timeLimit` (segundos) ao objeto da pergunta e um contador regressivo no modal, chamando `checkAnswer(null, null)` como "tempo esgotado" ao zerar.

### Passos gerais para implementar um novo tipo:

1. **`questions.js`**: Criar nova fábrica + adicionar campo `inputMode` único (ex: `'trueFalse'`)
2. **`main.js`** em `openMath()`: Adicionar branch para o novo `inputMode` renderizando a UI apropriada
3. **`main.js`** em `checkAnswer()`: Se necessário, lógica de validação específica
4. **`index.html`**: Se precisar de novos elementos HTML no modal
5. **`style.css`**: Estilos para os novos elementos

---

## 8. Como Criar uma Nova Sala

### 8.1 Adicionar um novo formato

Em `createRoomSpec()` (`main.js`, linha 74):

```js
function createRoomSpec(number) {
  if (number === 1) {
    return { halfX: 12.5, halfZ: 8, height: 5.4, shape: 'mine', theme: THEMES[3], doorScale: .96 };
  }
  const sizes = [
    { halfX: 6, halfZ: 6, height: 3.4, shape: 'square' },
    // ... formatos existentes ...
    { halfX: 5, halfZ: 10, height: 3.8, shape: 'corridor' }  // NOVO
  ];
  return { ...sizes[(number - 1) % sizes.length], theme: THEMES[(number - 1) % THEMES.length], doorScale: .86 + Math.random() * .3 };
}
```

Depois, em `buildRoom()`, adicionar branch para `shape === 'corridor'` com a geometria desejada.

### 8.2 Adicionar um novo tema

Em `THEMES` (`main.js`, linha 65):

```js
{ name: 'Jardim Encantado', wall: 0x4a7c3f, floor: 0x2d5a1e, ceiling: 0x5a8c4a, accent: 0xff80ab, fog: 0x1a3a14, light: 0xc8e6c9, kind: 'garden' }
```

Depois adicionar detalhes temáticos em `addThemeDetails()` (ex: flores, folhas).

---

## 9. Como Funciona o Salvamento

### Salvamento Local (localStorage)

| Chave | Conteúdo |
|---|---|
| `elementais-player-name` | Nome do jogador (string) |
| `elementais-caderno-v1:matematica` | JSON com páginas e strokes do caderno |

**Caderno**:
- Estrutura: `{ version: 1, currentPage: 0, pages: [{ strokes: [...] }] }`
- Salvamento automático 280ms após última alteração (debounce)
- Carregamento com validação e fallback para caderno vazio
- Limite de 40 páginas por matéria

### Salvamento no Servidor (API)

- **Endpoint**: `/api/ranking` (GET/POST)
- **Armazenamento**: `data/ranking.json` no sistema de arquivos
- **Persistência**: apenas no servidor local (não há banco de dados)
- **Concorrência**: fila de escrita (`writeQueue`) para evitar race conditions
- **Limpeza**: entradas com score 0 não são criadas

---

## 10. Como Funciona o Sistema de Portas

### Criação (`createDoor`)

1. Define lado (`doorSide`): 0=norte, 1=leste, 2=oeste
2. Calcula posição com offset pseudo-aleatório
3. Cria grupo da porta com:
   - `doorPivot` (dobradiça, posição x=-0.93)
   - Folha (`leaf`) com 4 esferas metálicas decorativas
   - Moldura (topo, laterais) e coroa torus
   - Maçaneta (cilindro)
4. Cria painel separado (1.55u ao lado) com tela emissiva

### Abertura (`unlockDoor`)

- Animação de 820ms: `doorPivot.rotation.y` vai de 0 a `-π * 0.52`
- Easing: `1 - (1-t)³`
- Após animação: `enterDoor()` (personagem anda até a porta)

### Substituição (`replaceDoor`)

- Animação de shrink (420ms) → remove da cena → sorteia novo lado → grow (450ms)
- Nova porta tem escala e posição ligeiramente diferentes
- A pergunta também é resetada (`problem = null`)

---

## 11. Como Funciona o HUD

O HUD (`#hud`) é um header fixo com três seções:

```
┌──────────────────────────────────────────────────┐
│  [NÍVEL 1]  │  MATEMÁTICA     │  📒  🏆  ♪    │
│  👤 Jogador │  Pergunta 2 de 5 │                │
│             │  ● ● ○ ○ ○       │                │
└──────────────────────────────────────────────────┘
   hud-left      room-progress      hud-actions
```

- **hud-left**: nível (pill laranja) + nome do jogador
- **room-progress**: matéria + pergunta atual + 5 dots indicadores
- **hud-actions**: botões de caderno, ranking e som

**Controle de visibilidade**: elemento tem classe `hidden` até `subjectChosen = true`.

**Atualização**: `updateHUD()` é chamada após cada mudança de sala ou nível.

---

## 12. Como Funciona a Movimentação

### Pipeline de Input → Movimento

```
Input (teclado/joystick) → moveInput {x, y}
    ↓
forward = moveInput.y + (KeyW||ArrowUp) - (KeyS||ArrowDown)
strafe  = moveInput.x + (KeyD||ArrowRight) - (KeyA||ArrowLeft)
    ↓
Normalização (se length > 1)
    ↓
Velocidade base: 3.05 (normal) | 1.45 (slow) | 5.15 (run)
    ↓
targetX = (sin(yaw)*forward + cos(yaw)*strafe) * speed
targetZ = (-cos(yaw)*forward + sin(yaw)*strafe) * speed
    ↓
Inércia: velocity += (target - velocity) * (1 - exp(-responsiveness * dt))
    ↓
Resolução de colisão: clamping nas bordas + resolveInitialRoomMovement()
    ↓
player.position.x = next.x; player.position.z = next.y
```

### Modos de velocidade

| Modo | Tecla | Velocidade | Provoca |
|---|---|---|---|
| Normal | (padrão) | 3.05 u/s | walkingAction |
| Lento | Ctrl / botão "Passinhos" | 1.45 u/s | slowWalkingAction |
| Rápido | Shift / botão "Correr" | 5.15 u/s | runningAction |

### Detecção de tecla travada

Se uma tecla de movimento ficar pressionada por mais de 900ms sem um novo evento `keydown`, todas as teclas de movimento são resetadas. Isso previne movimento fantasma quando o jogador alt-tab ou a janela perde foco.

---

## 13. Como Funciona a Câmera

### Parâmetros

- **yaw**: rotação horizontal (0 = olhando para -Z)
- **pitch**: inclinação vertical, limitada a `[-0.55, 0.65]`
- **Distância**: 0.85 a 4.15 unidades atrás do jogador

### Cálculo da posição

```js
behindX = -sin(yaw)     // vetor atrás do jogador
behindZ = cos(yaw)

// Distância limitada pela parede (evita clipping)
wallLimit = min(intersecção com cada parede)
distance = clamp(0.85, wallLimit, 4.15)

camera.x = player.x + behindX * distance
camera.y = player.y + 2.65 - pitch * 1.45
camera.z = player.z + behindZ * distance

camera.lookAt(player.x, player.y + 1.12, player.z)
```

### Controles de câmera

| Dispositivo | Controle |
|---|---|
| Desktop (mouse) | Arrastar com botão esquerdo |
| Mobile | Arrastar na `#look-zone` (lado direito) |
| Ambos | Sensibilidade: yaw ×0.005-0.006, pitch ×0.004 |

---

## 14. Como Funciona o Joystick Mobile

```
┌──────────────────────────────────────────────┐
│                                              │
│   ┌──────┐                    ┌──────────┐  │
│   │      │                    │  GIRE A   │  │
│   │  ◉   │                    │  CÂMERA   │  │
│   │      │                    │           │  │
│   └──────┘                    └──────────┘  │
│   joystick                     look-zone    │
│                                              │
│              [Passinhos] [Correr] [Pular]    │
│               mobile-action-buttons          │
└──────────────────────────────────────────────┘
```

### Implementação técnica

- **Pointer Events** com Pointer Capture para tracking multi-touch
- Cada pointer tem ID único → suporta 2+ dedos simultâneos
- Knob limitado a raio de 38px dentro da zona de 118px
- Valores normalizados: `moveInput.x ∈ [-1, 1]`, `moveInput.y ∈ [-1, 1]`
- Ao perder capture (ex: gesture do sistema), joystick reseta automaticamente

### Tratamento de borda

- `pointerup`, `pointercancel`, `lostpointercapture` → reseta joystick
- `touchend`/`touchcancel` com 0 touches → reseta joystick
- `blur` da janela → reseta todos os controles
- `visibilitychange` para hidden → reseta todos os controles
- `contextmenu` → reseta (previne menu de clique longo)

---

## 15. Pontos Fracos da Arquitetura

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

## 16. Sugestões de Melhorias

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

## 17. Glossário de Variáveis Principais (`main.js`)

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
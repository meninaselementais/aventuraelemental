# 🏗️ Arquitetura — Aventura das ELEMENTAIS

> Documento de arquitetura pura. Para detalhes de implementação, consulte `DOCUMENTACAO.md`.

---

## 1. Diagrama de Módulos e Dependências

```
┌──────────────────────────────────────────────────────────────────────┐
│                          index.html                                   │
│  DOM estático: overlays, HUD, modais, controles touch, canvas        │
└──────────────┬───────────────────────────────────────────────────────┘
               │ <script type="module" src="/src/main.js">
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          main.js (Engine)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Renderer │ │ Movement │ │  Camera  │ │  Doors   │ │  UI/HUD    │ │
│  │ init3D() │ │updateMov │ │updateCam │ │createDoor│ │updateHUD() │ │
│  │ animate()│ │ement()   │ │era()     │ │unlockDo. │ │openMath()  │ │
│  │buildRoom │ │          │ │          │ │replaceDo.│ │checkAns()  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────┬──────┘ │
│                                                            │         │
│                       character + animations               │         │
│                       audio (beep/jump)                    │         │
│                       ranking (saveProgress/loadRanking)   │         │
└──────┬────────────────────────────────────────────────────┬┴─────────┘
       │ import                                           │ DOM queries
       ▼                                                  ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ questions.js │    │ notebook.js  │    │  style.css    │
│              │    │              │    │               │
│ SUBJECTS     │    │ abrirCaderno │    │ overlays      │
│ BANKS        │    │ fecharCaderno│    │ HUD           │
│ getQuestion()│    │ initCaderno  │    │ touch-controls│
│ normalizeAns │    │ canvas 2D    │    │ modais        │
└──────┬───────┘    └──────┬───────┘    └───────────────┘
       │ API                │ API
       │ getQuestion()      │ abrirCaderno()
       │ normalizeAnswer()  │ initCaderno(callbacks)
       ▼                    ▼
    main.js              main.js
    consumidor           consumidor
```

---

## 2. Engine — Loop Principal

```
┌──────────────────────────────────────────────────────────┐
│                    BOOT SEQUENCE                          │
│                                                           │
│  1. restorePlayer()     ── lê localStorage (nome)        │
│  2. init3D()            ── Three.js scene/camera/renderer │
│  3. setupControls()     ── keyboard + touch listeners     │
│  4. updateHUD()         ── preenche UI inicial            │
│  5. animate()           ── inicia loop                    │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                   GAME LOOP (animate)                      │
│                                                           │
│  requestAnimationFrame(animate)                            │
│       │                                                   │
│       ├─ dt = min(clock.getDelta(), 0.05)  ← cap 50ms    │
│       │                                                   │
│       ├─ updateMovement(dt)                                │
│       │    ├─ updateJump(dt)            ← física pulo     │
│       │    ├─ [input → target velocity] ← WASD/joystick  │
│       │    ├─ [inércia + colisão]       ← clamping       │
│       │    ├─ [posição personagem]      ← player.position │
│       │    ├─ [animação membros]        ← walkTime       │
│       │    ├─ [animação skeletal]       ← characterMixer │
│       │    ├─ updateCamera()            ← segue player   │
│       │    └─ [distância porta]         ← mostra botão   │
│       │                                                   │
│       ├─ doorGlow.intensity = 9 + sin(t*0.003)*3          │
│       │                                                   │
│       └─ renderer.render(scene, camera)                   │
└──────────────────────────────────────────────────────────┘
```

**Características**:
- Single-threaded, síncrono (tudo no mesmo frame)
- Delta time capado em 50ms previne saltos após tab-away
- Sem física de engine externa (movimento = clamping manual)
- Sem ECS (Entity-Component-System) — objetos são grupos Three.js manipulados diretamente

---

## 3. Renderização — Scene Graph

```
Scene
├── FogExp2                              ← névoa exponencial
├── HemisphereLight / PointLight × N     ← iluminação temática
│
├── [Sala procedural]                    ← buildRoom()
│   ├── floor        (BoxGeometry)
│   ├── ceiling      (BoxGeometry)
│   ├── wallS/N/W/E  (BoxGeometry × 4)
│   ├── ceilingBeams (BoxGeometry × N)
│   ├── fixtures     (BoxGeometry × N)   ← luzes decorativas
│   └── themeDetails (varia por tema)    ← addThemeDetails()
│
├── [Sala inicial .glb]                  ← loadInitialRoom() (sala 1)
│   ├── meshes decorativas
│   ├── collision volumes (-colonly)
│   └── decorative door
│
├── doorGroup                            ← createDoor()
│   ├── doorPivot (dobradiça)
│   │   └── leaf (folha + detalhes)
│   └── frame + crown
│
├── panelGroup                           ← painel de pergunta
│   └── frame + screen + buttons
│
├── doorGlow (PointLight pulsante)
│
└── characterGroup                       ← createElemental()
    ├── [Modelo 3D] (FBX/GLB/procedural)
    ├── leftArm / rightArm (pivôs)
    └── leftLeg / rightLeg (pivôs)
```

**Pipeline de renderização**:
- **Materials**: `MeshStandardMaterial` (salas), `MeshPhysicalMaterial` (porta com clearcoat)
- **Shadows**: PCFSoftShadowMap, castShadow/receiveShadow em meshes
- **Tone Mapping**: ACESFilmicToneMapping, exposição variável (1.16 na mina, 1.0 demais)
- **Color Space**: SRGBColorSpace no output

---

## 4. Fluxo do Jogo — Máquina de Estados

```
                    ┌──────────┐
                    │  IDLE    │ ← tela carregando (init3D)
                    └────┬─────┘
                         │ started = false
                         ▼
              ┌─────────────────────┐
              │  START_SCREEN       │ ← #start-screen.open
              │  "Começar aventura" │
              └────────┬────────────┘
                       │ startButton.click → started = true
                       ▼
              ┌─────────────────────┐
              │  SUBJECT_SCREEN     │ ← #subject-screen.open
              │  login + 6 matérias │
              └────────┬────────────┘
                       │ connectPlayer() → startSubject(subject)
                       ▼
         ┌─────────────────────────────┐
         │  PLAYING                    │ ← subjectChosen = true
         │  ┌───────────────────────┐  │
         │  │ loop:                 │  │
         │  │  buildNextRoom()      │  │
         │  │  → explora sala       │  │
         │  │  → encontra painel    │  │
         │  │  → openMath()         │  │
         │  │  → checkAnswer()      │  │
         │  │    ├─ acerto → next   │  │
         │  │    └─ erro×3 → replace│  │
         │  └───────────────────────┘  │
         └────────────┬────────────────┘
                      │ roomInLevel > 5
                      ▼
         ┌─────────────────────────────┐
         │  LEVEL_COMPLETE /           │ ← #level-modal.open
         │  SUBJECT_COMPLETE           │
         └────────────┬────────────────┘
                      │ continueButton.click
                      ▼
         ┌─────────────────────────────┐
         │  SUBJECT_SCREEN             │ ← se subjectFinished
         │  ou buildNextRoom()         │ ← se ainda tem níveis
         └─────────────────────────────┘
```

**Transições bloqueadas por flags**:
| Flag | Bloqueia |
|---|---|
| `modalOpen` | Movimento, pulo, interação com porta |
| `changingRoom` | Abertura de modal, movimento, pulo |
| `jumpActive` | Input de movimento (usa jumpDirection) |
| `!started` | Tudo exceto tela inicial |
| `!subjectChosen` | HUD, guia, controles, interação |
| `!playerConnected` | Escolha de matéria |

---

## 5. Fluxo de Perguntas

```
┌─────────────────────────────────────────────────────────────────┐
│                     QUESTIONS.JS (data layer)                    │
│                                                                  │
│  SUBJECTS ──┐                                                    │
│             ├── math      → MATH[5][5]       (typed + choice L1) │
│             ├── portuguese→ BANKS.portuguese[5][5] (choice)     │
│             ├── science   → BANKS.science[5][5]    (choice)     │
│             ├── history   → BANKS.history[5][5]    (choice)     │
│             ├── english   → BANKS.english[5][5]    (choice)     │
│             └── mix       → rotação entre 5 acima               │
│                                                                  │
│  getQuestion(subject, level, index) → {                          │
│    prompt, answer, hint, inputMode, choices?, subject            │
│  }                                                               │
│                                                                  │
│  normalizeAnswer(value) → string limpa (case+acento+pontuação)  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MAIN.JS (consumption)                        │
│                                                                  │
│  openMath()                                                      │
│    ├─ problem ??= getQuestion(subject, level, roomInLevel-1)    │
│    ├─ inputMode === 'choice' → render botões (.answer-button)   │
│    ├─ inputMode === 'typed'  → render input (.typed-answer)     │
│    ├─ restaura wrongChoices (botões já errados desabilitados)   │
│    └─ updateHearts() + feedback textual                          │
│                                                                  │
│  checkAnswer(value, button)                                      │
│    ├─ normalizeAnswer(value) === normalizeAnswer(problem.answer) │
│    │                                                              │
│    ├─ ACERTO:                                                    │
│    │   ├─ saveProgress() → POST /api/ranking                    │
│    │   ├─ unlockDoor() → animação porta abrindo                  │
│    │   └─ enterDoor() → nextRoom() → buildNextRoom()            │
│    │                                                              │
│    └─ ERRO:                                                      │
│        ├─ attempts++ (1-2) → desabilita botão, feedback          │
│        └─ attempts >= 3   → replaceDoor() (nova porta+lugar)     │
│                              + problem = null (nova pergunta)     │
└─────────────────────────────────────────────────────────────────┘
```

**Cache de pergunta**: `problem` sobrevive a fechar/reabrir o modal. Só é recriado quando `null` (após `replaceDoor()` ou `buildNextRoom()`).

---

## 6. Fluxo das Salas

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRIAÇÃO DE SALA                              │
│                                                                  │
│  buildNextRoom()                                                 │
│    ├─ doorSide = random(0,1,2)  ← lado da porta                 │
│    ├─ player.position = spawn    ← posição inicial               │
│    ├─ roomSpec = createRoomSpec(roomNumber)                      │
│    │    ├─ shape  ← ciclo [mine, square, rectangle, round,      │
│    │    │                   small, large]                        │
│    │    └─ theme  ← ciclo [gold, fire, water, coal, crystal]    │
│    ├─ problem = null, attempts = 0                               │
│    │                                                              │
│    └─ buildRoom()                                                │
│         ├─ limpa scene.children (remove sala anterior)          │
│         ├─ define bg + fog por tema                               │
│         ├─ switch (shape):                                        │
│         │    ├─ 'mine'  → piso base + attachInitialRoom()       │
│         │    ├─ 'round' → CylinderGeometry + paredes circulares │
│         │    └─ default → 6 BoxGeometry (piso/teto/4 paredes)   │
│         ├─ addThemeDetails() → decoração temática                │
│         ├─ createDoor(side, accentColor)                         │
│         └─ createElemental() → personagem 3D                     │
│                                                                  │
│  addLights() → Hemisphere + PointLight por tema                  │
│  updateCamera() → posiciona câmera                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TRANSIÇÃO DE SALA                             │
│                                                                  │
│  unlockDoor()              ← acertou pergunta                    │
│    └─ doorPivot.rotation.y: 0 → -π*0.52 (820ms, ease out)      │
│                                                                  │
│  enterDoor()               ← porta abriu                         │
│    └─ personagem anda até porta (scriptedWalk, 1150ms)          │
│                                                                  │
│  nextRoom()                ← chegou na porta                     │
│    ├─ roomNumber++                                               │
│    ├─ roomInLevel++                                              │
│    ├─ if roomInLevel > 5:                                        │
│    │    ├─ if level >= 5 → MATÉRIA CONCLUÍDA (#level-modal)     │
│    │    └─ else → level++, roomInLevel=1 (#level-modal)          │
│    └─ else → buildNextRoom()                                     │
│                                                                  │
│  replaceDoor()             ← errou 3×                            │
│    ├─ shrink porta atual (420ms)                                 │
│    ├─ remove da cena                                             │
│    ├─ doorSide = novo lado                                       │
│    ├─ createDoor()                                               │
│    └─ grow nova porta (450ms)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Fluxo da Câmera

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT → YAW/PITCH                             │
│                                                                  │
│  Desktop: mousedown+drag no canvas                               │
│    yaw  -= (clientX - lastX) * 0.005                             │
│    pitch -= (clientY - lastY) * 0.004                            │
│                                                                  │
│  Mobile: pointerdown+drag no #look-zone                          │
│    yaw  -= (clientX - lastX) * 0.006                             │
│    pitch -= (clientY - lastY) * 0.004                            │
│                                                                  │
│  pitch = clamp(pitch, -0.55, 0.65)                               │
│  yaw   = livre (0 = olhando -Z)                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    updateCamera() — todo frame                   │
│                                                                  │
│  1. Calcula vetor atrás do player:                               │
│     behindX = -sin(yaw)                                          │
│     behindZ =  cos(yaw)                                          │
│                                                                  │
│  2. Calcula distância máxima até parede (wallLimit):             │
│     ┌─ Sala retangular: interseção raio vs 4 planos             │
│     │  limitX = (edgeX - player.x) / behindX                    │
│     │  limitZ = (edgeZ - player.z) / behindZ                    │
│     │  wallLimit = min(limitX, limitZ)                          │
│     │                                                             │
│     └─ Sala redonda: equação quadrática                         │
│        wallLimit = distância até borda do círculo               │
│                                                                  │
│  3. distance = clamp(0.85, wallLimit, 4.15)                     │
│                                                                  │
│  4. camera.position:                                             │
│     x = player.x + behindX * distance                            │
│     y = player.y + 2.65 - pitch * 1.45                          │
│     z = player.z + behindZ * distance                            │
│                                                                  │
│  5. camera.lookAt(player.x, player.y + 1.12, player.z)          │
└─────────────────────────────────────────────────────────────────┘
```

**Comportamento**: A câmera nunca atravessa paredes. Em salas pequenas, aproxima-se do jogador (mín. 0.85u). Em salas grandes, afasta-se até 4.15u.

---

## 8. Fluxo do HUD

```
┌─────────────────────────────────────────────────────────────────┐
│                    updateHUD() — gatilhos                        │
│                                                                  │
│  Chamado em:                                                     │
│    ├─ boot (linha 1517)                                          │
│    ├─ startSubject()                                             │
│    ├─ nextRoom()                                                 │
│    └─ buildNextRoom()                                            │
│                                                                  │
│  Atualiza:                                                       │
│    ├─ #level-value    → level (1-5)                              │
│    ├─ #hud-player     → "👤 {playerName}"                        │
│    ├─ #subject-label  → SUBJECTS[currentSubject].name           │
│    ├─ #room-label     → "Pergunta {roomInLevel} de 5"           │
│    └─ #room-dots      → 5 dots com classes:                     │
│         ├─ .done    (verde)  → i < roomInLevel - 1              │
│         ├─ .current (laranja)→ i === roomInLevel - 1            │
│         └─ (cinza)           → i > roomInLevel - 1              │
│                                                                  │
│  Visibilidade:                                                   │
│    .hidden até subjectChosen = true                              │
│    .hidden ao voltar para SUBJECT_SCREEN                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    GUIA (Lia) — showGuideMessage()               │
│                                                                  │
│  Exibe balão com foto da personagem + mensagem textual          │
│  Auto-esconde após duration (padrão 3600ms)                     │
│  Estados visuais:                                                │
│    .lia-face           → neutro (background-position: 50% 22%)  │
│    .lia-face.thinking  → pensando (48% 22%)                     │
│    .lia-face.happy     → feliz (52% 22%)                         │
│                                                                  │
│  Chamado em:                                                     │
│    ├─ openMath()         → "Pense com calma..."                 │
│    ├─ checkAnswer(acerto)→ "Resposta certa!..."                 │
│    ├─ replaceDoor()      → "A porta mudou de lugar..."          │
│    ├─ buildNextRoom()    → "{Tema}! Encontre a porta..."        │
│    └─ startSubject()     → "{Matéria}: encontre o painel!"      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Fluxo Mobile

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOUCH CONTROLS LAYOUT                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    #touch-controls                        │   │
│  │                                                           │   │
│  │  ┌──────────┐                        ┌──────────────┐    │   │
│  │  │ JOYSTICK │                        │  LOOK-ZONE   │    │   │
│  │  │ 118×118  │                        │  52% × 68%   │    │   │
│  │  │  knob 52 │                        │  "GIRE A     │    │   │
│  │  │  raio 38 │                        │   CÂMERA"    │    │   │
│  │  └──────────┘                        └──────────────┘    │   │
│  │                                                           │   │
│  │              ┌──────────┬──────────┬──────────┐          │   │
│  │              │ Passinhos│  Correr  │  Pular   │          │   │
│  │              │   hold   │   hold   │  tap     │          │   │
│  │              └──────────┴──────────┴──────────┘          │   │
│  │                mobile-action-buttons                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INPUT PIPELINE MOBILE                          │
│                                                                  │
│  Joystick → moveInput {x: -1..1, y: -1..1}                      │
│    ↓                                                             │
│  Botões → flags mobileSlowMode / mobileRunMode                   │
│    ↓                                                             │
│  updateMovement() combina com keyboard input                     │
│    forward = moveInput.y + keys.w - keys.s                       │
│    strafe  = moveInput.x + keys.d - keys.a                       │
│    ↓                                                             │
│  Velocidade baseada em modo (slow/normal/run)                    │
│    ↓                                                             │
│  targetX, targetZ → inércia → colisão → player.position          │
│                                                                  │
│  Look → yaw/pitch                                                │
│    ↓                                                             │
│  updateCamera() usa yaw/pitch                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RESET SEGURO                                   │
│                                                                  │
│  Todos os controles resetam em:                                  │
│    ├─ pointerup / pointercancel / lostpointercapture            │
│    ├─ touchend / touchcancel (0 touches restantes)              │
│    ├─ window.blur / window.focus                                 │
│    ├─ pagehide / visibilitychange (hidden)                      │
│    ├─ contextmenu (clique longo)                                 │
│    └─ tecla Escape                                              │
│                                                                  │
│  Previne:                                                        │
│    ├─ movimento fantasma após gesture do sistema                │
│    ├─ joystick travado após alt-tab                             │
│    └─ múltiplos pointers conflitantes                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Comunicação Entre Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    main.js ← questions.js                        │
│                                                                  │
│  main.js IMPORTA:                                                │
│    import { SUBJECTS, getQuestion, normalizeAnswer }             │
│      from './questions.js'                                       │
│                                                                  │
│  USO:                                                            │
│    problem = getQuestion(currentSubject, level, roomInLevel-1)  │
│    if (normalizeAnswer(input) === normalizeAnswer(problem.ans)) │
│                                                                  │
│  DIREÇÃO: unidirecional                                          │
│    main.js → chama questions.js                                  │
│    questions.js NUNCA importa main.js                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    main.js ← notebook.js                         │
│                                                                  │
│  main.js IMPORTA:                                                │
│    import { initCaderno, abrirCaderno } from './notebook.js'    │
│                                                                  │
│  CONFIGURAÇÃO (boot):                                            │
│    initCaderno({                                                 │
│      onOpen:  () => { modalOpen = true;  stopMovement(); },     │
│      onClose: () => { modalOpen = false; stopMovement(); }      │
│    })                                                            │
│                                                                  │
│  USO:                                                            │
│    abrirCaderno(currentSubject)  ← botão 📒 no HUD              │
│                                                                  │
│  notebook.js EXPORTA PARA WINDOW (debug):                        │
│    window.abrirCaderno = abrirCaderno                            │
│    window.fecharCaderno = fecharCaderno                          │
│                                                                  │
│  DIREÇÃO: bidirecional via callbacks                             │
│    main.js → chama abrirCaderno()                                │
│    notebook.js → chama callbacks.onOpen() / onClose()            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    main.js ← style.css                           │
│                                                                  │
│  main.js IMPORTA:                                                │
│    import './style.css'                                          │
│                                                                  │
│  COMUNICAÇÃO: via DOM (classes CSS)                              │
│    main.js:   element.classList.add('open')                      │
│    style.css: .overlay.open { opacity: 1; visibility: visible; } │
│                                                                  │
│  Classes usadas como "protocolo":                                │
│    .open        → overlays visíveis                              │
│    .hidden      → display: none                                  │
│    .wrong       → botão errado (vermelho + shake)               │
│    .correct     → botão certo (verde)                            │
│    .selected    → ferramenta ativa no caderno                    │
│    .held        → botão pressionado (mobile)                     │
│    .guide-leaving→ animação de saída do balão                   │
│    .me          → destaque do jogador no ranking                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    main.js → vite.config.js (API)                │
│                                                                  │
│  COMUNICAÇÃO: HTTP fetch                                        │
│                                                                  │
│  main.js:                                                        │
│    GET  fetch('/api/ranking')                                    │
│    POST fetch('/api/ranking', { body: JSON })                    │
│                                                                  │
│  vite.config.js (plugin middleware):                             │
│    request.url.startsWith('/api/ranking')                        │
│    → readRanking() / writeRanking() → data/ranking.json         │
│                                                                  │
│  DIREÇÃO: cliente → servidor (HTTP)                              │
│    Sem dependência de import em tempo de build                   │
│    API só funciona com servidor Vite rodando                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Dependências Entre Sistemas

```
┌─────────────────────────────────────────────────────────────────┐
│                    GRAFO DE DEPENDÊNCIAS                         │
│                                                                  │
│  Legenda:                                                        │
│    A ──► B   = A depende de B (B precisa existir primeiro)      │
│    A ═══► B  = A modifica estado de B em runtime                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  init3D() ──► buildRoom() ──► roomSpec                   │   │
│  │                                  │                        │   │
│  │                    ┌─────────────┼────────────┐           │   │
│  │                    ▼             ▼            ▼           │   │
│  │              addLights()   createDoor()  addThemeDetails │   │
│  │                                 │                        │   │
│  │                    ┌────────────┘                        │   │
│  │                    ▼                                     │   │
│  │            createElemental()                             │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  animate() ═══► updateMovement()                                 │
│    │               │                                             │
│    │               ├──► player.position                          │
│    │               ├──► characterGroup.position                  │
│    │               ├──► characterGroup.rotation                  │
│    │               ├──► leftArm/rightArm/leftLeg/rightLeg        │
│    │               ├──► doorDistance → ui.interact visibility    │
│    │               ├──► updateCharacterAnimation(dt)             │
│    │               │       └──► characterMixer (AnimationMixer)  │
│    │               └──► updateCamera()                           │
│    │                       └──► camera.position + lookAt         │
│    │                                                             │
│    └──► doorGlow.intensity                                      │
│                                                                  │
│  openMath() ═══► modalOpen = true                                │
│    │                                                             │
│    ├──► problem ??= getQuestion(...)  ← questions.js            │
│    ├──► DOM: #question, #answers, #operation-hint               │
│    ├──► updateHearts()                                           │
│    └──► showGuideMessage()                                       │
│                                                                  │
│  checkAnswer() ═══►                                              │
│    ├──► normalizeAnswer()  ← questions.js                        │
│    ├──► saveProgress() → POST /api/ranking                      │
│    ├──► unlockDoor() → doorPivot.rotation                       │
│    ├──► replaceDoor() → remove + createDoor()                    │
│    └──► enterDoor() → nextRoom() → buildNextRoom()              │
│                                                                  │
│  buildRoom() ═══►                                                │
│    ├──► LIMPA scene.children (remove tudo)                      │
│    ├──► recria geometria procedural                              │
│    └──► addLights()                                              │
│                                                                  │
│  RESTRIÇÕES:                                                     │
│    ├─ Nenhum sistema lê diretamente variáveis de outro           │
│    ├─ Toda comunicação é via variáveis globais do módulo        │
│    ├─ DOM é usado como "barramento" para UI state               │
│    └─ localStorage é usado como "barramento" para persistência  │
└─────────────────────────────────────────────────────────────────┘
```

**Sistemas que precisam ser reinicializados ao trocar de sala:**
| Sistema | Resetado por | Motivo |
|---|---|---|
| Geometria da sala | `buildRoom()` limpa `scene.children` | Nova sala = nova geometria |
| Porta + painel | `createDoor()` chamado em `buildRoom()` | Cada sala tem sua porta |
| Personagem | **não resetado** — `characterGroup` persiste | Reutiliza o mesmo modelo |
| Luzes | `addLights()` chamado em `buildRoom()` | Iluminação temática |
| Câmera | `updateCamera()` chamado a cada frame | Segue o jogador |
| Pergunta | `problem = null` em `buildNextRoom()` | Nova sala = nova pergunta |

---

## 12. Diagrama de Estado do Jogador

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTADOS DO JOGADOR                            │
│                                                                  │
│  ┌──────────┐                                                    │
│  │  IDLE    │ ← parado (velocity ≈ 0)                           │
│  │  idleAnim│    idleAction weight = 1                           │
│  └────┬─────┘                                                    │
│       │ input detectado (WASD / joystick)                        │
│       ▼                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ WALKING  │  │ SLOW WALKING │  │   RUNNING    │              │
│  │ 3.05 u/s │  │   1.45 u/s   │  │   5.15 u/s   │              │
│  │ walkAnim │  │ slowWalkAnim │  │   runAnim    │              │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘              │
│       │               │                  │                        │
│       └───────────────┼──────────────────┘                        │
│                       │ Space / botão Pular                       │
│                       ▼                                           │
│               ┌──────────────┐                                    │
│               │   JUMPING    │                                    │
│               │  arco seno   │                                    │
│               │  jumpAnim    │                                    │
│               │  ~0.74s      │                                    │
│               └──────┬───────┘                                    │
│                      │ jumpElapsed >= jumpDuration                │
│                      ▼                                            │
│               ┌──────────────┐                                    │
│               │ IDLE/WALKING │ ← retoma estado anterior          │
│               └──────────────┘                                    │
│                                                                  │
│  Transições bloqueadas durante:                                  │
│    ├─ JUMPING: não pode pular de novo                           │
│    ├─ modalOpen: não pode se mover                               │
│    ├─ changingRoom: não pode se mover                            │
│    └─ scriptedWalk: movimento automático (entrar na porta)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 13. Diagrama de Persistência

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONDE OS DADOS VIVEM                           │
│                                                                  │
│  ┌─────────────────────┐                                         │
│  │    localStorage      │  (cliente, sobrevive a reload)        │
│  │                      │                                        │
│  │  player-name         │  string                                │
│  │  caderno:matematica  │  JSON { pages: [...] }                │
│  │  caderno:portugues   │  JSON { pages: [...] }                │
│  │  caderno:*           │  um por matéria                        │
│  └─────────────────────┘                                         │
│                                                                  │
│  ┌─────────────────────┐                                         │
│  │    data/ranking.json │  (servidor, persiste no disco)        │
│  │                      │                                        │
│  │  [                    │                                        │
│  │    {                  │                                        │
│  │      name: string,    │                                        │
│  │      subject: string, │  math|portuguese|science|...         │
│  │      score: number,   │  1-25                                 │
│  │      level: number,   │  1-5                                  │
│  │      updatedAt: ISO   │                                        │
│  │    }                  │                                        │
│  │  ]                    │                                        │
│  └─────────────────────┘                                         │
│                                                                  │
│  ┌─────────────────────┐                                         │
│  │    Memória (módulo)  │  (volátil, some ao recarregar)        │
│  │                      │                                        │
│  │  player.position     │  Vector3                               │
│  │  level, roomInLevel  │  number                                │
│  │  problem, attempts   │  object / number                       │
│  │  roomSpec, doorSide  │  object / number                       │
│  │  wrongChoices        │  Set                                   │
│  │  yaw, pitch          │  number                                │
│  │  jumpActive, etc.    │  boolean                               │
│  │  (50+ variáveis)     │                                        │
│  └─────────────────────┘                                         │
│                                                                  │
│  NADA é preservado entre sessões de jogo além de:                │
│    ├─ Nome do jogador (localStorage)                             │
│    └─ Caderno (localStorage)                                     │
│                                                                  │
│  Progresso no jogo (nível, sala) NÃO é salvo localmente.        │
│  Apenas o score final é enviado ao ranking.                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Resumo de Responsabilidades

| Módulo | Responsabilidade primária | Acoplado com |
|---|---|---|
| `main.js:init3D()` | Inicializar Three.js | renderer, scene, camera |
| `main.js:buildRoom()` | Construir geometria da sala | roomSpec, THEMES, doors, lights |
| `main.js:updateMovement()` | Input → física → posição → animação → câmera | TUDO (ponto crítico) |
| `main.js:updateCamera()` | Posicionar câmera第三人称 | player.position, yaw, pitch, roomSpec |
| `main.js:openMath()` | Exibir pergunta no modal | questions.js, DOM |
| `main.js:checkAnswer()` | Validar resposta + consequências | questions.js, ranking API, doors |
| `main.js:createDoor()` | Instanciar porta 3D + painel | roomSpec, scene |
| `main.js:createElemental()` | Carregar/instanciar personagem | assets, scene |
| `questions.js` | Fornecer perguntas e normalização | nenhum (puro) |
| `notebook.js` | Canvas de desenho + persistência | localStorage, DOM |
| `vite.config.js` | API REST de ranking | fs, data/ranking.json |
| `style.css` | Aparência visual | DOM (classes) |

---

*Documento de arquitetura. Para guias de "como fazer", consulte DOCUMENTACAO.md.*
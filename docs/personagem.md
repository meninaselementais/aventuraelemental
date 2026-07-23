# 🎮 Sistema de Personagem e Movimentação — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (funções `createElemental`, `updateMovement`, `triggerJump`)

---

## 1. Sistema de Personagem (`createElemental`)

### Carregamento em Cascata

1. Tenta carregar FBX com animações (`elemental-walking.fbx`)
2. Em paralelo, carrega animações adicionais como AnimationClip JSON:
   - `elemental-slow-walking.json` → slowWalkingAction
   - `elemental-idle.json` → idleAction
   - `elemental-jumping.json` → jumpingAction
   - `elemental-fast-run.json` → runningAction
3. Se FBX falhar → fallback GLB (`elemental-character.glb`)
4. Se GLB falhar → `createProceduralElemental()` (boneco blocado)

### Preparação do Modelo (`prepareElementalModel`)

- Rotaciona 180° (o modelo vem de costas)
- Escala para altura de 2.15 unidades
- Centraliza no chão (bounding box)
- Habilita castShadow/receiveShadow

### Animações In-Place (`makeAnimationInPlace`)

- Remove translação dos quadris (hips) para animações tocarem sem deslocamento
- Permite que o código controle a posição separadamente

### Blending de Animações

- 5 ações com pesos interpolados: `walkBlend`, `slowWalkBlend`, `runBlend`, `idleBlend`, `jumpBlend`
- Transição suave com `blendSpeed = 1 - exp(-10 * dt)`
- TimeScale ajustado por velocidade para sincronizar passos com movimento

### Animação Procedural de Membros (fallback)

- Braços e pernas oscilam em seno/cosseno com `walkTime`
- Amplitude proporcional à velocidade (`stride = velocity * 0.18`)
- Usado apenas quando não há animação carregada

---

## 2. Sistema de Movimentação (`updateMovement`)

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

### Input

| Dispositivo | Controles |
|---|---|
| **Desktop** | Teclas WASD / setas + Shift (correr) / Ctrl (passos lentos) |
| **Mobile** | Joystick virtual + botões (Passinhos, Correr, Pular) |

### Prevenção de Tecla Travada

Se uma tecla de movimento ficar pressionada por mais de 900ms sem um novo evento `keydown`, todas as teclas de movimento são resetadas. Isso previne movimento fantasma quando o jogador alt-tab ou a janela perde foco.

### Física

- Velocidade com inércia: `velocity += (target - velocity) * smooth`
- `smooth = 1 - exp(-responsiveness * dt)` onde `responsiveness = 9` (movendo) ou `6` (parado)
- Colisão: clamping nas bordas da sala + resolvedor de movimento para sala inicial
- Sala redonda: clamping radial (`next.setLength(maxRadius)`)

### Modos de Velocidade

| Modo | Tecla | Velocidade | Animação |
|---|---|---|---|
| Normal | (padrão) | 3.05 u/s | walkingAction |
| Lento | Ctrl / botão "Passinhos" | 1.45 u/s | slowWalkingAction |
| Rápido | Shift / botão "Correr" | 5.15 u/s | runningAction |

---

## 3. Sistema de Pulo (`triggerJump` / `updateJump`)

- Arco senoidal: `JUMP_HEIGHT * sin(π * progress)^0.92`
- Duração total: `JUMP_ASCEND_DURATION + JUMP_DESCEND_DURATION`
- Impulso horizontal decrescente: 4.5 → 2.15 u/s
- Direção mantida do input no momento do pulo
- Som de pulo (oscilador triangular 230→560Hz)

---

*Documentação gerada em 20/07/2026.*
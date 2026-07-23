# 📱 Sistema de Joystick Mobile — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (funções `setupMobileControls` e controles touch)

---

## 1. Layout Mobile

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

---

## 2. Joystick (`#joystick-zone`)

### Especificações
- Área circular de 118px com knob de 52px
- Raio máximo: 38px (normalizado para [-1, 1])
- Pointer Events: down → setPointerCapture → move → up/cancel
- Multi-touch seguro: cada pointer tem ID único

### Valores
- `moveInput.x ∈ [-1, 1]`
- `moveInput.y ∈ [-1, 1]`

---

## 3. Zona de Câmera (`#look-zone`)

- Ocupa 52% da largura e 68% da altura no lado direito
- Arrasto converte pixels em ângulos:
  - `yaw -= dx * 0.006`
  - `pitch -= dy * 0.004`

---

## 4. Botões Mobile

| Botão | ID | Formato | Estilo | Modo |
|---|---|---|---|---|
| **Pular** | `#jump-button` | Circular | Gradiente laranja-vermelho | Tap |
| **Passinhos** | `#slow-step-button` | Retangular | Gradiente ciano-azul | Hold |
| **Correr** | `#run-button` | Retangular | Gradiente verde | Hold |

---

## 5. Tratamento de Borda (Resiliência)

O sistema lida com vários cenários de perda de controle:

- `pointerup`, `pointercancel`, `lostpointercapture` → reseta joystick
- `touchend`/`touchcancel` com 0 touches → reseta joystick
- `blur` da janela → reseta todos os controles
- `visibilitychange` para hidden → reseta todos os controles
- `contextmenu` → reseta (previne menu de clique longo)

---

## 6. Implementação Técnica

- **Pointer Events** com Pointer Capture para tracking multi-touch
- Cada pointer tem ID único → suporta 2+ dedos simultâneos
- Knob limitado a raio de 38px dentro da zona de 118px
- Ao perder capture (ex: gesture do sistema), joystick reseta automaticamente

---

*Documentação gerada em 20/07/2026.*
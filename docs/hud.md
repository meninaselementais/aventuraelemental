# 🖥️ Sistema de HUD — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (funções `updateHUD` e overlays)

---

## 1. Visão Geral

O HUD (`#hud`) é um header fixo com três seções, mostrado apenas quando `subjectChosen = true` (escondido nas telas de menu).

```
┌──────────────────────────────────────────────────┐
│  [NÍVEL 1]  │  MATEMÁTICA     │  📒  🏆  ♪    │
│  👤 Jogador │  Pergunta 2 de 5 │                │
│             │  ● ● ○ ○ ○       │                │
└──────────────────────────────────────────────────┘
   hud-left      room-progress      hud-actions
```

---

## 2. Elementos do HUD

| Elemento | Descrição |
|---|---|
| `.level-pill` | Nível atual em destaque laranja |
| `.hud-player` | Nome do jogador (truncado com ellipsis) |
| `.room-progress` | Matéria atual + "Pergunta X de 5" + 5 dots |
| `.room-dots` | 5 indicadores: verde (feito), laranja (atual), cinza (futuro) |
| `.hud-actions` | Botões: 📒 Caderno, 🏆 Ranking, ♪ Som |

---

## 3. Seções Detalhadas

### hud-left
- Nível atual em formato de pill laranja (`[NÍVEL 1]`)
- Nome do jogador abaixo

### room-progress
- Nome da matéria atual
- Contador "Pergunta X de 5"
- 5 dots indicadores de progresso:
  - 🟢 Verde: pergunta já respondida
  - 🟠 Laranja: pergunta atual
  - ⚪ Cinza: pergunta futura

### hud-actions
- 📒 **Caderno**: abre o caderno interativo
- 🏆 **Ranking**: abre o modal de ranking
- ♪ **Som**: toggle liga/desliga som

---

## 4. Controle de Visibilidade

O elemento `#hud` tem classe `hidden` até `subjectChosen = true`. A função `updateHUD()` é chamada após cada mudança de sala ou nível para atualizar os indicadores.

---

*Documentação gerada em 20/07/2026.*
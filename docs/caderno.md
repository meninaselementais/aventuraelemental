# 📒 Sistema de Caderno Interativo — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/notebook.js` (298 linhas)

---

## 1. Visão Geral

Sistema de caderno com canvas HTML5, permitindo que o jogador faça anotações durante o jogo.

---

## 2. Ferramentas

| Ferramenta | Comportamento | Detalhes Técnicos |
|---|---|---|
| **Lápis** | Traço cinza | Alpha 0.7, espessura × 0.88 |
| **Caneta** | Traço azul (#2454af) | Alpha 1.0 |
| **Borracha** | Apaga traços | compositeOperation `destination-out`, espessura × 3.25 |

---

## 3. Funcionalidades

- **Múltiplas páginas**: até 40 por matéria, salvas separadamente
- **Undo/Redo**: por página, stack independente
- **Auto-save**: 280ms após última alteração (debounce)
- **Resize**: Observer redimensiona canvas com devicePixelRatio (cap 2x, 1.5x no Android)

### Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Esc` | Fechar caderno |

---

## 4. Suporte a Toque

Pointer Events com suporte a `getCoalescedEvents()` para traços suaves em dispositivos touch.

---

## 5. Estrutura de Dados (localStorage)

- Chave: `elementais-caderno-v1:matematica` (uma por matéria)
- Estrutura: `{ version: 1, currentPage: 0, pages: [{ strokes: [...] }] }`
- Carregamento com validação e fallback para caderno vazio
- Limite de 40 páginas por matéria

---

*Documentação gerada em 20/07/2026.*
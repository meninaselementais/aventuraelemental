# 📷 Sistema de Câmera — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (função `updateCamera`)

---

## 1. Visão Geral

Câmera em terceira pessoa atrás do jogador, com detecção de colisão contra paredes para evitar clipping.

---

## 2. Parâmetros

| Parâmetro | Descrição | Limites |
|---|---|---|
| **yaw** | Rotação horizontal | Livre (0 = olhando para -Z) |
| **pitch** | Inclinação vertical | `[-0.55, 0.65]` |
| **Distância** | Distância atrás do jogador | `[0.85, 4.15]` unidades |

---

## 3. Cálculo da Posição

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

### Detecção de colisão por tipo de sala
- **Salas retangulares**: interseção com os 4 planos das paredes
- **Salas redondas**: equação quadrática da circunferência

---

## 4. Controles de Câmera

| Dispositivo | Controle |
|---|---|
| Desktop (mouse) | Arrastar com botão esquerdo |
| Mobile | Arrastar na `#look-zone` (lado direito) |
| Ambos | Sensibilidade: yaw ×0.005-0.006, pitch ×0.004 |

- **yaw**: controlado por arrasto horizontal, livre
- **pitch**: controlado por arrasto vertical, limitado a `[-0.55, 0.65]`

---

## 5. Configuração da Câmera Three.js

- Tipo: `PerspectiveCamera(70°, aspect, 0.1, 60)`
- Ordem de rotação: `YXZ`
- Pixel Ratio: Limitado a 1.7 (ou 1.35 em mobile) para performance
- Tone Mapping: `ACESFilmicToneMapping` com exposição ajustável

---

*Documentação gerada em 20/07/2026.*
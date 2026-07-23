# 🏠 Sistema de Salas — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (funções `buildRoom`, `createRoomSpec`)

---

## 1. Especificação da Sala (`roomSpec`)

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

---

## 2. Formatos de Sala

| Forma | Construção |
|---|---|
| `square` / `rectangle` | 6 BoxGeometry: piso, teto, 4 paredes |
| `round` | CylinderGeometry para piso/teto, 32 BoxGeometry rotacionadas em círculo para paredes |
| `small` / `large` | Idem square, variando halfX/halfZ/height |
| `mine` | Piso base discreto + carrega `sala-inicial.glb` assíncrono |

---

## 3. Temas Visuais (5 temas)

| Tema | Cores | Detalhes |
|---|---|---|
| Corredores Dourados | Bege/dourado | Pilares |
| Templo do Fogo | Marrom/vermelho | Cones flamejantes + PointLights laranja |
| Câmara das Águas | Azul/ciano | Torus (anéis d'água) no chão |
| Mina de Carvão | Cinza escuro | Dodecaedros (pedras) + tochas 3D |
| Gruta de Cristal | Roxo/lavanda | Cones de cristal + brilho emissivo |

---

## 4. Como Criar uma Nova Sala

### 4.1 Adicionar um novo formato

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

### 4.2 Adicionar um novo tema

Em `THEMES` (`main.js`, linha 65):

```js
{ name: 'Jardim Encantado', wall: 0x4a7c3f, floor: 0x2d5a1e, ceiling: 0x5a8c4a, accent: 0xff80ab, fog: 0x1a3a14, light: 0xc8e6c9, kind: 'garden' }
```

Depois adicionar detalhes temáticos em `addThemeDetails()` (ex: flores, folhas).

---

*Documentação gerada em 20/07/2026.*
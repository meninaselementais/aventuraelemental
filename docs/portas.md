# 🚪 Sistema de Portas e Painéis — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (funções `createDoor`, `replaceDoor`, `unlockDoor`)

---

## 1. Criação da Porta (`createDoor`)

### Estrutura da Porta (`doorGroup`)

A porta é composta por:
- `doorPivot` (dobradiça) + `leaf` (folha da porta)
- Moldura (frameTop, frameL, frameR), detalhes metálicos (esferas, argola, coroa torus)
- Material físico: `MeshPhysicalMaterial` com clearcoat
- Posicionada em um dos 3 lados: norte (`side=0`), leste (`side=1`), oeste (`side=2`)
- Offset lateral pseudo-aleatório baseado no número da sala

### Fluxo de criação

1. Define lado (`doorSide`): 0=norte, 1=leste, 2=oeste
2. Calcula posição com offset pseudo-aleatório
3. Cria grupo da porta com:
   - `doorPivot` (dobradiça, posição x=-0.93)
   - Folha (`leaf`) com 4 esferas metálicas decorativas
   - Moldura (topo, laterais) e coroa torus
   - Maçaneta (cilindro)
4. Cria painel separado (1.55u ao lado) com tela emissiva

---

## 2. Painel (`panelGroup`)

- Posicionado ao lado da porta (gap de ~1.55 unidades)
- Moldura, tela brilhante (emissive com accentColor), botões decorativos
- Luz pontual (`doorGlow`) pulsante com `sin(time * 0.003)`

---

## 3. Abertura da Porta (`unlockDoor`)

- Animação de 820ms: `doorPivot.rotation.y` vai de 0 a `-π * 0.52`
- Easing: `1 - (1-t)³`
- Após animação: `enterDoor()` (personagem anda até a porta)

---

## 4. Substituição da Porta (`replaceDoor`)

Fluxo quando o jogador erra 3 vezes:
1. Animação de shrink (escala → 0 em 420ms)
2. Remove porta/painel antigos da cena
3. Sorteia novo `doorSide` (evita repetir)
4. Cria nova porta com animação de grow (escala 0 → target em 450ms)
5. A pergunta também é resetada (`problem = null`)

---

*Documentação gerada em 20/07/2026.*
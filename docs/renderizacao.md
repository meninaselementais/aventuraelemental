# 🎨 Sistema de Renderização 3D — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js` (funções `init3D` e `animate`)

---

## 1. Configuração da Engine

- **Motor**: Three.js via WebGL com `renderer.shadowMap.enabled = true` (PCFSoftShadowMap)
- **Cena**: `THREE.Scene` com `background` e `FogExp2` (névoa exponencial)
- **Câmera**: `PerspectiveCamera(70°, aspect, 0.1, 60)`, ordem de rotação `YXZ`
- **Pixel Ratio**: Limitado a 1.7 (ou 1.35 em mobile) para performance
- **Tone Mapping**: `ACESFilmicToneMapping` com exposição ajustável
- **Loop**: `requestAnimationFrame` com delta time capado em 50ms

---

## 2. Inicialização (`init3D`)

```
init3D → scene, camera, renderer, clock, buildRoom(), addLights(), updateCamera(), animate()
```

- Cria a cena principal com fog e background
- Configura renderer com sombras e tone mapping
- Constrói a primeira sala
- Adiciona iluminação
- Inicia o loop de renderização

---

## 3. Loop de Renderização (`animate`)

- Calcula delta time com cap de 50ms
- Atualiza física e movimentação
- Atualiza animações da personagem
- Atualiza câmera
- Renderiza frame via `renderer.render(scene, camera)`
- Solicita próximo frame via `requestAnimationFrame`

---

*Documentação gerada em 20/07/2026.*
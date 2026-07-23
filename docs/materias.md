# 📊 Sistema de Níveis e Progressão — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/main.js`

---

## 1. Estrutura de Progressão

```
Matéria (5 níveis × 5 perguntas = 25 desafios)
│
├── Nível 1: Perguntas 1-5 (índices 0-4)
├── Nível 2: Perguntas 1-5
├── Nível 3: Perguntas 1-5
├── Nível 4: Perguntas 1-5
└── Nível 5: Perguntas 1-5
```

---

## 2. Variáveis de Progressão

| Variável | Descrição |
|---|---|
| `level` | Nível atual (1-5) |
| `roomInLevel` | Sala dentro do nível (1-5) |
| `roomNumber` | Número absoluto da sala |
| `currentSubject` | Matéria atual (string) |

---

## 3. Fluxo de Progressão

1. `roomInLevel` incrementa a cada porta aberta (1→2→3→4→5)
2. Ao completar 5: `level++` e `roomInLevel = 1`
3. Ao atingir nível 5 e completar 5 perguntas: matéria concluída
4. Mostra `#level-modal` → "Escolher outra matéria"

---

## 4. Cálculo de Score

```
Score para ranking = (level - 1) * 5 + roomInLevel
Score máximo = 25 (nível 5, pergunta 5)
```

---

*Documentação gerada em 20/07/2026.*
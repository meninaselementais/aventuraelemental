# ❓ Sistema de Perguntas — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivo principal: `src/questions.js` (232 linhas)

---

## 1. Visão Geral

O sistema de perguntas é gerenciado por `src/questions.js`, que define 5 matérias + modo MIX, totalizando 125 perguntas (25 por matéria) em 5 níveis de dificuldade. Exporta `getQuestion()` e `normalizeAnswer()`.

O fluxo de interação no jogo (`main.js`):
1. Jogador encontra painel → aperta E → `openMath()`
2. Responde pergunta → `checkAnswer()`
3. Acerto → `unlockDoor()` → `enterDoor()` → `nextRoom()`
4. Erro (1-2) → tenta novamente
5. Erro (3) → `replaceDoor()` (porta muda de lugar) + `problem=null` (nova pergunta)

---

## 2. Como Adicionar uma Nova Matéria

### Passo 1: Registrar a matéria em `SUBJECTS` (`src/questions.js`)

```js
export const SUBJECTS = {
  // ... matérias existentes ...
  artes: { name: 'Artes', short: 'ARTES', icon: '🎨' }
};
```

### Passo 2: Criar o banco de perguntas em `BANKS` (`src/questions.js`)

```js
const BANKS = {
  // ... bancos existentes ...
  artes: [
    // Nível 1 (5 perguntas)
    [
      choice('Qual cor primária?', 'Azul', ['Verde', 'Roxo', 'Laranja'], 'CORES'),
      choice('Qual ferramenta pinta?', 'Pincel', ['Martelo', 'Serrote', 'Colher'], 'FERRAMENTAS'),
      choice('Qual é uma cor quente?', 'Vermelho', ['Azul', 'Verde', 'Roxo'], 'CORES'),
      choice('Qual material usamos para desenhar?', 'Lápis', ['Tesoura', 'Cola', 'Régua'], 'MATERIAIS'),
      choice('Misturar azul e amarelo resulta em:', 'Verde', ['Vermelho', 'Roxo', 'Preto'], 'MISTURAS')
    ],
    // Nível 2 (5 perguntas)
    [ /* ... */ ],
    // Níveis 3-5...
  ]
};
```

### Passo 3: Adicionar ao seletor de matérias no HTML (`index.html`)

```html
<button data-subject="artes"><b>🎨</b><span>Artes<small>Cores e formas</small></span></button>
```

### Passo 4: Adicionar à lista de matérias válidas no ranking (`vite.config.js`)

```js
const validSubjects = new Set(['math', 'portuguese', 'science', 'history', 'english', 'mix', 'artes']);
```

### Passo 5: (Opcional) Adicionar alias no caderno (`src/notebook.js`)

```js
const SUBJECT_ALIASES = {
  // ... aliases existentes ...
  artes: 'artes'
};
const SUBJECT_NAMES = {
  // ... nomes existentes ...
  artes: 'Artes'
};
```

---

## 3. Como Adicionar Perguntas

### Formato `choice` (múltipla escolha)

```js
choice('Enunciado da pergunta?', 'Resposta Correta', ['Errada 1', 'Errada 2', 'Errada 3'], 'DICA')
```

- `prompt`: texto da pergunta
- `answer`: resposta correta (string)
- `wrong` array: exatamente 3 alternativas erradas
- `hint`: dica curta mostrada acima da pergunta
- Total: 4 alternativas (1 certa + 3 erradas)

### Formato `typed` (digitação)

```js
typed('Enunciado da pergunta?', 'resposta', 'DICA')
```

- O jogador digita a resposta em um campo de texto
- A comparação usa `normalizeAnswer()`, então é case-insensitive e ignora acentos

### Onde adicionar

Localize o array do nível desejado (0-4) dentro da matéria:

```js
// Exemplo: adicionar pergunta extra no nível 3 de Ciências
BANKS.science[2].push(
  choice('Qual planeta é conhecido como planeta vermelho?', 'Marte', ['Vênus', 'Saturno', 'Netuno'], 'PLANETAS')
);
```

**Atenção**: Cada nível deve ter **exatamente 5 perguntas**. O jogo acessa por índice (0-4). Se você quiser mais variedade, implemente seleção aleatória em vez de acesso por índice.

---

## 4. Como Adicionar Novos Tipos de Perguntas

### 4.1 Pergunta com imagem

Seria necessário:
1. Adicionar campo `image` ao objeto da pergunta
2. Modificar `openMath()` em `main.js` para renderizar `<img>` quando `problem.image` existir
3. Armazenar imagens em `public/assets/`

### 4.2 Pergunta de verdadeiro/falso

```js
// Nova fábrica
const trueFalse = (prompt, answer, hint) => ({
  prompt,
  answer: answer ? 'Verdadeiro' : 'Falso',
  choices: ['Verdadeiro', 'Falso'],
  hint,
  inputMode: 'choice'
});
```

### 4.3 Pergunta de ordenação

Requereria mudanças significativas na UI (arrastar itens) e no sistema de validação.

### 4.4 Múltipla escolha com timer

Adicionar campo `timeLimit` (segundos) ao objeto da pergunta e um contador regressivo no modal, chamando `checkAnswer(null, null)` como "tempo esgotado" ao zerar.

### Passos gerais para implementar um novo tipo:

1. **`questions.js`**: Criar nova fábrica + adicionar campo `inputMode` único (ex: `'trueFalse'`)
2. **`main.js`** em `openMath()`: Adicionar branch para o novo `inputMode` renderizando a UI apropriada
3. **`main.js`** em `checkAnswer()`: Se necessário, lógica de validação específica
4. **`index.html`**: Se precisar de novos elementos HTML no modal
5. **`style.css`**: Estilos para os novos elementos

---

*Documentação gerada em 20/07/2026.*
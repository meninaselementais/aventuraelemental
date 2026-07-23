# AGENTS.md — Instruções Permanentes para Agentes de IA

Este arquivo contém as regras e diretrizes que todo agente de IA deve seguir ao trabalhar neste projeto.

---

## 1. Leitura Obrigatória

- **Sempre leia `DOCUMENTACAO.md` primeiro.** Este arquivo contém a visão geral do projeto, funcionalidades, regras de negócio e decisões de design.
- **Depois leia `ARCHITECTURE.md`.** Este arquivo descreve a estrutura técnica, stack utilizada, organização de pastas e decisões arquiteturais.

## 2. Leitura de Código

- **Nunca leia o projeto inteiro sem necessidade.** Seja cirúrgico. Leia apenas o que for relevante para a tarefa em questão.
- **Leia apenas os arquivos necessários.** Antes de abrir qualquer arquivo, pergunte-se: "Este arquivo é realmente necessário para a tarefa atual?"

## 3. Modificações

- **Faça alterações pequenas e incrementais.** Prefira mudanças mínimas que resolvam o problema. Evite reescrever arquivos inteiros.
- **Nunca altere mais de um sistema por vez.** Cada alteração deve ser focada em um único aspecto do projeto (ex: física, renderização, UI, áudio, etc.).
- **Explique o plano antes de modificar.** Descreva o que pretende fazer, quais arquivos serão afetados e por quê.
- **Aguarde aprovação para alterações grandes.** Se a mudança for significativa (mais de ~50 linhas ou afetar a arquitetura), apresente o plano e aguarde confirmação antes de implementar.

## 4. Build e Testes

- **Execute `npm run build` quando houver alterações em código.** Sempre verifique se o projeto compila sem erros após suas modificações.
- **Nunca quebre funcionalidades existentes.** Antes de considerar uma tarefa concluída, verifique se tudo que funcionava antes continua funcionando.

## 5. Compatibilidade

- **Preserve compatibilidade desktop e mobile.** O projeto deve funcionar em ambas as plataformas. Teste ou considere ambos os cenários ao fazer alterações.

## 6. Qualidade de Código

- **Reutilize código existente.** Antes de escrever algo novo, verifique se já existe uma função, componente ou utilitário que faça o que você precisa.
- **Evite duplicação de lógica.** Se encontrar lógica duplicada, considere extraí-la para um local compartilhado (mas faça isso como uma tarefa separada).

## 7. Comunicação

- **Sempre explique quais arquivos foram alterados** e o motivo de cada alteração ao finalizar uma tarefa.
- Seja claro e direto. Evite rodeios.

## 8. Decisões do Projeto

Estas são as decisões arquiteturais já estabelecidas. Respeite-as ao propor ou implementar mudanças.

| Área       | Decisão           | Motivo                    |
|------------|-------------------|---------------------------|
| Engine     | Three.js          | Melhor desempenho 3D      |
| Build      | Vite              | Hot Reload rápido         |
| Perguntas  | questions.js      | Toda lógica centralizada  |
| Ranking    | localStorage+API  | Offline + sincronização   |
| Mobile     | Joystick Virtual  | Compatibilidade Android   |

---

*Este arquivo deve ser consultado por qualquer agente de IA antes de iniciar qualquer trabalho neste projeto.*

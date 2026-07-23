# 🏆 Sistema de Salvamento e Ranking — Aventura das ELEMENTAIS

> Versão: ALPHA 1.15 | Arquivos: `vite.config.js` (API), `data/ranking.json` (persistência), `src/main.js` (cliente)

---

## 1. Persistência Local (localStorage)

| Chave | Conteúdo |
|---|---|
| `elementais-player-name` | Nome do jogador (string) |
| `elementais-caderno-v1:matematica` | JSON com páginas e strokes do caderno |

---

## 2. Persistência no Servidor (API Interna do Vite)

### Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/ranking` | Retorna top 50 ordenado por score decrescente |
| `POST` | `/api/ranking` | Corpo: `{ name, subject, score }` |

### Regras do POST

- Valida nome (2-24 chars), subject (deve ser uma das 6 matérias válidas)
- Encontra ou cria entrada por nome (case-insensitive)
- Só atualiza se score novo > score salvo
- Retorna `{ newLeader: boolean }` se o jogador virou 1º lugar
- Entradas com score 0 não são criadas

### Armazenamento

- Persiste em `data/ranking.json` com fila de escrita assíncrona (`writeQueue`) para evitar race conditions
- Cada entrada: `{ name, subject, score, level, updatedAt }`

### Limitações

- Sem banco de dados real (apenas JSON em disco)
- Se o arquivo corromper, todos os dados são perdidos
- Sem autenticação: nomes duplicados podem conflitar acidentalmente
- Persistência apenas no servidor local

---

*Documentação gerada em 20/07/2026.*
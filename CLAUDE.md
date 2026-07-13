# Karaguá — Landing Page

Site da **Karaguá Ecotech** ("O Estuário"): créditos de carbono azul em
manguezais, com lastro verificável. Princípio de produto e de design: **cada
número tem uma fonte**. Landing page + mapa de transparência + admin, servidos
por uma API própria (ver Arquitetura).

Este projeto roda sobre dois pilares que **mandam juntos**:

1. **`impeccable`** é o motor de design. Todo trabalho de UI (design, redesign,
   layout, motion, copy de interface, crítica, polish) passa pela skill.
2. **`Spec/`** é o contrato. O PRD e as Specs definem o que construir e os
   critérios objetivos de aceite. **Leia e siga `Spec/` antes de qualquer
   mudança de UI.** A skill nunca pode violar o contrato.

## O contrato — leia primeiro

| Arquivo                            | Define                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Spec/PRD.md`                      | visão, problema, escopo das 8 seções, fases, métricas de sucesso                                                              |
| `Spec/01-design-system-blocado.md` | sistema **amplo e blocado**: grid full-bleed, primitivas (`BlockGrid`/`FullBleed`/`SceneScrub`), regra "sem container visual" |
| `Spec/02-motion.md`                | motion **sutil e com delay**, reveal sequencial (um conteúdo por vez), reduced-motion                                         |
| `Spec/03-copy.md`                  | enxugar copy, budget por seção, "cada número tem fonte", glossário, sem travessão                                             |
| `Spec/04-sections.md`              | critério de aceite por seção + decisões pendentes (D1–D4)                                                                     |

> **Etapa #1 do PRD:** entregar **uma seção** (Hero) como prova de estilo e
> aprová-la antes de propagar para o resto. Não redesenhar tudo de uma vez.

## Stack

- **Vite+** via `bun run` (o binário `vp` não está no PATH):
  `bun run dev` · `bun run build` · `bunx vp check --fix` · `bun run preview`.
  Dev em `http://localhost:5173/`.
- **React 19**, **Tailwind v4** (config no CSS), **shadcn/ui**
  (`bunx shadcn@latest add <nome> --yes`), **motion**. Alias `@/` → `src/`.
- **API** (`api/`): Express + `pg` + JWT, Node puro (npm, não bun).
  Dev: `npm run dev` na pasta `api/` (lê `api/.env`), porta 4000.

## Arquitetura (site → API → Postgres)

Sem Supabase (removido 2026-07). O browser nunca fala com o banco:

| Camada   | Onde           | Papel                                                                                            |
| -------- | -------------- | ------------------------------------------------------------------------------------------------ |
| Site     | raiz do repo   | React SPA; todo acesso a dados via `src/lib/api.ts` (shape `{ data, error }`)                    |
| API      | `api/index.js` | `POST /auth/login` · CRUD `/pontos` (JWT) · `GET /tide-extremes` (Open-Meteo Marine) · `/health` |
| Postgres | Railway        | tabela `pontos_interesse` — **criada pela API no boot** (`ensureSchema`)                         |

Rotas do app (`src/App.tsx`): `/` (LP), `/mapa` (web component
`KaraguaLeafletMap`), `/login`, `/admin` (CRUD de pontos, protegido),
`/laboratorio-karagua-vivo`.

**Auth:** sem tabela de usuários. Login compara com `ADMIN_EMAIL`/`ADMIN_PASSWORD`
(envs da API) e emite JWT (7d) guardado em `localStorage`.

**Envs** — site: `VITE_API_URL` (**variável de build**; mudou = rebuild/redeploy).
API (obrigatórias, sem elas o boot aborta): `DATABASE_URL`, `JWT_SECRET`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD`; opcionais: `STORMGLASS_KEY`, `CORS_ORIGIN`
(exato, sem barra final), `PORT`.

**Deploy (Railway):** 2 serviços do mesmo repo — site (root, `karagua.com.br`)
e API (Root Directory `api`, `api-production-29e3.up.railway.app`) + Postgres.
Sintoma clássico: site recebendo HTML em vez de JSON = `VITE_API_URL` errada.

## Topologia (3 repos)

| Repo                     | Papel                                                                    |
| ------------------------ | ------------------------------------------------------------------------ |
| `Karagua/` (este)        | o site: código, `src/style.css` (tokens), `Spec/` (contrato)             |
| `karagua-context/`       | verdade de marca: `context/*.md`. **Toda copy e todo número saem daqui** |
| `karagua-design-system/` | DS: `DESIGN.md`, `PRODUCT.md` (register=brand), contexto do gate         |

> A skill `impeccable` mora na pasta global de skills (`~/.claude/skills/impeccable/`),
> registrada como `/impeccable`. O `PRODUCT.md`/`DESIGN.md` do gate seguem no DS.

## Rodar o `impeccable`

1. **Contexto** (o gate `product` só passa apontando pro DS; o caminho do
   `karagua-design-system` é **por máquina** — ajuste para o seu clone local):

   ```bash
   IMPECCABLE_CONTEXT_DIR=<caminho-local-do-karagua-design-system> \
     node ~/.claude/skills/impeccable/scripts/load-context.mjs
   ```

   Consuma o JSON inteiro (sem `head`/`grep`/`jq`). Register: **`brand`**.

2. **Gate `shape`:** `craft` só roda com brief aprovado pelo usuário. Escrever
   PRD/Spec não conta como shape aprovado.

## Invariantes (detalhe em `Spec/01–04` + `DESIGN.md`)

- **Sem bordas nem cards:** blocos definidos por alinhamento em grid, espaço em
  branco generoso, troca de superfície e foto de borda dura (hard-edge). **Nada
  de linhas divisórias, hairlines, molduras ou cards.** Largura ampla.
- **Motion sutil:** sem cascata disparando na borda inferior; reveal entra
  depois do elemento confortavelmente em tela, deslocamento pequeno, com delay.
- **Cor:** shell-first, nunca `#FFFFFF`; uma cor de marca (`k-deep` em claro,
  `k-bright` só em escuro ≤3%); profundidade tonal, nunca sombra em repouso.
- **Tipo:** Aileron + mono (mono só para dado verificável).
- **Copy:** cada número tem fonte; **sem travessão** (em copy e em mailto).
- **A11y:** WCAG 2.2 AA; texto ≥12:1 em shell; foco ≥3:1; tap ≥44px.

## Validação

Antes de concluir qualquer mudança: `bunx vp check --fix` e `bun run build`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

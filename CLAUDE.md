# Karaguá — Landing Page

Single-page da **Karaguá Ecotech** ("O Estuário"): créditos de carbono azul em
manguezais, com lastro verificável. Princípio de produto e de design: **cada
número tem uma fonte**.

Este projeto roda sobre dois pilares que **mandam juntos**:

1. **`impeccable`** é o motor de design. Todo trabalho de UI (design, redesign,
   layout, motion, copy de interface, crítica, polish) passa pela skill.
2. **`Spec/`** é o contrato. O PRD e as Specs definem o que construir e os
   critérios objetivos de aceite. **Leia e siga `Spec/` antes de qualquer
   mudança de UI.** A skill nunca pode violar o contrato.

## O contrato — leia primeiro

| Arquivo | Define |
| --- | --- |
| `Spec/PRD.md` | visão, problema, escopo das 8 seções, fases, métricas de sucesso |
| `Spec/01-design-system-blocado.md` | sistema **amplo e blocado**: grid full-bleed, primitivas (`BlockGrid`/`FullBleed`/`SceneScrub`), regra "sem container visual" |
| `Spec/02-motion.md` | motion **sutil e com delay**, reveal sequencial (um conteúdo por vez), reduced-motion |
| `Spec/03-copy.md` | enxugar copy, budget por seção, "cada número tem fonte", glossário, sem travessão |
| `Spec/04-sections.md` | critério de aceite por seção + decisões pendentes (D1–D4) |

> **Etapa #1 do PRD:** entregar **uma seção** (Hero) como prova de estilo e
> aprová-la antes de propagar para o resto. Não redesenhar tudo de uma vez.

## Stack

- **Vite+** via `bun run` (o binário `vp` não está no PATH):
  `bun run dev` · `bun run build` · `bunx vp check --fix` · `bun run preview`.
  Dev em `http://localhost:5173/`.
- **React 19**, **Tailwind v4** (config no CSS), **shadcn/ui**
  (`bunx shadcn@latest add <nome> --yes`), **motion**. Alias `@/` → `src/`.

## Topologia (3 repos)

| Repo | Papel |
| --- | --- |
| `Karagua/` (este) | o site: código, `src/style.css` (tokens), `Spec/` (contrato) |
| `karagua-context/` | verdade de marca: `context/*.md`. **Toda copy e todo número saem daqui** |
| `karagua-design-system/` | DS: `DESIGN.md`, `PRODUCT.md` (register=brand), contexto do gate |

> A skill `impeccable` mora na pasta global de skills (`~/.claude/skills/impeccable/`),
> registrada como `/impeccable`. O `PRODUCT.md`/`DESIGN.md` do gate seguem no DS.

## Rodar o `impeccable`

1. **Contexto** (o gate `product` só passa apontando pro DS; verificado):

   ```bash
   IMPECCABLE_CONTEXT_DIR=/Users/lucasmelo/Desktop/Projetos/karagua-design-system \
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

# PRD — Redesign "Amplo & Blocado" da Landing Karaguá

> **⚠️ SUPERSEDIDO em 2026-07-06 pelo `Spec/PRD-v2.md`** (decisão DT1: a narrativa
> V3 em produção é a fonte de verdade; ver tabela de decisões travadas no v2).
> Este documento fica como registro histórico; não guia mais implementação.

> **Status:** Superseded · **Versão:** 1.0 · **Data:** 2026-05-25
> **Owner de design:** skill `impeccable` (register: brand)
> **Repo alvo:** `Karagua/` · **Fonte de conteúdo:** `karagua-context/context/`

---

## 1. Resumo executivo

A landing atual entrega a tese certa ("o manguezal é um ativo climático,
cada número tem uma fonte") em uma **embalagem errada**: tudo confinado a uma
coluna central (`max-w-6xl`), e cada bloco de conteúdo encapsulado num **card
arredondado com borda** (`rounded-md border bg-k-elevated`). O resultado é
estreito, repetitivo e visualmente tímido para um produto que vende confiança
institucional.

Este redesign reconstrói a **camada de layout, motion e copy** para um sistema
**amplo e blocado**: grid modular full-bleed (linhas de grade visíveis no lugar
de cards), tipografia display conduzindo a estrutura, fotografia pontual
sangrando até a borda, copy enxuta em fragmentos editoriais, e seções pesadas
quebradas em **revelações sequenciais** (um conteúdo por vez, conduzido pelo
scroll).

O sistema visual base (tokens, escala de tipo, easings, focus ring em
`src/style.css`) **é preservado**. Muda a composição, não a paleta.

## 2. Problema

| # | Problema atual | Evidência |
| --- | --- | --- |
| P1 | Largura travada em `max-w-6xl` centralizado em toda seção | `section.tsx:59` |
| P2 | Container visual (card com borda) é o padrão default de agrupamento | `problema.tsx`, `pillars.tsx`, `carbono-azul.tsx`, `guardioes.tsx` |
| P3 | Copy densa: parágrafos longos repetidos em grids de cards | todas as seções |
| P4 | Seções pesadas despejam todo o conteúdo de uma vez (stagger único) | `karagua-vivo.tsx`, `carbono-azul.tsx` |
| P5 | Números sem fonte no Hero (380 ha, R$1.2M, 8.000 ha, 400+) | `hero.tsx:7-12` |
| P6 | Travessões em copy e subject de mailto | `pillars.tsx:46`, `cta-final.tsx:28` |

## 3. Objetivos

1. **Amplo:** o conteúdo respira a largura do viewport. Fim da coluna única
   como default. Profundidade vem da troca de superfície, não de borda de card.
2. **Blocado:** estrutura modular em grid com **linhas de grade hairline**
   visíveis (ref 1). Células podem ser vazias (ritmo), tipográficas, de dado ou
   de mídia. Zero card arredondado como recipiente de conteúdo.
3. **Copy enxuta:** cada seção tem um *budget* de palavras. Manchete fragmento,
   corpo curto, detalhe revelado progressivamente.
4. **Motion sequencial:** seções de muito conteúdo viram cenas que montam **um
   item por vez** com o scroll (sticky-scrub), sempre interpolação linear, sem
   spring, com estado final estático sob `prefers-reduced-motion`.
5. **Honestidade preservada:** todo número renderizado tem fonte inline
   (padrão `DataPoint`). Nenhum número sem origem em `karagua-context/`.

## 4. Não-objetivos (out of scope)

- Trocar paleta, fontes ou tokens do DS (`src/style.css` intocado, salvo adição
  de utilitários de grid/gutter documentados no Spec 01).
- Mudar a tese, o funil B2B ou a ordem narrativa das seções sem aprovação.
- Reescrever os componentes shadcn (`components/ui/`).
- Construir o Mapa interativo ou Roadmap dinâmico nesta passada (a página `/mapa`
  segue como está; decisões em `04-sections.md`).
- Internacionalização (PT-BR permanece único idioma).

## 5. Princípio de design (norte)

> **Largura é confiança. Espaço vazio é intencional. O número manda na
> composição, e o número tem fonte.**

Inspiração visual (`refs/1.png`, `2.png`, `3.png`): grade modular visível,
manchetes display finas ocupando células do grid, foto full-bleed com texto
sobreposto, dado em mono, ausência total de cards arredondados decorativos.

> Nota: as refs usam travessão em copy. **Nós não.** O guardrail do DS vence a
> referência (vírgula, dois-pontos, ponto-e-vírgula, parênteses).

## 6. Escopo por seção

| Ordem | Seção | Arquivo | Padrão alvo | Ref |
| --- | --- | --- | --- | --- |
| 1 | Hero | `hero.tsx` | Full-bleed foto (mangue) + grid de stats com fonte | 1, 3 |
| 2 | Problema | `problema.tsx` | BlockGrid tipográfico, 4 blocos sem card | 1 |
| 3 | Karaguá Vivo (4 fases) | `karagua-vivo.tsx` | SceneScrub: uma fase por vez | 2 |
| 4 | Solução (3 pilares) | `pillars.tsx` | BlockGrid de 3 colunas full-bleed | 1 |
| 5 | Base legal | `methodology-block.tsx` | Lista blocada full-bleed, surface contraste | — |
| 6 | Impacto (4 dim.) | `carbono-azul.tsx` | SceneScrub de dados + dimensões | 2 |
| 7 | Para empresas | `guardioes.tsx` | Split full-bleed, painel comercial sem card | 2 |
| 8 | CTA final | `cta-final.tsx` | FullBleed foto + manchete display | 3 |
| — | Section primitive | `section.tsx` | Suporte full-bleed/blocado (Spec 01) | — |

Detalhes e critérios de aceite por seção: `04-sections.md`.

## 7. Fases de entrega

> **Etapa #1 (gate de estilo):** antes de qualquer fundação ampla, entregar
> **uma única seção** (Hero) no estilo alvo para o dono validar que o estilo foi
> de fato compreendido (amplo, blocado, sem container, copy enxuta, motion
> sutil). Só após o "ok" o redesign propaga.

1. **Fase 0 — Fundação (Spec 01 + 02):** motion calmo já aplicado em
   `lib/motion.ts`; primitivas `BlockGrid`, `FullBleed`, `SceneScrub`;
   utilitários de grid/gutter no CSS; `Section` ganha modo full-bleed.
2. **Fase 1 — Hero (prova de estilo, Etapa #1):** redesenha o Hero no padrão
   alvo. **Validação do usuário antes de propagar.**
3. **Fase 2 — Seções tipográficas:** Problema, Solução, Base legal.
4. **Fase 3 — Seções scrub:** Karaguá Vivo, Impacto.
5. **Fase 4 — Conversão:** Para empresas, CTA final.
6. **Fase 5 — Polish:** `impeccable polish` global, `audit` de a11y/perf,
   auditoria de honestidade (cada número ↔ fonte), `vp check --fix` + `vp build`.

Cada fase fecha com `vp check --fix && vp build` verdes.

## 8. Métricas de sucesso (objetivas)

- [ ] **0** cards arredondados com borda usados como recipiente de conteúdo
      (`rounded-md border` em bloco de conteúdo) na home.
- [ ] **0** ocorrências de travessão em copy (`rg "—" src/components` limpo).
- [ ] **100%** dos números renderizados têm fonte inline rastreável a
      `karagua-context/`.
- [ ] Hero e ≥1 seção usam composição **full-bleed** (largura total do viewport).
- [ ] ≥2 seções de conteúdo pesado usam **reveal sequencial** (um item por vez).
- [ ] Redução de copy: corpo de cada seção dentro do budget do `03-copy.md`.
- [ ] `vp build` verde; Lighthouse a11y ≥ 95; sem regressão de `prefers-reduced-motion`.
- [ ] Contraste AA mantido (texto primário ≥ 12:1 em shell; texto sobre foto com
      scrim ≥ 4.5:1).

## 9. Riscos & mitigação

| Risco | Mitigação |
| --- | --- |
| Acervo de fotos limitado (só `mangue.*` + 1 PNG) | Direção **híbrida**: foto só em Hero + CTA; sourcing de fotos do manguezal/Babitonga vira item de roadmap (não bloqueia Fase 1-4) |
| Full-bleed quebra leitura de prosa longa | Prosa longa mantém `.measure` (70ch) dentro da célula; full-bleed é para manchete/mídia/dado |
| Scrub conflitar com `prefers-reduced-motion` | `SceneScrub` renderiza estado final estático sob `useReducedMotion` (Spec 02) |
| Drift do DS (cor/borda/sombra fora do token) | `impeccable` + guardrails do `CLAUDE.md` mandam; PR não passa se violar |

## 10. Dependências e fonte de verdade

- **Conteúdo/copy/números:** `karagua-context/context/*.md` (brandbook, business
  plan, roadmap, metodologia, base legal, FAQ).
- **Tokens visuais:** `src/style.css` (não alterar paleta).
- **Skill de execução:** `impeccable`, instalada na pasta global
  (`~/.claude/skills/impeccable/`); contexto do gate em `karagua-design-system/`.
- **Specs irmãs:** `01-design-system-blocado.md`, `02-motion.md`, `03-copy.md`,
  `04-sections.md`.

## 11. Definição de pronto (DoD) do redesign

Todas as métricas da seção 8 verdes, as 8 seções migradas para o padrão
blocado/amplo, `impeccable polish` e `audit` executados, e o usuário aprovou
visualmente Hero (Fase 1) e o conjunto final.

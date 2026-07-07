# Spec 04 — Critérios por seção (re-baseline V3, 2026-07-06)

> **Re-baseline (DT1, PRD v2 §4):** a narrativa V3 em produção é a fonte de
> verdade. O lineup abaixo é o do `App.tsx`; as seções do contrato antigo que
> nunca entraram (Solução/pillars, Base legal/methodology-block,
> Impacto/carbono-azul, Para empresas/guardioes) foram **descartadas e os
> componentes órfãos deletados**. A versão anterior deste spec (com checkboxes
> que não refletiam o código, ex. "hero com big numbers" que nunca existiu)
> está no histórico git.

Convenção: **Layout** · **Motion** (Spec 02) · **Copy** (Spec 03) · **Aceite**.

Regras transversais (decisões DT):
- **DT2:** zero hairline de grade e zero card arredondado com borda como
  recipiente. Separação é **espaço** e **troca de superfície**.
- **DT4 + Spec/02 §7:** cada seção declara `data-theme` (light/dark); transição
  de superfície de 650 ms na costura; scroll-fade global do Section revogado.
- **Fontes de números:** mantidas como dado no código (prop `sources` do
  DataPoint) e rastreáveis a `karagua-context/`; **não renderizadas na UI**
  (decisão do dono, 2026-07-06, pós Fase 0).
- Sem travessão em copy renderizada nem em subjects de mailto.

---

## Lineup V3 (ordem do `App.tsx`)

| # | Seção | Arquivo | id | Status |
|---|-------|---------|----|--------|
| 1 | Hero | `hero-v3.tsx` | `topo` | só H1 (DT3) ✅ |
| 2 | Problema | `problema.tsx` | `problema` | ✅ (stats com sources em código) |
| 3 | Diferencial | `diferencial.tsx` | `diferencial` | ✅ |
| 4 | Karaguá Vivo | `karagua-vivo.tsx` | `como-funciona` | timeline; SceneScrub previsto (Fase 4) |
| 5 | Impacto | `impacto-comunidade.tsx` | `impacto` | seletor por clique → **SceneScrub (DT7, Fase 4)** |
| 6 | Equipe | `equipe.tsx` | `equipe` | blocos hard-edge ✅ |
| 7 | Pioneirismo | `pioneirismo.tsx` | `pioneirismo` | ✅ |
| 8 | Marquee | `marquee.tsx` | — | ✅ |
| 9 | Portas | `portas.tsx` | `portas` | blocos hard-edge ✅; único scrub ativo |
| 10 | Laboratório CTA | `laboratorio-cta.tsx` | `laboratorio` | ✅ |
| 11 | CTA final | `cta-final.tsx` | `contato` | foto full-bleed prevista (Fase 4, DT8: acervo atual) |

## Critérios por seção

### 1. Hero — `hero-v3.tsx`
- **Layout:** split H1 display (Thin + Bold `k-bright`) à esquerda, pixel-beam à
  direita. **Só o H1** (DT3): sem eyebrow, corpo, nota ou botões.
- **Motion:** maskRise no H1; pixel-beam pausa fora do viewport e vira logo
  estática sob reduced-motion.
- **Aceite:**
  - [x] Nenhum texto além do H1; navegação é o scroll.
  - [x] Canvas não roda RAF fora do viewport.

### 2. Problema — `problema.tsx`
- **Layout:** split foto (WebP responsivo `<picture>`) + lista numerada e faixa
  de 3 stats. Sem hairline entre itens (DT2).
- **Copy:** "até 8.000 ha" com fonte externa real (Pro Babitonga; CEPSUL/ICMBio)
  na prop `sources`.
- **Aceite:**
  - [x] Imagem <320 KB por variante, com fallback JPEG.
  - [x] Stats com `sources` rastreáveis (não renderizadas).

### 3-11. Demais seções
Mantêm o comportamento V3 aprovado, com as regras transversais aplicadas
(hairlines removidas em diferencial, impacto, laboratório, cta-final, marquee;
cards → blocos hard-edge em equipe e portas). Mudanças previstas:
- **Impacto (DT7):** migrar seletor por clique para SceneScrub na Fase 4;
  estático empilhado sob reduced-motion; junto com Portas esgota o orçamento de
  2 scrubs.
- **Karaguá Vivo:** ganha SceneScrub com contador 01/04 na Fase 4.
- **CTA final:** foto full-bleed com scrim ≥4.5:1 na Fase 4, usando o acervo
  atual (DT8).

---

## Decisões (travadas em 2026-07-06, ver PRD v2 §4)

| # | Decisão | Resolução |
| --- | --- | --- |
| D1 | Methodology Block | Morta: componente descartado por DT1 |
| D2 | Impacto: SceneScrub ou reveal | **SceneScrub** (DT7) |
| D3 | Fontes das stats do Hero | Morta: hero sem stats (DT3) |
| D4 | Sourcing de fotos | **Acervo atual + direção tipográfica** (DT8) |

## Ordem de execução (PRD v2 §9)

Fase 3 (PoC inversão de tema, gate visual) → Fase 4 (propagação: tema em todas
as costuras, SceneScrub Impacto/Karaguá Vivo, CTA final full-bleed, presets de
display, footer Wide).

Cada fase fecha com `tsc --noEmit` + `vp build` verdes e, nas seções com motion,
verificação manual de `prefers-reduced-motion`.

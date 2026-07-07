# Spec 02 — Motion: reveal sequencial

> Objetivo central do redesign: **seções de muito conteúdo se dividem em cenas
> animadas que mostram um conteúdo por vez.** Sempre dentro das leis de motion
> do DS (`CLAUDE.md` §4): só `transform`/`opacity`, ease-out exponencial, 150 a
> 300ms, sem bounce/spring/elastic, `prefers-reduced-motion` respeitado por JS e CSS.

## 0. Calma é regra (timing e sutileza)

Feedback do dono: motion atual **causa ansiedade**, não leveza. Muitas
animações disparam no instante em que o elemento toca a **borda inferior** da
tela, em cascata. Corrigir com três alavancas (já aplicadas em `lib/motion.ts`):

1. **Disparar depois, não na borda.** O `reveal` usa
   `viewport.margin: "0px 0px -18% 0px"`: a linha de disparo sobe ~18%, então o
   elemento anima **depois** de estar confortavelmente em tela, não ao surgir.
2. **Deslocamento pequeno + duração gentil (sutil).** `fadeUp` usa `y: 12` e
   `duration: 0.5` (antes 16 / 0.3). `maskRise` usa `0.6`. Movimento discreto,
   nunca brusco.
3. **Sequência com respiro (delay).** `stagger` usa `delayChildren: 0.12` e
   `staggerChildren: 0.12`: a seção entra em sequência calma, um item após o
   outro, em vez de tudo ao mesmo tempo.

Regra prática: se ao rolar a página a sensação for de "tudo se mexendo de uma
vez", o timing está errado. O alvo é **leveza**: poucos elementos, entrando
suaves, com folga entre eles.

## 1. Vocabulário de motion

Reutilizar os helpers existentes em `src/lib/motion.ts` (não recriar). Valores
calmos já aplicados (`fadeUp` y:12/0.5s · `stagger` delay+espaço 0.12 ·
`maskRise` 0.6s · `reveal` margin -18%):

| Helper | Uso |
| --- | --- |
| `fadeUp` | entrada de bloco (y:16→0, opacity) |
| `fadeIn` | entrada suave sem deslocamento |
| `stagger` | orquestra filhos (0.08s) |
| `maskRise` | manchete que sobe atrás de clip `overflow-hidden` |
| `reveal` | `whileInView` once, amount 0.3 |
| `EASE_OUT_QUART` | curva padrão `[0.25,1,0.5,1]` |

## 2. Três modos de motion (quando usar cada um)

| Modo | Quando | Como |
| --- | --- | --- |
| **Reveal-on-view** | seções leves (1 manchete + poucos blocos) | `{...reveal}` + `stagger`/`fadeUp`. Já é o padrão atual; mantém. |
| **SceneScrub** | seções pesadas (Karaguá Vivo 4 fases, Impacto) | uma cena por faixa de `scrollYProgress`; conteúdo monta um por vez |
| **Parallax contido** | profundidade sutil em mídia full-bleed | `y` de poucos px via `useTransform` linear (como `carbono-azul` antigo) |

> A manchete de seção continua via `SectionHeader` (maskRise sob o `stagger` do
> pai). **Não** dar `whileInView` próprio à manchete (trava em `hidden`,
> conflito de orquestração documentado no `CLAUDE.md`).

## 3. SceneScrub — contrato de comportamento

Generaliza o sticky-scrub embutido em `methodology-block.tsx`.

```
section.h-[N*100vh]
└─ div.sticky.top-0.min-h-screen        (o "palco")
   └─ cena[ativa] = floor(scrollYProgress * nCenas)
```

- **Uma cena visível por vez.** A transição entre cenas é crossfade curto
  (`opacity` + `y` pequeno), conduzido por `useTransform` **linear** sobre
  `scrollYProgress`. Sem `useSpring` em nenhum binding de scroll.
- **Progresso → índice:** mapear faixas iguais de progresso para cada cena;
  dentro da faixa, a cena entra (0→1), segura (1), e sai (1→0) por interpolação
  linear.
- **Altura da seção:** `~100vh por cena` (ex.: 4 fases → `h-[400vh]`). Ajustar
  para dar tempo de leitura sem rolagem longa demais.
- **Indicador de progresso opcional:** trilho/contador (`01 / 04`) em mono,
  derivado do mesmo progresso. Sem barra colorida grossa.

### Reduced motion (obrigatório, decidido por JS)

```tsx
const reduce = useReducedMotion();
if (reduce) return <SceneScrubStatic scenes={scenes} />; // blocos empilhados
```

- Sob `prefers-reduced-motion`, **não** prende ao scroll: renderiza todas as
  cenas como blocos estáticos empilhados (BlockGrid), na ordem.
- Nada de estado intermediário preso ao scroll quando reduzido.

### Critérios de aceite — SceneScrub

- [ ] Exatamente uma cena dominante por faixa de progresso.
- [ ] Só `transform`/`opacity` animados (zero width/height/padding/top).
- [ ] `useTransform` linear; busca por `useSpring` em src vazia para scroll.
- [ ] Versão estática sob reduced motion, validada com a flag do SO ligada.
- [ ] Funciona com teclado/scroll nativo (não sequestra o scroll).

## 4. Orçamento de motion por seção

| Seção | Modo | Notas |
| --- | --- | --- |
| Hero | Reveal + parallax leve na foto | manchete maskRise; stats fadeUp em stagger |
| Problema | Reveal-on-view | 4 blocos entram em stagger |
| Karaguá Vivo | **SceneScrub** (4 cenas) | uma fase por vez |
| Solução | Reveal-on-view | 3 blocos |
| Base legal | Reveal-on-view | lista entra em stagger |
| Impacto | **SceneScrub** (4 cenas) ou reveal | dado + dimensão por vez |
| Para empresas | Reveal-on-view | split entra em duas colunas |
| CTA final | Reveal + parallax leve | manchete display sobre foto |

Regra: **no máximo 2 seções SceneScrub** na página (Karaguá Vivo + Impacto),
para não transformar a home num carrossel de scroll.

## 5. Performance e qualidade

- Animar somente `transform`/`opacity`; `will-change` só quando medido.
- `viewport={{ once: true }}` em reveals (não re-animar ao voltar).
- Imagens de cena com `loading="lazy"` exceto a do Hero (`eager`/preload).
- Sem layout thrash: medir com DevTools Performance que não há recalculo de
  layout durante o scrub.

## 6. Checklist global de motion

- [ ] `<MotionConfig reducedMotion="user">` segue envolvendo o app (`App.tsx`).
- [ ] CSS global de reduced motion intacto (`style.css:283`).
- [ ] Nenhum `transition`/`animation` em `width`, `height`, `padding`, `margin`.
- [ ] Durations entre 150 e 300ms (scrub usa progresso, não duration).
- [ ] Easings só ease-out-quart/expo/quint.

## 7. Transição de superfície (tema por scroll) — emenda 2026-07-06 (DT4)

Decisão do dono (PRD v2, tabela DT): inversão **binária** de tema entre seções,
mecânica Basic Agency.

1. A cor de fundo/texto da página é propriedade de um **wrapper único**; seções
   declaram `data-theme="light" | "dark"`, nunca cor hardcoded.
2. Gatilho: a seção que contém a **linha central do viewport** define o tema
   (IntersectionObserver com `rootMargin: "-50% 0% -50% 0%"`). O swap é
   discreto; a suavização é 100% CSS:
   `transition: background-color .65s cubic-bezier(.72,0,.28,1), color .65s ...`.
3. Header, ScrollRail e `::selection` consomem as **mesmas variáveis** com o
   mesmo timing (sincronia por token, não por JS coordenado). Proibido
   `mix-blend-mode: difference` no header.
4. Interpolação contínua (scrub) de cor: exceção, máximo 2 costuras por página,
   registradas aqui.
5. Sob `prefers-reduced-motion`: a troca de tema **permanece** (é informação
   semântica), instantânea.
6. **Revoga o scroll-fade global do `Section`** (opacity/y por scroll em toda
   seção): incompatível com a transição de superfície e nunca especificado.
7. Exceção de duração nomeada: a transição de superfície usa **650 ms** (fora da
   régua de 150-300 ms do checklist §6, que segue valendo para microinterações).

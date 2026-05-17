# Karaguá — Frontend (Landing Page)

Single-page landing para o projeto **Karaguá** ("O Estuário"): restauração de
estuário com lastro de carbono verificável. Princípio do produto e do design:
**cada número tem uma fonte**.

## Stack

- **Vite+** (`vp`) — toolchain unificado. Não use `npm`/`vite` direto.
  - `vp dev` · `vp build` · `vp check --fix` (fmt + lint + typecheck) · `vp preview`
  - Gestor de pacotes: **bun** (`bun add`, `bun install`).
- **React 19** + `@vitejs/plugin-react`
- **Tailwind CSS v4** via `@tailwindcss/vite` (config no CSS, sem `tailwind.config`)
- **shadcn/ui** (estilo `radix-nova`, base `radix-ui`, ícones `lucide-react`)
  - Adicionar componente: `bunx shadcn@latest add <nome> --yes`
- **motion** (sucessor do framer-motion) para animação
- Alias `@/` → `src/`

## Estrutura

```
src/
  App.tsx                 # compõe as seções, MotionConfig reducedMotion="user"
  main.tsx                # React root
  style.css               # tokens do DS (fonte da verdade visual)
  lib/utils.ts            # cn()
  lib/motion.ts           # fadeUp / fadeIn / stagger / reveal / maskRise
  components/ui/          # shadcn (gerado — não estilizar por fora sem motivo)
  components/lp/          # seções da landing
public/fonts/             # Aileron .woff2 (ver README lá)
```

---

# Karaguá Design System v3.0 — Regras

`src/style.css` já implementa todos os tokens abaixo. **Sempre** consuma via
utilitário Tailwind / variável CSS; nunca hardcode hex em componente.

## 1. Cor

Uma única cor de marca em três tons. Coral e positive são **sinais
semânticos**, nunca decoração.

| Token util.  | Var CSS                        | Hex     | Uso                                                     |
| ------------ | ------------------------------ | ------- | ------------------------------------------------------- |
| `k-bright`   | `--k-color-green-karagua`      | #c7d926 | Só em superfície escura; ≤3% de área; display ≥3rem     |
| `k-mid`      | `--k-color-green-karagua-dark` | #adbc25 | Press/active em superfície escura                       |
| `k-deep`     | `--k-color-green-karagua-deep` | #828e1a | **Workhorse**: botões primários, links, ênfase de corpo |
| `k-shell`    | `--k-color-surface-shell`      | #F7F5F0 | Superfície padrão da página (**nunca `#FFFFFF`**)       |
| `k-fog`      | `--k-color-surface-fog`        | #EBE8E2 | Hover, linhas alternadas                                |
| `k-elevated` | `--k-color-surface-elevated`   | #FBF9F4 | Cards sobre shell, painéis de modal                     |
| `k-carbon`   | `--k-color-surface-carbon`     | #1A2332 | Seções invertidas, methodology                          |
| `k-ink`      | `--k-color-text-primary`       | #2C3E50 | Corpo (≥12:1 sobre shell)                               |
| `k-ink-soft` | `--k-color-text-secondary`     | #6B7B8D | Legendas, labels                                        |
| `k-coral`    | `--k-color-coral`              | #E85D4A | **Só** erro / ação destrutiva                           |
| `k-positive` | `--k-color-positive`           | #27AE60 | **Só** sucesso / crédito verificado                     |

A camada semântica do shadcn (`bg-background`, `text-foreground`, `bg-primary`,
`bg-card`, `border-border`...) já está mapeada para esses tokens. Tema **light
é o primário** (shell-first). A classe `.dark` reescreve para a superfície
**carbon** e libera `k-bright` como `primary` — use `.dark` em qualquer seção
invertida (nav, methodology, footer).

**Disciplina:** verde brilhante é teto de ~3% de área (≤10% somando os três
tons). Em superfície clara, ênfase de marca = `k-deep`, nunca `k-bright`.

## 2. Tipografia

Duas famílias, só. Hierarquia vem do **contraste de peso** (Thin 100 ↔ Bold
700), nunca de uma terceira família.

- **Aileron** (`font-sans`, padrão) — auto-hospedada, ver `public/fonts/`.
- **JetBrains Mono** (`font-mono` / `.font-data`) — **exclusiva** para números
  verificáveis, coordenadas, citações. Nunca texto de corpo.

Escala (use as classes `text-*`, já trazem line-height/tracking do DS):

| Classe          | Tamanho              | Peso esperado               | Contexto                           |
| --------------- | -------------------- | --------------------------- | ---------------------------------- |
| `text-display`  | clamp(56→120px)      | `font-thin`                 | Hero, capa                         |
| `text-headline` | clamp(34→48px)       | `font-bold`                 | Título de seção                    |
| `text-title`    | 24px                 | `font-semibold`             | Título de card                     |
| `text-body`     | 17px                 | `font-normal`               | Leitura (cap 65–75ch → `.measure`) |
| `text-label`    | 13px, tracking .12em | `font-semibold` `uppercase` | Eyebrow institucional              |
| `text-data`     | 15px                 | `font-normal` `font-mono`   | Números verificáveis               |

Corpo longo: aplicar `.measure` (max 70ch).

## 3. Forma e profundidade

- **Radius**: 4–8px, afiado. `rounded-md` (4px) padrão; `rounded-lg` (6px),
  `rounded-xl` (8px). Pílula/`rounded-full` **só** no componente Switch.
- **Flat em repouso**: sem sombra de descanso. Sombra aparece **só** como
  resposta a estado (hover/focus) ou overlay real (modal/drawer). Profundidade
  primária é **tonal** (trocar de superfície: shell → fog → elevated → carbon).
- **Focus ring** (já global em `:focus-visible`): 3px, `--ring` (k-bright) @
  40% alpha, offset 2px. Não remover outline sem repor equivalente.

## 4. Movimento

- Helpers em `@/lib/motion`: `fadeUp`, `fadeIn`, `stagger`, `reveal`,
  `maskRise`, `EASE_OUT_QUART`.
- Easing: **ease-out-quart** padrão (`cubic-bezier(0.25,1,0.5,1)`). Vars CSS:
  `--ease-out-quart`, `--ease-out-expo`, `--ease-out-quint`.
- Duração 150–300ms. Anima **só** `transform` e `opacity`.
- `<MotionConfig reducedMotion="user">` envolve o app; CSS também zera animações
  sob `prefers-reduced-motion`. Não burlar.

### Scroll-linked (cinematográfico contido)

- Permitido: `useScroll` + `useTransform` com mapeamento **linear**
  (interpolação posição→valor).
- **Proibido `useSpring`** em qualquer binding de scroll — física de mola
  viola o DS (sem bounce/spring/elastic), mesmo em scroll.
- Padrões prontos:
  - Mask reveal de headline — clip `overflow-hidden` no próprio `h1`/`h2`
    com `motion.span variants={maskRise}` conduzido pelo **stagger da seção**.
    Não usar `whileInView` próprio: aninhado sob o `stagger`/`reveal` do pai
    ele entra em conflito de orquestração e o título trava em `hidden`. Ver
    `hero.tsx` e `SectionHeader` em `section.tsx`.
  - Sticky-scrub — seção alta + filho `sticky`; conteúdo monta conforme
    `scrollYProgress` (ver `methodology-block.tsx`).
  - Parallax — deslocamento `y` de poucos px por `useTransform` linear,
    amplitude contida (ver `carbono-azul.tsx`).
- Reduced motion: **JS também** decide (`useReducedMotion`), não só o CSS.
  Toda seção scroll-linked renderiza o **estado final estático** sob
  `prefers-reduced-motion`. Sem estado intermediário preso ao scroll.

## 5. Componente assinatura — Methodology Block

`components/lp/methodology-block.tsx`. Aparece em **toda página com alegação
quantitativa** — é a materialização de "cada número tem uma fonte".

- Superfície **carbon** (`.dark`), eyebrow Thin + headline Bold.
- Footer = 4 data points em `font-mono`, accent `k-bright`.
- **Sempre** os 4: Método, Amostra (n), Sobrevivência, Permanência de buffer.

## 6. Guardrails

**Faça**

- Shell como superfície padrão; profundidade por troca tonal de superfície.
- Pareie cor com forma/ícone/texto — cor nunca sozinha comunica estado.
- Tap target ≥44px no mobile (`size="lg"` nos botões de ação).
- WCAG 2.2 AA; texto primário ≥12:1 sobre shell; foco ≥3:1.

**Não faça**

- Sem `#FFFFFF` como fundo; sem segunda cor de marca.
- Sem `k-bright`/coral/positive como decoração ou gradiente "greenwash".
- Sem stripe colorida (`border-left/right` > 1px).
- Sem gradiente em headline (`background-clip:text`).
- Sem glassmorphism por padrão (opt-in explícito).
- Sem bounce/spring/elastic; sem animar width/height/padding.
- Sem terceira família tipográfica; mono só para dado verificável.
- Modal não é a primeira solução — esgote alternativas inline.
- **Sem travessão (em dash) em copy** — use vírgula, ponto-e-vírgula, ponto ou
  parênteses.

## Validação

Antes de concluir qualquer mudança: `vp check --fix` e `vp build`.

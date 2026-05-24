# Evidence — Karaguá LP

## Structural

- **Interactive elements:** 12 (App.tsx:40 logo, App.tsx:43 hamburger, hero.tsx:37/40 CTAs, cta-final.tsx:23/29 mailto, footer links).
- **Max nesting depth:** 9 níveis (dentro do AnimatePresence do hamburger em App.tsx:42-77).
- **Repeated patterns:**
  - Logo+#topo aparece 4x: App.tsx:40, footer.tsx:28, site-nav.tsx:27 e 80.
  - "Comprar carbono azul" duplicado: hero.tsx:37 e cta-final.tsx:25.
  - Nav links duplicados desktop/mobile dentro de site-nav.tsx:33 e 85.
- **Dead code:** `SiteNav` (site-nav.tsx:16) exportado mas **nunca importado** — App usa `Sidebar`.
- **Section order:** Hero → Problema → KaraguaVivo → Pillars → MethodologyBlock → CarbonoAzul → Guardioes → Eventos → Roadmap → Mapa → CtaFinal.
- **Headings:** 1 H1 (hero.tsx:24), 11 H2 (via section.tsx:59 SectionHeader), 11 H3 (cards). Hierarquia limpa.

## Visual (INFERRED — sem dev server)

- **Spacing scale:** 8px base, seções 112–144px (py-28 padrão + hero py-32/36).
- **Type scale:** display/headline/title/body/label/data — todos em uso, hierarquia por peso (thin↔bold).
- **Color tokens usados:** 9/11 (`k-mid`, `k-coral`, `k-positive` não aparecem — semânticos sem state). `k-bright` ~1.5–2% da área (regra ≤3%: PASS). Combinado ~3.5–4.5% (regra ≤10%: PASS).
- **Contraste crítico:** `text-foreground/55` em methodology-block.tsx:73 ≈ 3:1 sobre k-elevated — **abaixo de AA**.
- **States:** focus global (style.css:263–266 PASS), hover em links/botões, disabled/loading/error/empty **N/A** na LP estática (mapa.tsx:19 é placeholder textual, não state de design).
- **Inconsistências:** grid-separator pattern (gap-px+bg-border) usado em problema/eventos/roadmap mas não em carbono-azul/pillars. Padding p-6 vs p-8 misto. 4 níveis de opacity de texto (/100, /75, /70, /55).
- **Motion:** todos os scroll-linked patterns LINEARES (sem spring). `useReducedMotion` honrado em methodology-block, carbono-azul, loader, cursor. CSS + MotionConfig dupla cobertura.

## Copy & Honesty

- **Números sem fonte:** "5×" (problema.tsx:23), "365" (problema.tsx:30), "50–66%" (pillars.tsx:10), "60" voluntários (eventos.tsx:6), "UDESC"/"Mudas" sem números (eventos.tsx:7-8). Nenhum aponta para fonte na própria página, violando o princípio fundador.
- **Inflations:** "alta integridade" 8x sem definição operacional única. "auditável" 7x sem doc de auditoria. "um dos sumidouros mais densos do planeta" sem citação científica.
- **Jargon não-expandido:** MRV (3x), CONAMA 357/2005, PSA (3x), RCGI-USP Carbon Registry — visitante não-especialista não decodifica inline.
- **Label↔behavior mismatch:** "Ver a metodologia" (hero.tsx:40) aponta para `#carbono-azul`, mas a seção real é `#metodologia`. "Comprar carbono azul" abre `mailto`, não fluxo de compra.
- **Placeholders shipados:** Mapa promete "tempo quase real" (mapa.tsx:9-11) mas renderiza `[ mapa interativo — integração pendente ]` (mapa.tsx:19). Roadmap inteiro placeholder (roadmap.tsx:5 comment + linha 28 copy). Methodology-block com `—` em Cobertura e Permanência (methodology-block.tsx:20-21).
- **Travessões em copy:** mapa.tsx:20, methodology-block.tsx:20/21/74/115, cta-final.tsx:23 (subject mailto). DS proíbe em copy (CLAUDE.md:158).
- **Dark patterns:** nenhum. CTAs honestos, sem urgência/scarcity/forced-continuity.

## Weight & Friction

- Bundle: **384.60 kB JS** (gzip 122.07 kB), **49.74 kB CSS** (gzip 9.10 kB), build em 534ms (dev box).
- Idle motion: nenhuma livre. Cursor ativo só `pointer:fine` e sem reduced-motion. Loader roda 1x na sessão (~2.8s).
- Modais/notif/badges idle: 0.
- prefers-reduced-motion: respeitado em CSS + JS.

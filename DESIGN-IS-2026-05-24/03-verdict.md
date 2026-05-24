# Verdict — Karaguá LP

**REDESIGN (escopo: camada de conteúdo + poda estrutural).** Total 19/30 (abaixo do limiar de 20); o sistema visual (DS, tipografia, motion, surfaces) está saudável e DEVE ser preservado, mas o projeto entrega uma LP cuja tese fundadora ("cada número tem uma fonte") é violada na própria home — números sem fonte, seções shipadas como placeholder, jargão B2B sem expansão e CTA com label↔behavior mismatch. A correção exige reconstruir a camada de conteúdo a partir do propósito, não refinar incrementalmente.

## Por que REDESIGN e não REFINE

Apesar do score 19 estar a 1 ponto do limiar, o eixo de falha é load-bearing (#4 understandable=1, #6 honest=1, #10 minimal=1) e atinge o princípio comercial central do produto: a confiança do comprador depende de poder auditar. Refinar essas seções uma por uma manteria o erro estrutural — shipar seções aspiracionais ao lado de seções com dado real. O redesign aqui é de **conteúdo+IA**, não de visual.

## Top 5 moves (com âncoras)

1. **#6 honest** — Remover ou contextualizar com fonte explícita TODO número da home: "5×" (problema.tsx:23), "365" (problema.tsx:30), "50–66%" (pillars.tsx:10), "60" (eventos.tsx:6). Cada um precisa de link/citação inline ou sai da página. Evidência: 01-evidence.md "Números sem fonte".

2. **#10 minimal** — Deletar `src/components/lp/site-nav.tsx` (dead code, nunca importado). Decidir Mapa e Roadmap: ou implementar de verdade nesta release, ou retirar da home até estarem prontos. Evidência: 01-evidence.md "Dead code" + "Placeholders shipados".

3. **#4 understandable** — Expansão inline de MRV (Monitoramento, Relato e Verificação), PSA (Pagamento por Serviços Ambientais), CONAMA 357/2005, RCGI-USP nas primeiras ocorrências. Corrigir "Ver a metodologia" → `#metodologia` (não `#carbono-azul`). Evidência: 01-evidence.md "Jargon" + "Label↔behavior mismatch".

4. **#2 useful** — Preencher os 2 campos "—" do methodology-block (Cobertura e Permanência) com valor + data + fonte, ou colapsar para 2 data points até existirem. Methodology como ativo de comprador exige completude. Evidência: methodology-block.tsx:20-21.

5. **#3 aesthetic** — Remover `text-foreground/55` (methodology-block.tsx:73 ≈ 3:1) e padronizar opacidade de texto secundário para `/70` ou `/75`. Eliminar 6 ocorrências de travessão em copy (DS proíbe — CLAUDE.md:158). Evidência: 01-evidence.md "Travessões em copy".

## Preservar (não tocar)

- `src/style.css` inteiro (DS tokens, scales, motion vars, focus ring).
- `src/components/lp/section.tsx` (primitives Section + SectionHeader).
- `src/lib/motion.ts` (helpers + EASE_OUT_QUART).
- Patterns scroll-linked: sticky-scrub em methodology, parallax em carbono-azul, maskRise em headlines.
- IA atual: ordem das seções faz sentido para o funil B2B.
- Loader, Cursor, Footer.

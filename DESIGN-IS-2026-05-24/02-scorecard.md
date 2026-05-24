# Scorecard — Karaguá LP

1. **Good design is innovative — 2/3**
   Evidence: methodology-block é uma escolha rara em LP B2B de carbono (publica método + amostra + permanência inline), mas as outras seções seguem patterns convencionais (hero+pilares+cards+cta).
   Justification: refresca um pattern existente com melhoria clara; não introduz nada inédito 5+ produtos.

2. **Good design makes a product useful — 2/3**
   Evidence: a primary task (entender→auditar→contatar) tem caminho claro Hero→Methodology→Carbono Azul→CtaFinal. Mas Mapa promete e não entrega, Roadmap é placeholder, methodology-block tem 2 campos "—".
   Justification: task completa, mas surface adjacente adiciona passos sem entrega.

3. **Good design is aesthetic — 2/3**
   Evidence: spacing/type/color obedecem a DS visível (style.css), `k-bright` disciplinado, type scale completa. Inconsistências: grid-separator não replicado em carbono-azul, p-6/p-8 misto, text-foreground/55 ~3:1 (01-evidence.md "Contraste crítico").
   Justification: ≤2 inconsistências menores; tie-breaker para baixo.

4. **Good design makes a product understandable — 1/3**
   Evidence: MRV/CONAMA 357/PSA/RCGI sem tradução inline (01-evidence.md "Jargon"). "Ver a metodologia" aponta para `#carbono-azul`, não `#metodologia`.
   Justification: 2–3 controles unclear + jargão denso para o visitante não-especialista.

5. **Good design is unobtrusive — 3/3**
   Evidence: chrome recua (header floating discreto, sidebar opt-in, cursor minimalista, surfaces tonais), conteúdo é figura.
   Justification: nenhum elemento de UI compete com a leitura.

6. **Good design is honest — 1/3**
   Evidence: 4+ números sem fonte na própria página (5×, 365, 50-66%, 60) contradizendo o princípio fundador "cada número tem uma fonte". "alta integridade" 8x sem definição. Mapa promete "tempo quase real" e mostra placeholder. Roadmap shipado como provisório.
   Justification: 2+ inflations com agravante de o projeto declarar honesty como tese central.

7. **Good design is long-lasting — 3/3**
   Evidence: sem glassmorphism, gradient, fad typography. Aileron Thin + JetBrains Mono + carbon-surface lê bem em 3 anos.
   Justification: nenhum marcador datado.

8. **Good design is thorough — 2/3**
   Evidence: focus ring global (style.css:263), reduced-motion duplo (CSS+JS), alt descritivo. Mas: empty-state do Mapa é texto placeholder (mapa.tsx:19), não state desenhado; methodology-block com 2 campos "—".
   Justification: 1 state rough (empty do Mapa).

9. **Good design is environmentally friendly — 2/3**
   Evidence: 384 kB JS (gzip 122 kB), motion gated, prefers-reduced-motion respeitado. Acima de 100 kB inicial.
   Justification: <500 kB com motion controlada.

10. **Good design is as little design as possible — 1/3**
    Evidence: `SiteNav` morto (site-nav.tsx, nunca importado). Roadmap section é placeholder visível. Mapa section é placeholder. Eventos com 2 stats vazias ("UDESC", "Mudas" sem número).
    Justification: 3–5 elementos removíveis.

---

**Total: 19/30**

Princípios load-bearing: #2 useful (2), #4 understandable (1), #6 honest (1).

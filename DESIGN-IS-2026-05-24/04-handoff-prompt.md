# Handoff — /make-plan prompt

```
/make-plan Redesign da camada de conteúdo da landing page Karaguá. Auditoria Dieter Rams: 19/30, com lacunas críticas em #4 understandable, #6 honest e #10 minimal.

Verdict paragraph:
> REDESIGN escopo conteúdo + poda estrutural. Total 19/30; o sistema visual (DS, tipografia, motion, surfaces) está saudável e DEVE ser preservado, mas o projeto entrega uma LP cuja tese fundadora ("cada número tem uma fonte") é violada na própria home — números sem fonte, seções shipadas como placeholder, jargão B2B sem expansão e CTA com label↔behavior mismatch. A correção exige reconstruir a camada de conteúdo a partir do propósito, não refinar incrementalmente.

Por que redesign e não refine: 3 princípios load-bearing scoraram 1 (#4 understandable, #6 honest, #10 minimal). #6 viola o princípio comercial central do produto (auditabilidade). Refinar seção por seção manteria o erro estrutural — shipar seções aspiracionais ao lado de seções com dado real.

Preservar (intocável nesta passada):
- src/style.css inteiro (DS v3.0 — tokens, scales, motion vars, focus ring).
- src/components/lp/section.tsx (primitives Section + SectionHeader).
- src/lib/motion.ts (helpers + EASE_OUT_QUART).
- Patterns scroll-linked: sticky-scrub em methodology-block.tsx, parallax em carbono-azul.tsx, maskRise em section.tsx:60.
- IA atual: ordem das seções faz sentido para o funil B2B.
- Loader (src/components/loader.tsx), Cursor (src/components/cursor.tsx), Footer (src/components/footer.tsx).

Descartar (causa direta da falha):
- src/components/lp/site-nav.tsx — dead code, nunca importado em App.tsx. Causa falha #10.
- Stats vazias em src/components/lp/eventos.tsx:6-8 — "UDESC"/"Mudas" sem números. Causa falha #6 + #10.
- Placeholder textual de mapa em src/components/lp/mapa.tsx:19-20 acoplado a copy que promete "tempo quase real" (mapa.tsx:9-11). Causa falha #6 (promessa) + #10 (espaço sem entrega).
- Travessões em copy: mapa.tsx:20, methodology-block.tsx:20/21/74/115, cta-final.tsx:23 (subject mailto). Causa falha #3 (DS proíbe — CLAUDE.md:158).
- text-foreground/55 em methodology-block.tsx:73 (≈3:1 sobre k-elevated). Causa falha #3.

Top 5 moves (verbatim do verdict):
1. #6 honest — Remover ou contextualizar com fonte explícita TODO número da home: "5×" (problema.tsx:23), "365" (problema.tsx:30), "50–66%" (pillars.tsx:10), "60" (eventos.tsx:6). Cada um precisa de link/citação inline ou sai da página.
2. #10 minimal — Deletar src/components/lp/site-nav.tsx. Decidir Mapa e Roadmap: ou implementar de verdade nesta release, ou retirar da home até estarem prontos.
3. #4 understandable — Expansão inline de MRV (Monitoramento, Relato e Verificação), PSA (Pagamento por Serviços Ambientais), CONAMA 357/2005, RCGI-USP nas primeiras ocorrências. Corrigir "Ver a metodologia" (hero.tsx:40) para href="#metodologia" (não "#carbono-azul").
4. #2 useful — Preencher os 2 campos "—" do methodology-block (methodology-block.tsx:20-21 Cobertura e Permanência) com valor + data + fonte, ou colapsar para 2 data points até existirem.
5. #3 aesthetic — Remover text-foreground/55 (methodology-block.tsx:73) e padronizar opacidade de texto secundário para /70 ou /75. Eliminar 6 ocorrências de travessão em copy.

Princípios de redesign em prioridade:
1. Honest (#6) — cada número da home tem fonte clicável ou citável inline; cada superlativo tem definição operacional na mesma página; nenhuma promessa de funcionalidade que a página não entrega.
2. Understandable (#4) — primeira ocorrência de cada acrônimo B2B expande o termo; cada CTA leva ao que o label promete (ou o label muda).
3. As little design as possible (#10) — só shipa seção quando tem dado/funcionalidade real. Seções incompletas saem ou viram um único bloco de "em construção" honesto, não 3 placeholders separados.

Entregáveis do plano:
- Inventário linha-a-linha de TODA copy da home com decisão por item: (a) manter, (b) reescrever com fonte, (c) remover. Inclui hero, problema, pillars, methodology-block, carbono-azul, karagua-vivo, guardioes, eventos, mapa, roadmap, cta-final.
- Decisão sobre Mapa: ship com integração real, OU retirar a seção, OU substituir por um link externo para o dataset CSV/Mapbox público. Sem placeholder.
- Decisão sobre Roadmap: ship com fases reais aprovadas pela equipe Karaguá, OU retirar até existirem. Sem "estrutura provisória".
- Decisão sobre methodology-block: valores reais para Cobertura e Permanência, OU 2 data points completos em vez de 4.
- Glossário inline curto (1 linha por termo) na primeira ocorrência de MRV, PSA, CONAMA 357/2005, RCGI-USP Carbon Registry.
- Auditoria de honestidade pré-merge: grep por superlativos ("alta integridade", "auditável", "verificável") e checagem 1:1 com prova na página.
- Diff de remoção: site-nav.tsx deletado, travessões substituídos (vírgula/ponto/parênteses), text-foreground/55 trocado.
- Checklist de regressão para os Preservados (DS tokens não alterados, motion patterns intactos, IA preservada, focus ring preservado).

Out of scope nesta passada:
- Mudar IA ou ordem das seções (já funciona).
- Mexer em DS, tokens, motion library, scroll-linked patterns.
- Refatorar componentes (Section, SectionHeader, methodology-block estrutura).
- Adicionar novas seções/funcionalidades.
- Redesenhar visual de cards, headers, ou tipografia.

Anti-patterns a guardar:
- Portar a copy antiga sob nova roupagem sem auditar a honestidade.
- Manter Mapa/Roadmap "porque dá branco no scroll" sem dado real.
- Adicionar abstrações novas onde uma deleção direta resolve.
- Inflar score em uma re-auditoria sem evidência nova.
- Tratar a lista Preservar como negociável.
```

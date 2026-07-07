━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRD — Karaguá Landing V2: Honestidade Verificável + Tema Vivo
Versão: 2.1 · Status: DECISÕES TRAVADAS (Lucas, 2026-07-06) · pronto para execução
Data: 2026-07-06 · Supersede: `Spec/PRD.md` v1.0 ("Amplo & Blocado")
Base de evidência: `docs/analise-completa-2026-07-06.md` (58 findings verificados
adversarialmente em arquivo:linha, 44 referências externas conferidas uma a uma)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 1. PROBLEMA

A home em produção (V3) divergiu do contrato v1 e regrediu no princípio central
do produto: o `DataPoint` descarta a prop `sources` sem renderizar
(`data-point.tsx:18`, popover removido após o commit `a146617`), e números como
"+400 famílias", "12 oficinas" e "380 ha" aparecem sem fonte nenhuma. Para um
produto cuja tese é "cada número tem uma fonte", isso é a UI contradizendo o
pitch. Em volta disso: um JPEG de 17 MB na home + loader fixo de ~3,1 s
(`problema.tsx:7`, `App.tsx:42-45`), chave paga da Stormglass inlinada no bundle
público (`karagua-leaflet-map.js:573`), XSS potencial no /mapa (`:501-513`),
typo "maguezais" no claim-mestre (`pioneirismo.tsx:11`) e contato institucional
em @gmail.com (`site.ts:13`). O contrato (PRD v1 + Specs 01-04) está congelado
desde `a146617` e já não descreve o site real: 6 componentes de seção órfãos e
a Fase 0 (BlockGrid/FullBleed/SceneScrub) nunca criada.

## 2. OBJETIVO

Reconciliar contrato e realidade (a narrativa V3 em produção é a fonte de
verdade), restaurar a honestidade verificável na UI e elevar o site ao nível
das melhores referências de comunicação (Locomotive, darkroom.engineering,
Isometric), adotando a inversão binária de tema (claro/escuro) entre seções via
scroll (mecânica Basic Agency) como novo idioma de motion.

Métrica-alvo (herda PRD v1 §8 e adiciona):
- **100%** dos números renderizados com fonte inline rastreável a
  `karagua-context/` (hoje: DataPoint não renderiza fontes).
- **Transição de superfície ativa em 100% das costuras entre seções; 0 cortes
  secos de cor.**
- Peso de imagem por variante **< 300 KB** (hoje: 17 MB); loader **≤ 1,5 s** e
  gateado por sessão (hoje: ~3,1 s em toda visita).
- **0** segredos pagos no bundle do client; **0** `innerHTML` com dado remoto.
- **0** travessões em copy; **0** cards arredondados como recipiente; **0**
  hairlines de grade visíveis (decisão: proibição do Spec/01 vence); Lighthouse
  a11y ≥ 95; contraste AA mantido (herdadas do v1 §8).

Prazo: por fase (seção 9); sem data única. Cada fase fecha com
`vp check --fix && vp build` verdes.

Anti-critério (o que não pode quebrar):
- A paleta e os tokens de `src/style.css` (muda a composição, não a paleta).
- Legibilidade sem JS ou sob `prefers-reduced-motion` (a troca de tema
  permanece, instantânea; conteúdo nunca ilegível).
- A rota `/mapa` e o fluxo de login/admin existentes.
- Nenhum número novo sem origem em `karagua-context/`.

## 3. PÚBLICO-ALVO

Primário: **comprador corporativo de créditos de carbono** (ESG/sustentabilidade
de empresas) e **investidor seed**. Chegam céticos, procuram lastro: fonte,
metodologia, base legal.

Secundário: **poder público municipal e parceiros institucionais**
(prefeituras, órgãos ambientais, academia). Navegam em máquinas modestas e
redes lentas: peso de página e compatibilidade importam (por isso CSS
scroll-driven animations nativas ficam como enhancement, nunca mecanismo
central).

Operadores: **equipe Karaguá** via `/admin` (hoje sem confirmação de delete e
com erros do Supabase silenciados, `AdminPage.tsx:41-83`).

## 4. ESCOPO

### Decisões travadas (Lucas, 2026-07-06)

| # | Decisão | Resolução |
|---|---------|-----------|
| DT1 | Fonte de verdade do contrato | **V3 como está**: o lineup atual do `App.tsx` vira o contrato; seções do v1 inexistentes (Solução/pillars, Base legal/methodology-block, Impacto/carbono-azul, Para empresas/guardioes) são descartadas e os órfãos deletados |
| DT2 | Contradição hairline (Spec/01 × Spec/04 × código) | **Proibição vence**: remover as hairlines de grade existentes do código; separação só por espaço e troca de superfície; Spec/04 é corrigido, Spec/01 fica como está |
| DT3 | Hero | **Só o H1**: manter a manchete do hero-v3 e apagar corpo, nota e botões |
| DT4 | Temas de superfície | **2 temas (claro/escuro)**: inversão binária estilo Basic Agency pura |
| DT5 | Proxy da chave Stormglass | **Supabase Edge Function** (site continua estático, chave em secret) |
| DT6 | E-mail institucional | **contato@karagua.com.br** |
| DT7 | D2 do Spec/04 (Impacto) | **SceneScrub**: uma dimensão por vez via sticky-scrub (consome 1 dos 2 scrubs do orçamento); substitui o seletor por clique |
| DT8 | D4 do Spec/04 (fotos) | **Acervo atual + direção tipográfica** onde faltar foto; sourcing fica no roadmap sem bloquear |
| DT9 | Fase 5 (ledger MRV) | **Adiada sem previsão**: fora do roadmap até existir dado operacional real |
| — | D1 do Spec/04 (methodology block) | Morta por consequência de DT1 (órfão descartado) |
| — | D3 do Spec/04 (fontes das stats do hero) | Morta por consequência de DT3 (hero sem stats) |

### MVP (versão 2.0)
- **Honestidade e quick wins:** DataPoint volta a exibir fontes (restaurar do
  commit `a146617`); fontes em Impacto, Laboratório e Karaguá Vivo; typo
  "maguezais"; travessões; "até 8.000 ha" com fonte externa correta (Grupo Pro
  Babitonga; CEPSUL/ICMBio); contato@karagua.com.br; âncora morta do footer.
- **Performance e segurança:** imagens AVIF/WebP responsivas; loader gateado por
  sessionStorage; proxy da Stormglass em Supabase Edge Function; fim do
  `innerHTML` com dado remoto; geojson defaults corrigidos; pixel-beam
  respeitando reduced-motion; Supabase lazy + admin em chunk próprio; limpeza
  (6 órfãos lp/ deletados por DT1, `@gsap/react` morto, `roots-test.html`,
  versões "latest" pinadas, img1/img2 órfãs de 34 MB).
- **Re-baseline do contrato (execução das DTs):** reescrever Spec/04 e PRD para
  o lineup V3 real; corrigir checkboxes falsos do §1; remover hairlines do
  código (DT2); hero só H1 (DT3); registrar DT7/DT8.
- **Prova de estilo da inversão de tema:** PoC em 1 costura (hero escuro →
  Problema claro) com a arquitetura da análise §4.2: wrapper único dono da
  superfície, tema binário via `data-theme`, IntersectionObserver na linha
  central, transition 0,65 s em CSS, reduced-motion instantâneo, remoção do
  scroll-fade global do `section.tsx:41-50`. **Gate: aprovação visual do Lucas
  antes de propagar.**
- **Propagação:** tema claro/escuro em todas as costuras com
  header/ScrollRail/::selection sincronizados; primitivas SceneScrub/FullBleed
  (extrair SceneScrub do padrão de `portas.tsx:40-120`); SceneScrub no Impacto
  (DT7) e no Karaguá Vivo; CTA final sobre foto full-bleed do acervo atual com
  scrim (DT8); consolidação tipográfica (presets de display no lugar dos 4
  clamps); footer no container Wide.

### Fora do escopo por ora (fase 2+)
- **Seções do v1 descartadas por DT1** (Para empresas, Base legal como seção,
  Solução/pilares) e as reintroduções de copy associadas (argumento
  US$14→US$26, base legal na narrativa principal). Se o funil B2B pedir uma
  porta para o comprador no futuro, é um novo ciclo de escopo.
- **Diferenciação de setor (DT9, sem previsão):** mini-ledger público de MRV,
  notas de rodapé numeradas com nota de incerteza, indexação tipográfica de
  evidências, bylines científicas, versão/data do dataset no footer.
- Lenis smooth scroll global (só se o scroll-telling adotar GSAP ScrollTrigger;
  nunca dois orquestradores de scroll juntos).
- Mapa interativo novo, roadmap dinâmico, internacionalização.
- Migração de tsconfig para strict completo e reescrita tipada do
  `karagua-leaflet-map.js` (dívida registrada; o MVP corrige só o XSS e a
  chave exposta dentro do arquivo atual).
- Sourcing dedicado de fotos do território (roadmap, DT8).

## 5. REQUISITOS FUNCIONAIS

### Honestidade de dados
- RF01 (revisado em 2026-07-06, decisão do Lucas pós Fase 0): todo número
  renderizado tem fonte **mantida como dado no código** (prop `sources` do
  DataPoint) e rastreável a `karagua-context/`; a fonte **não é exibida na UI**
  (hovers e linhas "Fonte:" removidos a pedido do dono).
- RF02: Números de faixa mostram a faixa honesta ("até 8.000 ha") e atribuem a
  fonte externa real, nunca "estimativa interna" para dado de terceiros.
- RF03: Siglas expandem na primeira ocorrência (PSA, PDD) conforme glossário do
  Spec/03.

### Tema e motion
- RF04: A página alterna entre dois temas (claro/escuro) quando a seção que
  contém a linha central do viewport muda, com suavização de 0,65 s; seções
  declaram tema via `data-theme`, nunca cor hardcoded.
- RF05: Header, ScrollRail e seleção de texto invertem em sincronia com o tema
  (mesmas variáveis, mesmo timing); proibido mix-blend-mode no header.
- RF06: Sob reduced-motion a troca de tema permanece, instantânea; scrubs
  renderizam estado final estático.
- RF07: Interpolação contínua de cor (scrub) é exceção: máximo 2 costuras por
  página, registradas no Spec/02.
- RF08: O Impacto revela suas 4 dimensões uma por vez via SceneScrub (DT7);
  Impacto + Portas esgotam o orçamento de 2 scrubs da página.

### Hero e narrativa
- RF09: O hero renderiza apenas a manchete (H1); sem corpo, nota ou botões
  (DT3). A navegação para o restante da página é o scroll.
- RF10: O lineup de seções do contrato é o V3 em produção (DT1); nenhum
  componente de seção órfão permanece no repositório.

### Carregamento
- RF11: O loader aparece no máximo uma vez por sessão, dura ≤ 1,5 s e é pulado
  sob reduced-motion.
- RF12: Imagens servem variantes responsivas em formato moderno; nenhuma imagem
  órfã publicada.

### Mapa e admin
- RF13: O /mapa consome dados meteorológicos via Supabase Edge Function (DT5);
  nenhum segredo pago chega ao client.
- RF14: Dados vindos do Supabase são renderizados como texto, nunca como HTML.
- RF15: Ações destrutivas no /admin pedem confirmação e erros de rede são
  reportados ao operador, não silenciados.
- RF16: Sidebar e modais têm semântica de diálogo (foco gerenciado, Escape,
  scroll-lock).

### Contato
- RF17: Todo ponto de contato usa contato@karagua.com.br (DT6); subjects de
  mailto sem travessão.

## 6. REQUISITOS NÃO-FUNCIONAIS
- RNF01: Peso por imagem < 300 KB por variante; total de `public/` sem órfãos
  (baseline atual: 68 MB).
- RNF02: Lighthouse a11y ≥ 95; contraste AA nos dois temas (texto sobre foto
  com scrim ≥ 4.5:1); zero regressão de reduced-motion.
- RNF03: Animações usam transform/opacity; exceções (clipWipe ou sucessor)
  documentadas no Spec/02. Zero leitura de layout por evento de scroll
  (padrão IO/vars; corrige o `scroll-rail.tsx:48-63`).
- RNF04: Nenhuma chave de API paga no bundle; dependências de CDN com SRI ou
  empacotadas; versões do manifest pinadas (build reprodutível).
- RNF05: Página funcional e legível sem JS (tema da primeira seção nasce via
  CSS estático).
- RNF06: Suporte de browser: mecanismo central de tema via IO + CSS transition
  (universal); `animation-timeline`/`view()` apenas atrás de `@supports`.
- RNF07: Separação visual por espaço e troca de superfície; sem hairlines de
  grade nem bordas de card (DT2).

## 7. DEPENDÊNCIAS

Técnicas:
- Supabase Edge Function para o proxy da Stormglass (DT5): criar a function,
  mover a chave para secret e apontar o `karagua-leaflet-map.js` para ela.
- Caixa/roteamento de contato@karagua.com.br no provedor de e-mail do domínio
  (DT6): existe DNS, falta confirmar a caixa.
- Acervo de fotos atual (`mangue.*`) para os full-bleeds (DT8).

De negócio / pessoas:
- **Lucas:** gate visual da costura piloto (Fase 3) e aceite final por fase.
- `karagua-context/` como fonte única de copy e números (inalterado).

## 8. RISCOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Inversão de tema brigar com o scroll-fade global atual | Alta | Médio | O PoC remove o scroll-fade na costura piloto; a propagação o revoga de vez (emenda Spec/02 §7.6) |
| Hero só-H1 derrubar conversão (sem CTA above the fold) | Média | Alto | Medir cliques no CTA final/portas após o deploy; se cair, reavaliar com dado (decisão reversível e barata) |
| Sem porta para o comprador, o funil B2B segue sem destino (finding alta da análise) | Média | Alto | Decisão consciente do DT1; monitorar demanda entrante via contato@; reabrir escopo se o comercial pedir |
| Tema binário degradar legibilidade sobre fotos | Média | Alto | Scrim ≥ 4.5:1 como aceite; fotos full-bleed só em Hero/CTA; teste de contraste nos 2 temas no gate |
| Edge Function da Stormglass atrasar | Baixa | Médio | Interim: restringir a chave/quota no painel Stormglass; item não bloqueia as demais fases |
| Regressão de performance ao propagar motion | Baixa | Médio | Orçamento de scrubs (máx. 2, já esgotado por Impacto+Portas), IO único, transition em CSS; Lighthouse por fase |

## 9. FASES E LINHA DO TEMPO

Gate de estilo do v1 mantido: **provar em uma costura antes de propagar.**

Fase 0 — Honestidade e quick wins (esforço P): typo, travessões, âncora,
"até 8.000 ha", contato@karagua.com.br, **DataPoint com fontes restaurado**.
Fase 1 — Performance e segurança (P-M): imagens, loader, Edge Function da
Stormglass, XSS, geojson, pixel-beam, Supabase lazy, limpeza de órfãos e deps.
Fase 2 — Re-baseline do contrato (M): executar DT1-DT8 nos Specs (reescrever
Spec/04 para o lineup V3, corrigir checkboxes, registrar decisões), deletar
órfãos, remover hairlines, hero só H1.
Fase 3 — Prova de estilo (P): PoC da inversão claro/escuro em 1 costura +
primitivas SceneScrub/FullBleed. **Gate: aprovação visual do Lucas.**
Fase 4 — Propagação (G): tema em todas as costuras, SceneScrub no Impacto (DT7)
e no Karaguá Vivo, CTA final full-bleed com acervo atual, consolidação
tipográfica, footer Wide.
Fase 5 — Diferenciação de setor: **adiada sem previsão (DT9)**.

## 10. OPEN QUESTIONS

As 8 questões da v2.0 foram respondidas pelo Lucas em 2026-07-06 (tabela DT,
seção 4). Permanecem em aberto apenas:

- [ ] A caixa contato@karagua.com.br já existe no provedor do domínio, ou
      precisa ser criada antes da Fase 0? (Lucas / quem administra o domínio)
- [ ] O par exato de tokens do tema claro (o escuro já existe em
      `style.css:119-150`): derivar do `.surface-primary` atual ou definir novo
      no gate da Fase 3? (design, resolvido no PoC com aprovação visual)
- [ ] O H1 atual do hero-v3 sobrevive sozinho sem a nota de contexto? Validar
      a manchete final com `karagua-context/14-brandbook-textual.md` na Fase 2.
      (copy, validação rápida)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

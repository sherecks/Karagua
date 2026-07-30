# Análise completa: landing Karaguá Ecotech

**Data:** 2026-07-06 · **Repo:** `/Users/lucasmelo/Desktop/Projetos/karagua-website` · **Contrato vigente:** Spec/PRD.md ("Amplo & Blocado") + Spec/01..04
**Método:** 4 auditorias internas (design/motion, código/perf/a11y, copy/comunicação, gap vs PRD) revisadas adversarialmente (58 findings, 58 sobreviventes) + 5 frentes de pesquisa externa com 44 referências verificadas uma a uma.

---

## 1. Sumário executivo

**Estado do site.** A home em produção (V3) divergiu do contrato: o `App.tsx:57-67` renderiza um lineup que não é o do PRD §6, 6 componentes de seção estão órfãos e a Fase 0 (primitivas BlockGrid/FullBleed/SceneScrub, tokens `--gutter`/`--block-max`) nunca existiu (grep vazio em `src/`). O princípio central do produto, "cada número tem uma fonte", regrediu de fato: o `DataPoint` descarta a prop `sources` sem renderizar (`data-point.tsx:18`), e "+400 famílias", "12 oficinas" e "380 ha" aparecem sem fonte alguma. Em performance, a home serve um JPEG de 17 MB (`public/images/img3.jpg`) e bloqueia tudo atrás de um loader fixo de ~3,1 s sem gate de sessão (`App.tsx:42-45`). Em segurança, a chave paga da Stormglass está inlinada no bundle público (`karagua-leaflet-map.js:573`) e há XSS potencial via `innerHTML` no mapa (`:501-513`). Em copy, o claim-mestre de pioneirismo carrega o typo "maguezais" (`pioneirismo.tsx:11`) e o funil B2B não tem porta para o comprador de créditos, com contato institucional em @gmail.com (`site.ts:13`).

**As 5 mudanças de maior impacto:**

1. **Restaurar a fonte visível em todo número** (DataPoint com citação/popover + migrar números órfãos): é a materialização da tese do produto, hoje quebrada.
2. **Cortar o custo de entrada**: imagens em AVIF/WebP responsivo (17 MB → <300 KB por variante) + loader gateado por sessionStorage, ≤1,5 s, pulado sob reduced-motion.
3. **Fechar as brechas de segurança**: proxy server-side para a chave Stormglass e `textContent` no lugar de `innerHTML` no mapa.
4. **Re-baseline do contrato**: decidir a fonte de verdade (PRD vs home V3), emendar Spec/01..04, deletar os 6 órfãos e resolver a contradição hairline (Spec/01 proíbe, Spec/04 exige).
5. **Inversão de tema entre seções via scroll (estilo Basic Agency)** como novo idioma de motion: prova de conceito em 1 costura (gate de estilo do PRD §7), depois propagação com header e ScrollRail sincronizados. Substitui o scroll-fade global não especificado do `section.tsx:41-50`.

---

## 2. Diagnóstico do site atual

### 2.1 Design e motion (15 findings, todos verificados)

| #   | Finding                                                                                               | Sev   | Evidência                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fase 0 inexistente: BlockGrid/FullBleed/SceneScrub e `--gutter`/`--block-max` nunca criados           | alta  | grep 0 matches em `src/`; exigidos em Spec/01:57, :89, :111 e :36-41                                                                                     |
| 2   | Spec drift total: home V3 ≠ contrato; 5 componentes de seção órfãos                                   | alta  | `App.tsx:57-67` vs `Spec/PRD.md:78-88`; `guardioes.tsx` nunca existiu                                                                                    |
| 3   | Hero em uso (hero-v3) contradiz aceites "[x] entregue" do Spec 04 §1                                  | alta  | parágrafo de corpo em `hero-v3.tsx:36-43`, zero DataPoint, CTAs errados (`:49-63`), `rounded-xl` (`:68`) vs `Spec/04:12-27`                              |
| 4   | DataPoint não exibe fontes na UI (princípio central quebrado)                                         | alta  | `data-point.tsx:18-19` ("não exibidas na UI"); JSX `:78-91` sem popover; CSS órfão em `style.css:325,349`; viola `PRD.md:51-52,117-118`                  |
| 5   | Travessões em copy e subject de mailto (métrica P6 do PRD)                                            | alta  | `cta-final.tsx:11-13`, `equipe.tsx:9,14`; métrica em `PRD.md:116`; typo "maguezais" em `pioneirismo.tsx:11`                                              |
| 6   | Cards arredondados com borda ainda são recipientes de conteúdo (3 componentes)                        | média | `equipe.tsx:54`, `portas.tsx:139`, `eventos.tsx:63` (órfão); viola `PRD.md:114-115`                                                                      |
| 7   | Contradição do contrato: PRD/Spec 04 pedem hairline, Spec 01 proíbe; código usa hairline em 6+ seções | média | `Spec/PRD.md:42-44` e `Spec/04:35,60-61,69` vs `Spec/01:11-15,147-148`; hairlines em `problema.tsx:67`, `diferencial.tsx:45`, `cta-final.tsx:75` etc.    |
| 8   | Ritmo vertical monótono: toda seção `min-h-screen` com o mesmo `py`                                   | média | `section.tsx:58`; viola `Spec/01:141-142`; 3 faixas lima "primary" fora da cadência do `Spec/01:129`                                                     |
| 9   | Scroll-fade global do Section (opacity 0.35→1→0.4) não consta em spec nenhum                          | média | `section.tsx:41-50`; ~7 useScroll simultâneos; fora dos 3 modos de `Spec/02:43-49`; risco de contraste AA transitório (`PRD.md:123-124`)                 |
| 10  | Não existe transição de tema/cor entre seções: cortes secos de superfície                             | média | superfícies estáticas em `section.tsx:8-18`; tokens já suportam inversão atômica (`.dark` em `style.css:119-150`, `.surface-primary` em `:334-347`)      |
| 11  | Nenhum SceneScrub: seções pesadas despejam tudo em stagger único                                      | média | `karagua-vivo.tsx:59-77` (P4 do `PRD.md:35`); único scrub real é Portas (`portas.tsx:40-120`), fora do orçamento do `Spec/02:97-109`                     |
| 12  | CTA final sem foto full-bleed exigida                                                                 | média | `cta-final.tsx:20-90` split tipográfico vs `Spec/04:99-107`; métrica `PRD.md:119` depende só de Problema                                                 |
| 13  | Loader bloqueia ~3,1 s todo carregamento, sem gate de sessão                                          | média | `App.tsx:40-45` + `loader.tsx:36-48` (2240+850 ms); grep sessionStorage: 0; reduced-motion paga os mesmos 3,1 s                                          |
| 14  | Leis de motion feridas: useSpring no Magnetic, clip-path animado, durações 0,7-0,9 s                  | baixa | `magnetic.tsx:19-20`, `motion.ts:56-71`, `karagua-vivo.tsx:53-56`; inconsistência interna do próprio Spec/02 (§0 vs checklist :124)                      |
| 15  | Footer em `max-w-6xl` e escala `--text-display` ignorada (4 clamps distintos em 5 manchetes)          | baixa | `footer.tsx:17`; clamps em `hero-v3.tsx:29`, `cta-final.tsx:32`, `laboratorio-cta.tsx:34`, `portas.tsx:105`, `pioneirismo.tsx:40` vs `style.css:159-161` |

### 2.2 Código, performance e acessibilidade (16 findings)

| #   | Finding                                                                               | Sev   | Evidência                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Imagens de 14-17 MB cruas, sem formato moderno nem srcset (68 MB em public/)          | alta  | `problema.tsx:7,45-52` serve `img3.jpg` (17 MB); `LaboratorioPage.tsx:10-11` (+17 MB); grep srcSet/picture: 0                                |
| 2   | Loader fixo de ~3,09 s arruína o LCP percebido em toda visita                         | alta  | `loader.tsx:47-48`, `App.tsx:42-45`, overlay `z-[10001]` (`loader.tsx:88`) sobre hero textual leve                                           |
| 3   | Chave da API Stormglass (paga) exposta no bundle do client                            | alta  | `karagua-leaflet-map.js:573` (`VITE_STORMGLASS_KEY` inlinada pelo Vite)                                                                      |
| 4   | XSS armazenado potencial: dados do Supabase em `innerHTML` no /mapa                   | média | `karagua-leaflet-map.js:501-513` interpola `p.nome`/`p.dados` sem sanitizar; contraste com `_showInfo` (`:461-466`, `textContent` correto)   |
| 5   | `karagua-leaflet-map.js` sem tipos + tsconfig sem strict                              | média | 643 linhas .js; `(mapEl as any)` em `MapPage.tsx:29,33`; `tsconfig.json:12` só strictNullChecks                                              |
| 6   | Leaflet via unpkg sem SRI + defaults de geojson quebrados (404 em todo load do /mapa) | média | `karagua-leaflet-map.js:73,330,366-371`; public/ só tem `mapuc.geojson` e `costeira.geojson`                                                 |
| 7   | Canvas do hero (pixel-beam) ignora reduced-motion e roda RAF contínuo                 | média | `pixel-beam-background.tsx:213-247,268`; grep matchMedia: 0                                                                                  |
| 8   | Supabase client criado no import, sem validação, no bundle inicial da home            | média | `supabase.ts:13-16`; `App.tsx:17` → `protected-route.tsx:3` puxa ~30-40 KB gzip para a landing                                               |
| 9   | Sidebar fullscreen e modal do Admin sem semântica de diálogo nem gestão de foco       | média | `sidebar.tsx:34-47`, `AdminPage.tsx:237-249`: sem role/aria-modal/trap/Escape/scroll-lock                                                    |
| 10  | "Cada número tem uma fonte" não materializado na UI                                   | média | `data-point.tsx:18-19,43-52` (prop nem destruturada); CSS tooltip órfão em `style.css:325,349-354`                                           |
| 11  | ScrollRail lê layout (getBoundingClientRect ×9) a cada scroll                         | baixa | `scroll-rail.tsx:48-63` + `sections.ts:8-16`; setState idêntico sofre bail-out (custo real é a leitura de layout)                            |
| 12  | Dead code: 6 componentes lp/ órfãos e âncora morta `#solucao` no footer               | baixa | hero, pillars, carbono-azul, eventos, methodology-block, value-map-background; `footer.tsx:9`; img1/img2 (34 MB) só referenciados por mortos |
| 13  | `@gsap/react` é dependência morta                                                     | baixa | `package.json:13`; grep gsap em src/: 0                                                                                                      |
| 14  | `roots-test.html` em produção e versões "latest" no manifest                          | baixa | `public/roots-test.html` versionado; vite/vite-plus em `latest` (build não reprodutível)                                                     |
| 15  | Google Fonts render-blocking e preload incompleto de pesos                            | baixa | `index.html:107-110`; preload de 3 pesos Aileron, faltam light 300 e semibold 600                                                            |
| 16  | AdminPage: delete sem confirmação e erros do Supabase silenciados                     | baixa | `AdminPage.tsx:80-83` (delete direto, error descartado), `:41-47` (fetch ignora error)                                                       |

### 2.3 Copy e comunicação (15 findings)

| #   | Finding                                                                                              | Sev   | Evidência                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | DataPoint não exibe as fontes na UI                                                                  | alta  | `data-point.tsx:18`; viola `Spec/03:16-17` e `Spec/04:21`                                                                                                          |
| 2   | Números renderizados sem fonte nenhuma (Impacto e Laboratório)                                       | alta  | `impacto-comunidade.tsx:21-46` ("+400 famílias", "~4.000 ha"), `laboratorio-cta.tsx:12-14` ("12 oficinas", "6 bolsas", "24 meses"); aceite `Spec/03:123` falha     |
| 3   | Typo no claim-mestre: "maguezais"                                                                    | alta  | `pioneirismo.tsx:11`, renderizado gigante via `:38-41`; termo nº 1 do brandbook (`karagua-context/context/14-brandbook-textual.md:15`)                             |
| 4   | Funil B2B sem porta para o comprador de créditos + contato em @gmail.com                             | alta  | `cta-final.tsx:10-13`, `portas.tsx:8-30`, `site.ts:13`; persona em `karagua-context/context/01:7` e `02:7`; seção #empresas prevista (`Spec/PRD.md:86`) não existe |
| 5   | Travessões em copy renderizada e subjects de mailto                                                  | média | `cta-final.tsx:11-13`, `equipe.tsx:9,14`, `problema.tsx:28`; aceite `Spec/03:122` falha                                                                            |
| 6   | Claim de pioneirismo repetido 4x sem evidência nova; Pioneirismo duplica Diferencial                 | média | `hero-v3.tsx:37-39`, `diferencial.tsx:12`, `marquee.tsx:16`, `pioneirismo.tsx:11,22`; argumento US$14→US$26 (Sylvera) da `Spec/03:57` ficou fora                   |
| 7   | Gramática quebrada no bloco 01 do Problema                                                           | média | `problema.tsx:33` ("mas raramente contabilizados", elipse sem verbo; comparação imprecisa)                                                                         |
| 8   | "Alta integridade" sem prova + "acesso antecipado" genérico                                          | média | `portas.tsx:13`; auditoria de superlativos em `Spec/03:114-115` exige prova ou reescrita                                                                           |
| 9   | Nota do hero vaza jargão interno ("claim", "(PR/SC)")                                                | média | `hero-v3.tsx:40-42`                                                                                                                                                |
| 10  | Glossário não cumprido: PSA sem expansão na 1ª ocorrência; PDD nunca expandida                       | média | `diferencial.tsx:24`, `marquee.tsx:15`, `karagua-vivo.tsx:16`; regra `Spec/03:20-21`                                                                               |
| 11  | "8.000 ha" exibe o teto da faixa 6.000-8.000 e atribui a "estimativa interna" dado com fonte externa | média | `problema.tsx:13-16` vs `karagua-context/context/06:13,33-34` (Grupo Pro Babitonga; CEPSUL/ICMBio); brandbook usa "até 8.000 ha"                                   |
| 12  | Drift specs↔home: seções previstas ausentes, âncora morta, copy órfã                                 | média | `App.tsx:55-68` vs `Spec/04:12-107`; `footer.tsx:9` (#solucao morto); base legal (PEPSA/ProManguezal/Lei 15.042) sumiu da narrativa principal                      |
| 13  | Budget e regra "sem parágrafo" violados em várias seções                                             | baixa | `hero-v3.tsx:36-43`, `impacto-comunidade.tsx:63-69` (eyebrow 3 palavras, corpo 24), `laboratorio-cta.tsx:48-51`, `equipe.tsx:45-48` vs `Spec/03:10-13,26-35`       |
| 14  | CTAs genéricos ("Acessar" ×3) e copy de equipe em registro "startup genérica"                        | baixa | `portas.tsx:110,147`, `equipe.tsx:45`, credencial circular em `equipe.tsx:9`                                                                                       |
| 15  | Fechamento do CTA final em abstração corporativa                                                     | baixa | `cta-final.tsx:46-49` (substantivação vaga, sem verbo de ação nem âncora concreta)                                                                                 |

### 2.4 Gap vs PRD (12 findings + tabela de status)

**Status por seção do escopo (PRD §6, `Spec/PRD.md:78-88`):**

| Seção do contrato                      | Status                                                     | Evidência                                                                                             |
| -------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Fase 0 (primitivas + tokens)           | **NÃO INICIADA** (motion calmo em `motion.ts:14-48` feito) | grep BlockGrid/FullBleed/SceneScrub/gutter: 0                                                         |
| §1 Hero (full-bleed + stats com fonte) | **PARCIAL/DIVERGIU**                                       | `App.tsx:57` → `hero-v3.tsx`: corpo, zero stats, CTAs errados                                         |
| §2 Problema                            | **PARCIAL**                                                | 3 blocos (spec pede 4); números do contrato (7,4%, 1,4M ha, US$14→26) ausentes (`problema.tsx:32-36`) |
| §3 Karaguá Vivo (SceneScrub 01/04)     | **PARCIAL**                                                | stagger único em `karagua-vivo.tsx:59`; "380 ha" sem fonte (`:24`)                                    |
| §4 Solução (Pillars)                   | **NÃO INICIADA na página**                                 | `pillars.tsx` órfão                                                                                   |
| §5 Base legal (MethodologyBlock)       | **NÃO INICIADA na página**                                 | `methodology-block.tsx` órfão (id="legal" em `:21`)                                                   |
| §6 Impacto (CarbonoAzul)               | **DIVERGIU**                                               | `carbono-azul.tsx` órfão; id "impacto" é o seletor por clique de `impacto-comunidade.tsx:62`          |
| §7 Para empresas (Guardiões)           | **NÃO INICIADA**                                           | `guardioes.tsx` deletado no commit bf388d3; grep id="empresas": 0                                     |
| §8 CTA final (FullBleed foto)          | **PARCIAL**                                                | `cta-final.tsx:21` sem foto; aceite `Spec/04:105` falha                                               |
| Section primitive                      | **PARCIAL**                                                | `section.tsx:64` fixa Wide, sem modo full-bleed do Spec 01                                            |

**Findings do gap:**

| #   | Finding                                                                                  | Sev   | Evidência                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Classificação acima: 2 parciais renderizadas, 3 órfãs, 1 deletada, fundação incompleta   | alta  | tabela acima                                                                                                              |
| 2   | Nenhuma primitiva do Spec 01 criada                                                      | alta  | grep 0; arquivos prometidos em `Spec/01:57,89,111` inexistentes                                                           |
| 3   | Regressão comprovada por git: popover de fontes existia no commit a146617 e foi removido | alta  | `git show a146617:src/components/lp/data-point.tsx` tinha popover com `sources.map`; hoje `data-point.tsx:18-19` descarta |
| 4   | Travessão em copy e subject de mailto (P6)                                               | média | `cta-final.tsx:11-13`, `equipe.tsx:9,14`; `PRD.md:116`                                                                    |
| 5   | Checkboxes do Spec 04 §1 não refletem a realidade (hero com big numbers nunca existiu)   | média | `git log -S 'DataPoint'` em hero\*.tsx: vazio; `Spec/04:24,26` marcados [x]                                               |
| 6   | Reveal sequencial: 1 de 2 scrubs, e no lugar errado (Portas, fora do contrato)           | média | `PRD.md:120`; `portas.tsx:40-120` vs `karagua-vivo.tsx:59-77`                                                             |
| 7   | Métrica "0 cards arredondados" falha em 3 componentes                                    | média | `equipe.tsx:54`, `portas.tsx:139`, `eventos.tsx:63`                                                                       |
| 8   | Decisões D1-D4 nunca formalmente travadas; duas obsoletas por deriva                     | média | `Spec/04:115-118`; Impacto resolvido por 3º caminho não registrado (clique)                                               |
| 9   | Footer com âncora morta #solucao; NAV diverge do PRD                                     | baixa | `footer.tsx:9`; `sections.ts:7-17`                                                                                        |
| 10  | Contradição hairline Spec 01 vs Spec 04 (código adotou hairline)                         | baixa | `Spec/01:11-15,147-148` vs `Spec/04:35,69`                                                                                |
| 11  | Typo "maguezais" no claim renderizado                                                    | baixa | `pioneirismo.tsx:11`                                                                                                      |
| 12  | Spec/ congelado desde a146617; 6 órfãos acumulados, ids colidíveis                       | baixa | `git log -- Spec/`; `carbono-azul.tsx:35` id="impacto" colide com `impacto-comunidade.tsx:62`                             |

---

## 3. Banco de referências curado (44 refs, todas verificadas em 2026-07-06)

Legenda: ⭐ = ref norteadora para a Karaguá.

### 3.1 Agências e empresas de comunicação

| Ref            | URL                         | O que roubar                                                                                                                                                                                      | Técnica                                                                                                                                                      |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ⭐ Locomotive  | https://locomotive.ca/en    | Listas de conteúdo como índices hairline com contadores ("Extras(13)"); intro que constrói a frase progressivamente; temas nomeados multi-cor (`html[data-theme=dark\|primary\|secondary\|lisa]`) | Smooth scroll próprio, zero framework front-end; swap de `data-theme` por callbacks in-view; transition `background-color .3s cubic-bezier(.215,.61,.355,1)` |
| Obys Agency    | https://obys.agency/        | Grid de trabalhos como arquivo numerado (01-19) com metadados tipográficos e 3 modos de leitura                                                                                                   | Itens duplicados no DOM por composição; transições GSAP/Flip; marquee por duplicação de lista                                                                |
| Pentagram      | https://www.pentagram.com/  | Taxonomia dupla (setores × disciplinas) filtrando masonry; crops direcionados por arte do mesmo asset                                                                                             | imgix com `rect` + `w` server-side; filtros client-side                                                                                                      |
| DEPT           | https://www.deptagency.com/ | Certificações como blocos de stats secos (B Corp / 100% climate neutral / 37% renewável); H1 display sobre vídeo                                                                                  | Carrossel de cards com stats sobrepostos; animação palavra a palavra (spans + stagger)                                                                       |
| Wieden+Kennedy | https://www.wk.com/         | Manifesto como hero: 5 parágrafos de tese em texto corrido, bloco inteiro como link único                                                                                                         | `<a>` block-level envolvendo o manifesto; padrão de copywriting, barato e de alto impacto                                                                    |
| R/GA           | https://rga.com/            | Acordeão definicional (capacidade → definição de 1 linha → 1 case) e log de notícias com datas ISO (2026.01.21)                                                                                   | Accordion acessível em colunas; datas em mono. Direto para o ciclo MRV da Karaguá                                                                            |
| AKQA           | https://www.akqa.com/       | Um case por viewport: foto full-bleed + eyebrow + claim de 1 linha, sem card; alt-texts editoriais completos                                                                                      | Sections ~100vh, imagens next-gen com params CDN, link envolvendo o bloco                                                                                    |
| AREA 17        | https://area17.com/         | Clientes citados como TEXTO linkado (não logo wall); lista de 12 indústrias como índice tipográfico                                                                                               | Headline com sufixo rotativo; `<ul>` tipográfica com hover; AnimatePresence no nome rotativo                                                                 |
| Isometric      | https://isometric.com/      | Ver seção 3.3 (entra nas duas categorias)                                                                                                                                                         |                                                                                                                                                              |
| PORTO ROCHA    | https://portorocha.com/     | Press log como diário editorial datado com parágrafos íntegros; prova de estúdio brasileiro nesse nível                                                                                           | Next.js na Vercel + Prismic; stack quase idêntica à da Karaguá, transferência direta                                                                         |

### 3.2 Interativos de altíssimo nível (Awwwards SOTD 2025-2026)

| Ref                        | URL                                                        | O que roubar                                                                                                                                                           | Técnica                                                                                                   |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| NRG Build Your Data Center | https://business.nrg.com/campaigns/build-your-data-center/ | Scroll-telling B2B por fases numeradas ("Scroll to Phase 1"); mapeia 1:1 no ciclo do crédito (baseline → conservação → MRV → emissão)                                  | GSAP ScrollTrigger com pin+scrub, sem WebGL; headline splitada em spans                                   |
| Tresmares Capital          | https://www.tresmarescapital.com/                          | Stat block pós-hero com count-up (+3.500 M€); SVG geográfico desenhado por scrub (linha de costa/mangue para a Karaguá)                                                | stroke-dashoffset com scrub; count-up com IntersectionObserver + tween                                    |
| ZettaJoule                 | https://zetta-joule.com/                                   | Prova de que clima ganha SOTD com 2 cores e zero canvas; verbete de dicionário ("carbono azul" como device); spec-table hairline; letter-spacing que respira no scroll | Split por caractere + tween de tracking amarrado ao progresso; tabs de gráficos por troca de estado       |
| Wolverine Worldwide        | https://www.wolverineworldwide.com/                        | "Market Snapshot" (dado vivo como bloco tipográfico); fullscreen masked parallax para foto de manguezal sangrando                                                      | clip-path/inset() com scrub; colunas com velocidades distintas; Lenis + ScrollTrigger                     |
| ⭐ darkroom.engineering    | https://darkroom.engineering/                              | O canônico do "blocado, hairline, zero card": Activity Log datado (vira "diário de campo/MRV"); definição de dicionário no hero                                        | Stack aberto Satus (Next.js, React 19, TS strict, Zod) + Lenis + GSAP: gabarito público do estado da arte |
| Lenis                      | https://lenis.dev (ex lenis.darkroom.engineering)          | Camada de smooth scroll <4 kb usada por quase todos os SOTDs; headlines empilhadas em cena pinada                                                                      | Scroll nativo preservado (sticky, âncoras, a11y); adapter `lenis/react` para React 19                     |
| Lusion                     | https://lusion.co/                                         | Ignorar o WebGL; roubar affordances ("scroll to explore") e meta-labels por item ("dado • fonte: IPCC 2023")                                                           | Cores declarativas por item via `data-color-*`; footer sticky com progress                                |
| Unseen Studio              | https://unseen.co/                                         | Wordmark que se monta por caracteres no load (KARAGUÁ no hero, sem canvas)                                                                                             | translateY randômico por span convergindo a 0; stagger no load                                            |
| Aino                       | https://aino.agency/                                       | Indexação tipográfica de blocos ("A002 SANDISK" → "D01 Estoque de carbono", "F03 Fonte: SEEG")                                                                         | Labels monospace no canto de cada célula do grid; hairlines via gap-px                                    |

### 3.3 Setor clima/carbono

| Ref                        | URL                                  | O que roubar                                                                                                                                                                 | Técnica                                                                                               |
| -------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ⭐ Isometric               | https://isometric.com                | O padrão-ouro de "cada número tem uma fonte": hero com feed de certificados reais, ID visível, cada card deep-link para o registro público                                   | Marquee de âncoras para registry.isometric.com; replicável como componente que consome JSON de provas |
| Isometric Registry         | https://registry.isometric.com       | Tabela pública sortable com durabilidade ("1,000Y+") e toneladas com 2 decimais (precisão comunica medição real)                                                             | Tabela HTML semântica hairline, sem card, full-bleed                                                  |
| Charm Industrial Ledger    | https://charmindustrial.com/ledger   | Ledger com carimbo de data ("data for Jul. 06, 2026"), tonelagem com 3 decimais e hash de pedido clicável                                                                    | JSON/CMS leve + contador animado + data de atualização explícita                                      |
| Frontier                   | https://frontierclimate.com          | Notas de rodapé numeradas [1-4] com DOI sob os gráficos; tabela de critérios com limiares numéricos                                                                          | Componente `<FootnoteRef n={1}/>` com scroll suave até o bloco de fontes                              |
| Frontier Progress          | https://frontierclimate.com/progress | Dashboard com delta temporal e o asterisco honesto ("some deliveries may not materialize at all"): admitir incerteza aumenta credibilidade                                   | Stat blocks com delta e nota de incerteza por número                                                  |
| CarbonPlan                 | https://carbonplan.org               | Anti-estética científica: dark, mono, coordenadas na tela, hash de commit no footer linkando o código-fonte                                                                  | Footer lê o SHA no build; `tabular-nums` para todos os números                                        |
| Watershed                  | https://watershed.com                | Copy de linhagem de dado ("see how every number was calculated"); stat wall de credibilidade científica                                                                      | Usar a copy, não o visual (clichê SaaS)                                                               |
| Sylvera                    | https://www.sylvera.com              | Único player com PT-BR nativo (mercado lusófono subatendido); funil por persona com dor explícita                                                                            | Arquitetura de informação: 3 entradas por persona                                                     |
| Climeworks                 | https://climeworks.com               | Logo wall onde cada logo linka para o press release do contrato: logos viram índice de provas                                                                                | Array `{logo, proofUrl}` em marquee                                                                   |
| South Pole                 | https://www.southpole.com            | Contraexemplo estético; copiar só a arquitetura "Choose your action" (oferta por dor regulatória) e a página de integridade de primeira classe                               | Referência de IA e posicionamento, não de código                                                      |
| Verra                      | https://verra.org                    | Âncora institucional a citar, não imitar: selo/standard sempre com link para o documento normativo (VM0033)                                                                  | Atenção: novo registro Verra/S&P em 27/jul; citar "Verra Registry" genérico                           |
| Delta Blue Carbon          | https://deltabluecarbon.com          | Benchmark direto de blue carbon e prova da brecha: stats multidimensionais (tCO2e + ha + empregos + árvores), site WordPress/Elementor fraco. É o espaço que a Karaguá ocupa | Roubar só o modelo de dados dos stats e o padrão "parceiro + papel"                                   |
| Patch                      | https://www.patch.io                 | CTA humanizado ("fale com quem mede o manguezal") com rostos; jornada do comprador em 5 etapas nomeadas                                                                      | AnimatePresence no painel ativo; avatares circulares sobrepostos                                      |
| Carbon Direct (ex-Pachama) | https://www.carbon-direct.com        | Autoria científica com byline (nome, PhD, cargo, foto) em vez de marca anônima. Nota: pachama.com faz 301 para cá                                                            | Autores como entidades de primeira classe no CMS                                                      |

**As 3 norteadoras:** ⭐ **Isometric** (a tese "cada número tem uma fonte" como UI de primeira classe), ⭐ **darkroom.engineering** (o gabarito do idioma "amplo e blocado" + stack aberto), ⭐ **Locomotive** (temas nomeados por seção + índices editoriais hairline: a ponte entre o blocado e a inversão de tema).

---

## 4. A técnica Basic Agency: inversão de cor/tema via scroll

### 4.1 Mecânica reconstruída (do bundle de produção de basicagency.com, verificada)

1. **Tema = um par de CSS variables no `<html>`.** Inline: `--text-color: #252422ff; --background-color: #f4f4f4ff`. Cada seção (módulo do Sanity) declara seu `colorScheme {background, text}`.
2. **Trigger pela linha central do viewport**, não IntersectionObserver: scroll virtual próprio (seções em `transform: matrix` num loop RAF), `checkVisibility = (easedScroll + vh/2 - offset) / height`; quando `0 <= progresso < 1`, chama `updateColorScheme(scheme)`.
3. **Swap abrupto + interpolação 100% em CSS.** `updateColorScheme` (com guard contra re-set) só faz `documentElement.style.setProperty` das duas vars. Quem suaviza é o CSS: `body { background-color: var(--background-color); color: var(--text-color); transition: color .65s cubic-bezier(.72,0,.28,1), background-color .65s ...; will-change: background-color,color }`. Não é interpolado com o progresso e não usa GSAP (zero ocorrências no bundle).
4. **Header inverte em sincronia SEM mix-blend-mode**: `.header_background` consome `var(--background-color)` com a mesma transition; o texto do nav herda `color` do body. Sincronia de graça por compartilhar variável + curva + duração. (Importante para a Karaguá: blend-difference quebraria sobre as fotos full-bleed do manguezal.)
5. **Detalhes que vendem**: `::selection { background: var(--text-color); color: var(--background-color) }`; `data-theme-is-dark` no footer para assets que não herdam cor (SVGs).

Variantes trianguladas: Locomotive (temas NOMEADOS em `data-theme`, ideal para "mangue"/"dados"/"institucional"), Lusion (`data-color-*` por item, lerp em JS), GreenSock (ScrollTrigger `top center → bottom center` + tween do body, com `onLeaveBack` restaurando a cor anterior: https://codepen.io/GreenSock/pen/JoPpaXN), Smashing Magazine (IO com rootMargin negativo + direção de scroll: https://www.smashingmagazine.com/2021/07/dynamic-header-intersection-observer/).

### 4.2 Arquitetura recomendada para a Karaguá (React 19 + Tailwind v4 + motion v12)

**Tokens (fundação, sem quebrar o que existe):**

- Vars semânticas cruas em `:root` e sobrescritas por `[data-theme="deep"|"mangue"|"claro"|...]`: `--surface`, `--ink`, `--hairline`, `--accent`. Os temas nomeados reutilizam o que `.dark` (`style.css:119-150`) e `.surface-primary` (`style.css:334-347`) já provam funcionar.
- Expor via `@theme inline { --color-surface: var(--surface); ... }` (Tailwind v4, https://tailwindcss.com/docs/theme): `bg-surface`, `text-ink`, `border-hairline` seguem o tema automaticamente. Hairlines com `currentColor` + opacity invertem junto sem código extra.

**Mecanismo (variante sem GSAP, alinhada ao stack atual que usa só motion e vai remover `@gsap/react`):**

1. Seções passam a `bg-transparent`; um wrapper único (o div de `App.tsx:50`) vira o dono da superfície.
2. Um IntersectionObserver único com `rootMargin: '-50% 0% -50% 0%'` (simula a linha central da Basic) seta `data-theme` no `<html>`/wrapper. Zero leitura de layout por scroll (de quebra resolve o finding do ScrollRail).
3. Transição no CSS: `transition: background-color .65s cubic-bezier(.72,0,.28,1), color .65s ...` no wrapper/body. Para interpolar as próprias vars, registrar `@property syntax:"<color>"` com fallback em `background-color`/`color` (CSS vars não interpolam sozinhas em swap de classe).
4. **Remover o scroll-fade global** de `section.tsx:41-50` (os dois efeitos somados brigam; o fade não consta em spec nenhum).
5. `SiteHeader` (`site-header.tsx:46`) ganha layer de fundo consumindo `var(--surface)` com a mesma transition (padrão Basic, sem mix-blend-mode); `ScrollRail` (`scroll-rail.tsx:89-98`) troca as cores fixas k-deep/k-ink por tokens; `Cursor` já sobrevive por `mix-blend-difference` (`cursor.tsx:82-84`).
6. `::selection` invertida com as mesmas vars.

**Se o scroll-telling adotar GSAP ScrollTrigger no futuro** (SceneScrub, pins): ScrollTrigger vira o dono do scroll e o swap migra para `ScrollTrigger.create({ start: 'top 30%', end: 'bottom 30%', onToggle })` ou `gsap.to(':root', { '--surface': ... })` (GSAP anima CSS vars nativamente: https://gsap.com/docs/v3/GSAP/CorePlugins/CSS/). Nunca dois orquestradores de scroll simultâneos. Lenis opcional para o tom premium (`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`, https://github.com/darkroomengineering/lenis), desligado sob reduced-motion. Scrub CONTÍNUO de cor só em 1-2 costuras narrativas (ex.: hero escuro → primeira seção de dados clara).

**Fallbacks (cascata):**

- **prefers-reduced-motion:** a troca de tema PERMANECE (é informação semântica), mas instantânea (`transition-duration: .01s`); sem Lenis, sem pin/scrub. O bloco global de `style.css:284-293` já colapsa transições; em JS, `useReducedMotion()`/`matchMedia`.
- **Sem JS/erro de hidratação:** página nasce com o tema da primeira seção via CSS estático e cada seção mantém uma cor local própria; conteúdo nunca fica ilegível.
- **CSS scroll-driven animations (`animation-timeline: view()`):** só como enhancement decorativo atrás de `@supports` (Firefox só a partir do 155, iOS só 26+: https://caniuse.com/mdn-css_properties_animation-timeline_view). Nunca o mecanismo central num site B2B com prefeituras.

---

## 5. Proposta de emenda ao contrato

> **PROPOSTA. Nada abaixo entra em vigor sem aprovação explícita do Lucas.** As emendas resolvem contradições internas do contrato e formalizam a direção pedida (inversão de tema estilo Basic).

### 5.1 Spec/02-motion.md: nova regra "Transição de superfície entre seções" (novo §7)

Texto proposto:

> **§7 Transição de superfície (tema por scroll).**
>
> 1. A cor de fundo/texto da página é propriedade de um wrapper único; seções declaram `data-theme` (nomes: `claro`, `mangue`, `dados`, `carbon`), nunca cor hardcoded.
> 2. Gatilho: a seção que contém a linha central do viewport define o tema (IntersectionObserver, `rootMargin -50%/-50%`). Swap discreto; a suavização é 100% CSS: `transition .65s cubic-bezier(.72,0,.28,1)` em `background-color` e `color`.
> 3. Header, ScrollRail e `::selection` consomem as mesmas variáveis com o mesmo timing (sincronia por token, não por JS coordenado). Proibido `mix-blend-mode: difference` no header.
> 4. Interpolação contínua (scrub) de cor: exceção, máximo 2 costuras por página, registradas neste spec.
> 5. Sob `prefers-reduced-motion`: a troca de tema permanece, instantânea.
> 6. **Revoga o scroll-fade global do Section** (`section.tsx:41-50`): incompatível com a transição de superfície e nunca especificado.

Emendas de consistência no mesmo Spec/02:

- **Durações:** resolver a contradição interna (checklist :124 diz 150-300 ms; §0 :17-19 abençoa 0,5/0,6 s). Proposta: microinterações 150-300 ms; reveals ≤600 ms; transição de superfície 650 ms (exceção nomeada).
- **Lei "só transform/opacity" (:5, :90):** ou `clipWipe` (`motion.ts:56-62`) vira exceção documentada, ou é substituído por `maskRise`. `useSpring` do Magnetic (`magnetic.tsx:19-20`) sai (lerp linear, mesma técnica de `cursor.tsx:88-92`) ou vira exceção pointer-driven.
- **Orçamento:** registrar o scrub de Portas (`portas.tsx:40-120`) no orçamento de :97-109 (teto de 2 scrubs por página mantido).

### 5.2 Spec/01-design-system-blocado.md

- **Resolver a contradição hairline:** o PRD (`Spec/PRD.md:42-44`) e o Spec/04 (:35, :69) citam a ref 1 com grade hairline visível; o código consolidou hairline como idioma. Proposta: **hairline vence**; emendar Spec/01 §1.2 (:11-15, :147-148) para permitir hairline de grid (1px, cor via token `--hairline`), mantendo a proibição de bordas de card/recipiente.
- Adicionar os temas nomeados de superfície (§ novo) e manter a exigência dos tokens `--gutter`/`--block-max` (:36-41), ainda pendentes.

### 5.3 Spec/04-sections.md + Spec/PRD.md

- **Re-baseline:** atualizar o lineup para a narrativa V3 real ou reconverter o App; em qualquer cenário, corrigir os checkboxes falsos do §1 (hero com big numbers nunca existiu, confirmado por `git log -S`).
- **Refazer o gate de estilo do hero** (PRD §7): re-aprovar hero-v3 (e reescrever aceites) ou voltar ao contratado (sem corpo, faixa de big numbers com fonte).
- **Reincluir a seção "Para empresas"** (persona compradora, `Spec/PRD.md:86`) como 4ª porta/canal.
- **Fechar D1-D4** (`Spec/04:115-118`) numa rodada única com o dono, registrando os desvios já consumados (Impacto por clique, stats no Problema).
- **Métrica nova proposta no PRD §8:** "transição de superfície ativa em 100% das costuras entre seções; 0 cortes secos de cor".

### 5.4 Spec/03-copy.md

- Decidir se a regra 0 ("sem parágrafo") vale para a V3 (hoje é letra morta); adicionar **PDD** ao glossário (:96-103); registrar a regra do e-mail em domínio próprio.

---

## 6. Plano priorizado

Regra do PRD respeitada: **provar o estilo em UMA seção antes de propagar** (gate de estilo, `Spec/PRD.md:94-97`). Esforço: P/M/G. Impacto: alto/médio/baixo.

### Fase 0: honestidade e quick wins (esforço P, impacto alto)

| Item                                                                                                                                  | Esforço | Impacto       |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------- |
| Typo "maguezais" → "manguezais" (`pioneirismo.tsx:11`)                                                                                | P       | alto          |
| Travessões fora de subjects e credenciais (`cta-final.tsx:11-13`, `equipe.tsx:9,14`, `problema.tsx:28`)                               | P       | alto          |
| Âncora morta #solucao no footer (`footer.tsx:9`) → #diferencial                                                                       | P       | médio         |
| "8.000 ha" → "até 8.000 ha" com fonte externa (Pro Babitonga; CEPSUL/ICMBio)                                                          | P       | alto          |
| E-mail @gmail.com → domínio próprio (`site.ts:13`; SITE_URL já é karagua.com.br)                                                      | P       | alto          |
| Restaurar exibição de fonte no DataPoint (o popover existe no histórico: commit a146617) + fontes em Impacto/Laboratório/Karaguá Vivo | P/M     | **altíssimo** |

### Fase 1: performance e segurança (P-M, alto)

| Item                                                                                                                   | Esforço | Impacto |
| ---------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| Fotos → AVIF/WebP responsivo (<300 KB/variante) via `<picture>`/srcset; deletar img1/img2 (34 MB órfãos)               | M       | alto    |
| Loader: gate por sessionStorage, total ≤1,5 s, pular sob reduced-motion (`App.tsx:42-45`, `loader.tsx:47-48`)          | P       | alto    |
| Chave Stormglass → proxy server-side (`karagua-leaflet-map.js:573`)                                                    | M       | alto    |
| XSS: `innerHTML` → `createElement`/`textContent` (`karagua-leaflet-map.js:501-513`)                                    | P       | alto    |
| Geojson defaults 404 + Leaflet como dependência (ou SRI) (`:73,330,366-371`)                                           | P       | médio   |
| Pixel-beam: reduced-motion + pausa fora de viewport (`pixel-beam-background.tsx:213-268`)                              | P       | médio   |
| Supabase lazy-init + ProtectedRoute no chunk do /admin (`supabase.ts:13-16`, `App.tsx:17`)                             | P       | médio   |
| Remover `@gsap/react`, `roots-test.html`, pinar versões "latest", deletar 6 órfãos lp/                                 | P       | médio   |
| Radix Dialog na sidebar e no modal do Admin; delete com confirmação + erros propagados (`AdminPage.tsx:41-83,237-249`) | P       | médio   |

### Fase 2: re-baseline do contrato (M, alto)

Rodada única de decisão com o Lucas: contrato vigente (PRD vs V3), emendas da seção 5, D1-D4, gate do hero. Sem isso, toda auditoria futura dá resultado ambíguo.

### Fase 3: prova de estilo (gate antes de propagar)

| Item                                                                                                                                                                                                                                                                    | Esforço | Impacto  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| **PoC da inversão de tema (quick-win):** 1 costura (hero carbon → Problema claro), arquitetura da seção 4.2: wrapper dono da superfície, IO na linha central, tokens, transition .65s, reduced-motion instantâneo. Remover o scroll-fade do `section.tsx` nessa costura | **P**   | **alto** |
| Fase 0 do PRD: primitivas BlockGrid/FullBleed/SceneScrub + `--gutter`/`--block-max` (extrair SceneScrub do padrão já funcional de `portas.tsx:40-120`)                                                                                                                  | M       | alto     |
| Aprovação do dono sobre a costura piloto = gate para a Fase 4                                                                                                                                                                                                           | P       | alto     |

### Fase 4: propagação (G, alto)

Tema em todas as costuras + SiteHeader/ScrollRail/::selection sincronizados · SceneScrub no Karaguá Vivo (contador 01/04) · CtaFinal sobre foto full-bleed com scrim (padrão pronto no órfão `carbono-azul.tsx:52`; depende de D4/sourcing) · Equipe e fallback de Portas em blocos hard-edge · 4ª porta "Para empresas" com CTA específico por porta ("Receber o memorando do piloto") · reintroduzir argumento de mercado US$14→US$26 (Sylvera) e base legal (PEPSA/ProManguezal/Lei 15.042) · ritmo vertical em 2-3 alturas + dosagem do lima · consolidar 1-2 presets de display no lugar dos 4 clamps · footer no container Wide.

### Fase 5: diferenciação de setor (M-G, médio/alto a longo prazo)

Mini-ledger público de MRV estilo Charm/Isometric (mesmo pequeno: honestidade > escala) · notas de rodapé numeradas estilo Frontier com nota de incerteza nas projeções · indexação tipográfica dos blocos de evidência estilo Aino ("D01 Estoque de carbono") · bylines científicas estilo Carbon Direct · versão/data do dataset no footer estilo CarbonPlan.

---

_Relatório sintetizado a partir de 4 auditorias internas adversarialmente verificadas (58/58 findings confirmados em arquivo:linha) e 5 frentes de pesquisa externa (44 refs carregadas e conferidas em 2026-07-06). Proposta de emenda ao contrato aguarda aprovação do Lucas._

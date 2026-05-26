# Spec 04 — Critérios por seção

> Padrão de execução por seção. Cada uma referencia as primitivas do Spec 01 e
> os modos de motion do Spec 02. Ordem narrativa preservada (funil B2B).
> Cada seção passa por `impeccable shape` (brief) antes de `craft`.

Convenção: **Layout** (padrão visual) · **Motion** (Spec 02) · **Copy** (Spec 03)
· **Aceite** (checklist objetivo).

---

## 1. Hero — `hero.tsx`  (id `topo`)  ✅ entregue (Etapa #1)
- **Layout:** campo shell, **sem imagem**, sem bordas, texto mínimo. Heading
  display de forte contraste de peso (Thin + Bold `k-deep`) como impacto
  principal. Na base, faixa de **4 big numbers** impactantes (mono grande,
  `numberClassName` clamp ~2.5→5rem), separados só por espaço. `flex justify-between`
  ocupa a tela; zero linha/card.
- **Motion:** heading maskRise; big numbers fadeUp em stagger calmo; sem cascata.
- **Copy:** eyebrow + heading + 4 labels curtos + 2 CTAs. **Sem parágrafo de
  corpo** (mínimo possível). Unidade no label; número curto e impactante. Cada
  número com fonte (DataPoint popover).
- **Aceite:**
  - [x] Sem imagem; sem borda/linha/card; separação só por espaço.
  - [x] Big numbers grandes e impactantes, cada um com fonte rastreável.
  - [x] Heading de alto impacto por contraste de peso.
  - [x] Texto reduzido ao mínimo (corpo removido).
  - [x] CTAs: `Como funciona`→`#como-funciona`, primário→`#empresas`.

## 2. Problema — `problema.tsx`  (surface shell)
- **Layout:** `BlockGrid` tipográfico (ex.: 2x2 em md, full-bleed Wide). Número
  de contexto (7,4%; 1,4M ha) em célula própria. Sem card.
- **Motion:** reveal-on-view, 4 blocos em stagger.
- **Copy:** intro R (número + fonte MapBiomas); 4 blocos corpo ≤26.
- **Aceite:**
  - [ ] 4 blocos sem `rounded`/`border` de card; divisória só hairline do grid.
  - [ ] "US$14→US$26" mantém fonte Sylvera 2025.
  - [ ] Largura amplia além de `max-w-6xl`.

## 3. Karaguá Vivo — `karagua-vivo.tsx`  (id `como-funciona`, fog)
- **Layout:** `SceneScrub` de 4 cenas (Piloto, Manejo, Escala, Plataforma). Cada
  cena ocupa o palco: número da fase (mono grande) + título + corpo curto + tags
  em grade.
- **Motion:** **SceneScrub** (Spec 02), uma fase por vez; contador `01/04` mono;
  versão estática empilhada sob reduced motion.
- **Copy:** corpo ≤30; expandir Lei 15.133/2010 e BNDES Fundo Clima na 1ª
  ocorrência; números com fonte.
- **Aceite:**
  - [ ] Uma fase dominante por faixa de scroll.
  - [ ] Estático empilhado sob `prefers-reduced-motion`.
  - [ ] Tags sem virar cards arredondados decorativos.

## 4. Solução — `pillars.tsx`  (id `solucao`, shell)
- **Layout:** `BlockGrid` de 3 colunas full-bleed. Número do pilar em célula
  própria (sem travessão). Tag de metodologia em mono no rodapé da célula.
- **Motion:** reveal-on-view, 3 blocos em stagger.
- **Copy:** trocar `{n} — {label}` por composição sem travessão; corpo ≤28;
  expandir PSA; substituir "alta integridade" por fato verificável.
- **Aceite:**
  - [ ] Zero travessão (separador via layout ou `·`).
  - [ ] 3 blocos em grid hairline, sem card.
  - [ ] PSA expandido na 1ª ocorrência.

## 5. Base legal — `methodology-block.tsx`  (id `legal`, surface contraste)
- **Layout:** lista blocada full-bleed (linhas hairline), número/marker discreto.
  Considerar surface `carbon` para contraste tonal na sequência.
- **Motion:** reveal-on-view em stagger.
- **Copy:** 5 marcos K/R, corpo ≤24, sem travessão.
- **Aceite:**
  - [ ] Lista sem card; divisórias hairline.
  - [ ] Contraste AA mantido (sem `text-foreground/55`).
- **Nota DS:** o `CLAUDE.md` §5 descreve "Methodology Block" como superfície
  carbon com 4 data points (Método, Amostra n, Sobrevivência, Permanência). Hoje
  o componente foi reaproveitado para "Base legal". Decidir no `shape`: (a)
  manter como base legal, ou (b) restaurar o componente-assinatura e mover base
  legal para outra primitiva. **Requer decisão do usuário.**

## 6. Impacto — `carbono-azul.tsx`  (id `impacto`)
- **Layout:** `SceneScrub` (ou reveal, decidir no shape) revelando dado + dimensão
  por vez. 4 stats (DataPoint, já com fonte) + 4 dimensões.
- **Motion:** SceneScrub de 4 cenas OU reveal com parallax leve. Máx. 2 scrubs na
  página (este + Karaguá Vivo).
- **Copy:** dimensões corpo ≤26; expandir VM0033/VM0007 na 1ª ocorrência.
- **Aceite:**
  - [ ] 4 stats mantêm `sources`.
  - [ ] Dimensões sem card arredondado.
  - [ ] Se SceneScrub: versão estática sob reduced motion.

## 7. Para empresas — `guardioes.tsx`  (id `empresas`, fog)
- **Layout:** split full-bleed: coluna de benefícios (lista hairline) + painel
  comercial blocado (sem card arredondado, sem borda de card). CTA `size="lg"`.
- **Motion:** reveal-on-view, colunas em stagger.
- **Copy:** benefícios ≤22; features ≤8; "Alta integridade" exige prova ou
  reescrita; sem travessão.
- **Aceite:**
  - [ ] Painel comercial sem `rounded-md border` de card.
  - [ ] CTA mailto sem travessão no subject.
  - [ ] Superlativos com prova na página.

## 8. CTA final — `cta-final.tsx`  (id `contato`, fog)
- **Layout:** `FullBleed` com foto (mangue/Babitonga) + manchete display Thin
  sobreposta + 2 CTAs. Encerra a página em registro amplo, ecoando o Hero.
- **Motion:** reveal + parallax leve na foto.
- **Copy:** manchete K; corpo ≤30; **subject mailto sem `%E2%80%94`**.
- **Aceite:**
  - [ ] Foto full-bleed com scrim AA.
  - [ ] Subject do mailto sem travessão.
  - [ ] Composição amplia além da coluna central.

---

## Decisões pendentes (travar no `shape` de cada seção)

| # | Decisão | Quem decide |
| --- | --- | --- |
| D1 | Methodology Block: base legal ou restaurar componente-assinatura (§5) | usuário |
| D2 | Impacto: SceneScrub ou reveal | shape + usuário |
| D3 | Fontes exatas das 4 stats do Hero (qual doc de `karagua-context`) | shape, validar números |
| D4 | Sourcing de fotos adicionais (Babitonga) para CTA/seções | usuário (roadmap) |

## Ordem de execução (do PRD §7)

Fundação (01+02) → Hero → {Problema, Solução, Base legal} → {Karaguá Vivo,
Impacto} → {Para empresas, CTA final} → Polish global.

Cada fase fecha com `vp check --fix && vp build` verdes e, nas seções com motion,
verificação manual de `prefers-reduced-motion`.

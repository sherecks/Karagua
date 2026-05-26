# Spec 03 — Copy: enxugar e ancorar

> Toda copy sai de `karagua-context/context/` (brandbook, business plan,
> roadmap, metodologia, base legal, FAQ). Voz: **objetiva, institucional, com
> base técnica, próxima da comunidade**. Sem metáfora excessiva, dado e fato
> antes de retórica.

## 1. Regras de copy (invioláveis)

0. **Sem parágrafos: só headings.** Decisão do dono. A home não tem prosa
   corrida. Cada bloco é: eyebrow (label) + heading/sub-heading + tokens curtos
   de dado (número grande, código de metodologia, status, label de número) +
   CTA. Nada de `<p>` descritivo. Preferir cortar a explicar.
1. **Sem travessão (em dash) em copy.** Usar vírgula, dois-pontos,
   ponto-e-vírgula, ponto ou parênteses. Inclui `subject` de mailto.
2. **Cada número tem fonte inline.** Renderizou número, mostra a origem
   (padrão `DataPoint` com `sources`). Número sem fonte sai da página.
3. **Cada palavra ganha o lugar.** Sem manchete que repete o eyebrow, sem
   intro que repete o título.
4. **Acrônimo expande na primeira ocorrência:** PSA, MRV, REDD+, VM0033/VM0007,
   PEPSA, CONAMA, BNDES Fundo Clima. Uma linha de glossário inline.
5. **Mono só para dado verificável** (número, coordenada, código de metodologia).

## 2. Budget de copy por seção (alvo enxuto)

| Seção | Eyebrow | Manchete | Corpo | Itens |
| --- | --- | --- | --- | --- |
| Hero | ≤ 6 palavras | ≤ 10 palavras | ≤ 28 palavras | 4 stats (label ≤ 8 palavras) |
| Problema | ≤ 3 | ≤ 9 | ≤ 24 (intro) | 4 blocos, corpo ≤ 26 cada |
| Karaguá Vivo | ≤ 3 | ≤ 7 | — | 4 fases, corpo ≤ 30 cada |
| Solução | ≤ 3 | ≤ 12 | — | 3 pilares, corpo ≤ 28 cada |
| Base legal | ≤ 5 | ≤ 6 | ≤ 22 | 5 marcos, corpo ≤ 24 cada |
| Impacto | ≤ 2 | ≤ 6 | ≤ 20 | 4 dados + 4 dimensões ≤ 26 |
| Para empresas | ≤ 3 | ≤ 10 | ≤ 28 | 4 benefícios ≤ 22 + 5 features ≤ 8 |
| CTA final | ≤ 2 | ≤ 9 | ≤ 30 | 2 botões |

> Budget é teto, não meta. Curto e verdadeiro vence longo e completo.

## 3. Inventário e decisões por seção

Legenda de decisão: **K** manter · **R** reescrever (enxugar/ancorar) · **C** cortar.

### Hero (`hero.tsx`)
| Item | Atual | Decisão | Alvo |
| --- | --- | --- | --- |
| Manchete | "O manguezal é um ativo climático. Tratamos ele como tal." | K | manter (forte, dentro do budget) |
| Corpo | descrição da Karaguá Ecotech (28 palavras) | R | enxugar para ≤ 28, sem jargão não expandido |
| Stat 380 ha | sem fonte | **R** | adicionar fonte (`karagua-context/13-roadmap` ou business-plan) |
| Stat R$1.2M/ano | sem fonte | **R** | fonte = estimativa interna datada (business-plan) |
| Stat 8.000 ha | sem fonte | **R** | fonte = plano de expansão (06-territorio) |
| Stat 400+ famílias | sem fonte | **R** | fonte = impacto socioambiental (10-impacto) |

### Problema (`problema.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| Intro "7,4% / 1,4M ha" | R | manter número, anexar fonte (MapBiomas, já usada em Impacto) |
| 4 blocos | R | enxugar corpo ≤ 26 palavras; "US$14→US$26 (Sylvera 2025)" mantém fonte |

### Karaguá Vivo (`karagua-vivo.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| 4 fases (Piloto/Manejo/Escala/Plataforma) | R | corpo ≤ 30; vira 4 cenas SceneScrub; números (380 ha, R$1,2M, 8.000 ha) com fonte; expandir Lei 15.133/2010 e BNDES Fundo Clima na 1ª ocorrência |

### Solução (`pillars.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| Separador `{n} — {label}` | **R** | trocar travessão por `·` ou layout (número em célula própria) |
| 3 pilares | R | corpo ≤ 28; expandir PSA na 1ª ocorrência |
| "alta integridade" | R | trocar superlativo por fato verificável ou definir operacionalmente |

### Base legal (`methodology-block.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| 5 marcos legais | K/R | manter (já ancorado em lei/decreto); corpo ≤ 24; sem travessão |

### Impacto (`carbono-azul.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| 4 stats com `DataPoint` | K | já têm fonte; manter padrão |
| 4 dimensões | R | corpo ≤ 26; expandir VM0033/VM0007 na 1ª ocorrência da página |

### Para empresas (`guardioes.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| 4 benefícios | R | enxugar ≤ 22; "Alta integridade climática" precisa de prova na página |
| Card comercial | R | vira painel blocado (sem card arredondado); 5 features ≤ 8 palavras |

### CTA final (`cta-final.tsx`)
| Item | Decisão | Alvo |
| --- | --- | --- |
| `subject` mailto com `%E2%80%94` (em dash) | **R** | remover travessão do subject |
| Manchete + corpo | R | manter tom; corpo ≤ 30 |

## 4. Glossário inline (primeira ocorrência)

| Termo | Expansão (1 linha) |
| --- | --- |
| PSA | Pagamento por Serviços Ambientais |
| MRV | Monitoramento, Relato e Verificação |
| REDD+ | metodologia VM0007 da Verra para florestas/manguezais |
| VM0033 | metodologia Verra para restauração de zonas úmidas costeiras |
| PEPSA | Política Estadual de Serviços Ambientais (SC), Lei 15.133/2010 |
| BNDES Fundo Clima | linha de financiamento federal para projetos de PSA |

## 5. Auditoria de honestidade (pré-merge)

```bash
# 1. Nenhum travessão em copy
rg -n "—|–|--" src/components src/lib/site.ts

# 2. Todo número visível tem fonte (revisão manual guiada)
rg -n "[0-9][0-9.,]*\s*(ha|%|R\$|US\$|tCO|M|B|mil|bilh)" src/components

# 3. Superlativos exigem prova na mesma página
rg -n -i "alta integridade|auditável|verificável|líder|melhor|único" src/components
```

Cada hit do passo 2 e 3 precisa de fonte/definição na página ou é reescrito.

### Critérios de aceite — copy

- [ ] `rg "—" src/components` retorna vazio.
- [ ] Todo número renderizado tem `sources` (DataPoint) ou citação inline.
- [ ] Cada acrônimo da seção 4 expandido na 1ª ocorrência.
- [ ] Corpo de cada seção dentro do budget da seção 2.
- [ ] Toda copy rastreável a um doc de `karagua-context/context/`.

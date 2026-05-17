# Fontes

## Aileron (obrigatória — tipografia primária do DS)

Auto-hospedada (não vem de CDN). Os 5 pesos do DS já estão aqui em `.woff2`,
com os nomes referenciados em `src/style.css`:

| Peso         | Arquivo                  |
| ------------ | ------------------------ |
| 100 Thin     | `aileron-thin.woff2`     |
| 300 Light    | `aileron-light.woff2`    |
| 400 Regular  | `aileron-regular.woff2`  |
| 600 SemiBold | `aileron-semibold.woff2` |
| 700 Bold     | `aileron-bold.woff2`     |

A hierarquia do DS depende do contraste de peso (Thin 100 ↔ Bold 700);
Thin/Regular/Bold são pré-carregados no `index.html`.

### Originais e reconversão

Os `.otf` originais (16 pesos, incluindo itálicos) ficam em
`design/fonts-src/aileron/` — **fora** de `public/`, então não vão para o
build. Para (re)gerar um `.woff2` a partir de um original:

```bash
fonttools ttLib.woff2 compress \
  -o public/fonts/aileron-<peso>.woff2 \
  design/fonts-src/aileron/Aileron-<Peso>.otf
```

Só adicione um novo peso ao `@font-face` em `src/style.css` se o DS realmente
o exigir (regra: hierarquia por contraste de peso, sem inflar o que carrega).

## JetBrains Mono (dados verificáveis)

Carregada via Google Fonts no `index.html`. Uso restrito a números
verificáveis, coordenadas e citações; nunca como fonte de corpo.

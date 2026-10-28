# Capas dos programas do Exclusivo (900×1200)

A capa do cartão do programa em /exclusivo (`exclusive_programs.cover_url`). Aparece a 96×128 no telemóvel e a 112×149 no desktop: o nome do programa e o logo têm de se ler nesse tamanho.

```bash
node scripts/capas/programa/render.mjs scripts/capas/programa/noticias-v3a.html ~/Downloads/capa.jpg
```

| Ficheiro | Estado |
|---|---|
| `noticias-v3a.html` | **Em uso** desde 28/10/2026 (`media-library/programa-capa-noticias-olha-que-duas-v3.jpg`): logo grande atravessado por uma onda sonora, luz «No ar», «Notícias» em Playfair itálico |
| `noticias-v1.html`, `noticias-v2.html`, `noticias-v3b.html` | Alternativas não escolhidas (primeira página de jornal, índice de redação, logo com auscultadores) |

Para trocar a capa, sobe-a com um nome novo (o Storage fica em cache) e atualiza o `cover_url`; não apagues a antiga.

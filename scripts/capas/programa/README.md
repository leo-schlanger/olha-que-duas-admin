# Capas dos programas do Exclusivo (900×1200)

A capa do cartão do programa em /exclusivo (`exclusive_programs.cover_url`). Aparece a 96×128 no telemóvel e a 112×149 no desktop: o nome do programa e o logo têm de se ler nesse tamanho.

```bash
node scripts/capas/programa/render.mjs scripts/capas/programa/noticias-v3a.html ~/Downloads/capa.jpg
```

| Ficheiro | Estado |
|---|---|
| `noticias-v3a.html` | **Em uso** desde 28/10/2026 (`media-library/programa-capa-noticias-olha-que-duas-v3.jpg`): logo grande atravessado por uma onda sonora, luz «No ar», «Notícias» em Playfair itálico |
| `lendas-v1.html` | Lendas de Portugal (30/10/2026): aldeia de granito à noite tirada do kit dos reels (`assets/lendas-fundo.jpg`), logo no canto superior esquerdo, «Lendas» em IM Fell a 268 px |
| `ceu-de-cada-mes-v2.html` | **Em uso** Céu de Cada Mês (16/11/2026, `media-library/programa-capa-ceu-de-cada-mes-v2.jpg`): arte do Grok com glifos do aro corrigidos e o medalhão na moldura (`assets/ceu/programa-900x1200.jpg`) |
| `ceu-de-cada-mes-v1.html` | Céu de Cada Mês v1 em SVG, substituída («muito pobre», Leo) (16/11/2026, `media-library/programa-capa-ceu-de-cada-mes.jpg`): «Céu» em Cinzel a 250 px, roda zodiacal com o medalhão da Teresa a 1:1 no centro (128 px nativos; pedir o original maior para um retrato nítido) |
| `top10-v1.html` | **Em uso** Top 10 (20/11/2026, `media-library/programa-capa-top-10.jpg`): medalhão `assets/programas/top10-medalhao.jpg` |
| `vidioteca-v1.html` | **Em uso** Vidioteca Olha que Duas (20/11/2026, `media-library/programa-capa-vidioteca-olha-que-duas.jpg`): claquete `assets/programas/vidioteca-claquete*.svg` |
| `cantinho-v1.html` | **Em uso** Cantinho da Pequenada (20/11/2026, `media-library/programa-capa-cantinho-da-pequenada.jpg`): selo `assets/programas/cantinho-selo.png` |
| `entrevistas-v1.html` | **Em uso** Entrevistas (20/11/2026, `media-library/programa-capa-entrevistas.jpg`) |
| `noticias-v1.html`, `noticias-v2.html`, `noticias-v3b.html` | Alternativas não escolhidas (primeira página de jornal, índice de redação, logo com auscultadores) |

Para trocar a capa, sobe-a com um nome novo (o Storage fica em cache) e atualiza o `cover_url`; não apagues a antiga.

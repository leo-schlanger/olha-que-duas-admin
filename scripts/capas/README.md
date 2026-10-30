# Capas do Exclusivo

Gerador das capas das peças do Exclusivo Olha que Duas. Cada programa tem a sua
identidade, e todas levam o logo redondo do Olha que Duas no canto superior esquerdo.

```bash
node scripts/capas/gerar.mjs scripts/capas/pecas/<slug>.json --out ~/Downloads/capas
```

Sai sempre um par:

| Ficheiro | Tamanho | Onde aparece | Título escrito |
|---|---|---|---|
| `<slug>-capa.jpg` | 1600×1000 (16:10) | `cover_url`: topo da peça, destaque e miniaturas do programa | Não (o H1 está logo acima) |
| `<slug>-og.jpg` | 1200×630 | `og_image_url`: partilha no Facebook, WhatsApp, X, Google | Sim |

## Um estilo por programa (`programas.mjs`)

| Programa | Estilo |
|---|---|
| Olha que Duas e Eu (Eduardo Vinagre) | Bordô e dourado, título Anton em maiúsculas, selo vermelho «Exclusivo», retrato do Eduardo |
| Curtas Biografias (Alexandra Serra) | Capa de livro: azul-noite, serifa Cormorant, filete dourado à volta |
| Pimenta na Língua (Alexandra Serra) | Papel creme, aspas grandes e vermelho malagueta, Playfair, selo «Opinião» |
| Mente Aberta (Marluce Revorêdo) | Verde-salva suave, Fraunces, foto num arco, folha |
| Notícias Olha que Duas | Rodapé de telejornal: etiqueta vermelha «Notícias» + data, título Inter |
| Lendas de Portugal | Teatro de sombras à luz da vela: noite de granito, IM Fell (romana, itálica e versaletes), âmbar de vela. Foto = ilustração 16:10 do kit dos reels (`Desktop/video/projetos/lendas-portugal-2026/arte/site/_arte/`) |

## Ficha da peça (`pecas/<slug>.json`)

```json
{
  "slug": "rute-cardoso",
  "programa": "curtas-biografias",
  "foto": "https://…/media-library/capa-fonte-rute-cardoso.jpg",
  "foco": "50% 22%",
  "data": "24 out 2026",
  "titulo": "Rute Cardoso, *a corrida contra o luto*",
  "linha": "«Espero que estejas orgulhoso de mim»"
}
```

- `foto`: foto limpa, sem texto. Guardar no media-library como `capa-fonte-<slug>.jpg`.
- `foco`: o ponto da foto que fica sempre à vista (`object-position`). Afinar até a cara não ser cortada.
- `titulo`: curto (até ~60 caracteres). `*assim*` fica com a cor de destaque do programa.
- `data`: só o Notícias a mostra.
- `kicker` (opcional) troca o selo: «Notícia» em vez de «Exclusivo», por exemplo.
- `tituloNaCapa: true` (opcional) escreve também o título na capa do site.

O script avisa se o título não couber e falha se uma imagem não carregar.

## Publicar

1. Enviar os dois JPEG para o media-library como `exclusivo-<slug>-capa.jpg` e `exclusivo-<slug>-og.jpg`.
2. Pôr esses URLs em `cover_url` e `og_image_url` (no painel ou no SQL da peça).
3. Preencher «No Google» (título curto até 55, descrição até 155) no painel.

O sitemap é automático desde 2026-10-24 (`/api/sitemap` no site): a peça entra sozinha,
mesmo agendada, quando passa a hora.

## Dependências

Usa o `playwright-core` e o Chromium já instalados (`~/.cache/ms-playwright`). Procura o
`playwright-core` em `node_modules` deste repo e, se não houver, no repo do site
(`../olha-que-duas`); `PLAYWRIGHT_CORE` e `CHROMIUM_PATH` forçam outro caminho.
As fontes (OFL, Google Fonts) estão em `fonts/`.

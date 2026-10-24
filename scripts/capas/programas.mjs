// One visual identity per Exclusivo program. Sizes use --u (1px at 630 tall).
// Colours come from each program's poster on /exclusivo.

const byline = (d, extra = "") => `
  <div class="by ${extra}">
    ${d.retrato ? `<span class="pt" style="background-image:url('${d.retrato}')"></span>` : ""}
    <span class="bt"><b>${d.programa}</b><i>${d.autor}</i></span>
  </div>`;

const headline = (d) =>
  d.titulo
    ? `<div class="tx" data-fit>
        <span class="k">${d.kicker}</span>
        <h1>${d.titulo}</h1>
        ${d.linha ? `<p>${d.linha}</p>` : ""}
      </div>`
    : "";

export const programas = {
  // Eduardo Vinagre: the scoop column. Burgundy and gold, condensed headline.
  "olha-que-duas-e-eu": {
    titulo: "Olha que Duas e Eu",
    autor: "por Eduardo Vinagre",
    kicker: "Exclusivo",
    retrato: "eduardo-vinagre.jpg",
    classe: "vin",
    html: (d) => `
      <div class="ph" style="background-image:url('${d.foto}');background-position:${d.foco}"></div>
      <div class="shade"></div>
      ${headline(d)}
      ${byline(d)}
      <div class="bar"></div>`,
    css: `
.vin{background:#16040a}
.vin .shade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(22,4,10,.92) 0%,rgba(22,4,10,.35) 26%,rgba(22,4,10,0) 45%)}
.vin.com-titulo .ph{left:36%}
.vin.com-titulo .shade{background:
  linear-gradient(90deg,#16040a 0%,#16040a 36%,rgba(22,4,10,.75) 46%,rgba(22,4,10,0) 66%),
  linear-gradient(0deg,rgba(22,4,10,.8) 0%,rgba(22,4,10,0) 30%)}
.vin .tx{position:absolute;left:calc(34*var(--u));top:calc(150*var(--u));width:52%;max-height:calc(330*var(--u));overflow:hidden}
.vin .k{display:inline-block;background:#c8241b;color:#fff;font:800 calc(17*var(--u))/1 Inter;letter-spacing:.14em;text-transform:uppercase;padding:calc(8*var(--u)) calc(12*var(--u));border-radius:calc(3*var(--u))}
.vin h1{margin-top:calc(16*var(--u));font:400 calc(68*var(--u))/.98 Anton;color:#fff;text-transform:uppercase;letter-spacing:.005em;text-shadow:0 calc(2*var(--u)) calc(14*var(--u)) rgba(0,0,0,.5)}
.vin h1 em{font-style:normal;color:#f2b84b}
.vin h1 .g{font-family:Oswald;font-weight:600}
.vin .tx p{margin-top:calc(14*var(--u));font:600 calc(21*var(--u))/1.3 Inter;color:#f3e3c6}
.vin .by{position:absolute;left:calc(34*var(--u));bottom:calc(30*var(--u));display:flex;align-items:center;gap:calc(12*var(--u))}
.vin .pt{width:calc(54*var(--u));height:calc(54*var(--u));border-radius:50%;background-size:cover;background-position:center 30%;border:calc(2.5*var(--u)) solid #f2b84b}
.vin .bt{display:flex;flex-direction:column;gap:calc(3*var(--u))}
.vin .bt b{font:800 calc(13*var(--u))/1 Inter;letter-spacing:.2em;text-transform:uppercase;color:#f2b84b}
.vin .bt i{font:500 calc(17*var(--u))/1.1 Inter;font-style:normal;color:#fff}
.vin .bar{position:absolute;left:0;right:0;bottom:0;height:calc(6*var(--u));background:linear-gradient(90deg,#c8241b 0 30%,#f2b84b 30%)}`,
  },

  // Alexandra Serra's portraits: a book cover. Night blue, serif, hairline frame.
  "curtas-biografias": {
    titulo: "Curtas Biografias",
    autor: "por Alexandra Serra",
    kicker: "Curtas Biografias",
    retrato: "",
    classe: "cb",
    html: (d) => `
      <div class="ph" style="background-image:url('${d.foto}');background-position:${d.foco}"></div>
      <div class="shade"></div>
      <div class="frame"></div>
      ${headline(d)}
      ${byline(d)}`,
    css: `
.cb{background:#0a101c}
.cb .ph{filter:saturate(.88) contrast(1.04)}
.cb .shade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,12,22,.9) 0%,rgba(8,12,22,.25) 34%,rgba(8,12,22,0) 55%)}
.cb.com-titulo .ph{left:34%}
.cb.com-titulo .shade{background:
  linear-gradient(90deg,#0a101c 0%,#0a101c 34%,rgba(10,16,28,.7) 45%,rgba(10,16,28,0) 64%),
  linear-gradient(0deg,rgba(10,16,28,.6) 0%,rgba(10,16,28,0) 28%)}
.cb .frame{position:absolute;inset:calc(14*var(--u));border:1px solid rgba(216,185,128,.55);pointer-events:none}
.cb .tx{position:absolute;left:calc(44*var(--u));top:calc(156*var(--u));width:50%;max-height:calc(330*var(--u));overflow:hidden}
.cb .k{display:flex;align-items:center;gap:calc(14*var(--u));font:600 calc(14*var(--u))/1 Inter;letter-spacing:.34em;text-transform:uppercase;color:#d8b980}
.cb .k::after{content:"";flex:0 0 calc(70*var(--u));height:1px;background:#d8b980}
.cb h1{margin-top:calc(18*var(--u));font:600 calc(64*var(--u))/1.02 Cormorant;color:#fbf6ec;letter-spacing:-.005em}
.cb h1 em{font-style:italic;font-weight:500;color:#e2c48d}
.cb .tx p{margin-top:calc(14*var(--u));font:italic 500 calc(26*var(--u))/1.25 Cormorant;color:#e9dfcc}
.cb .by{position:absolute;left:calc(44*var(--u));bottom:calc(40*var(--u))}
.cb .bt{display:flex;flex-direction:column;gap:calc(6*var(--u))}
.cb .bt b{font:600 calc(30*var(--u))/1 Cormorant;color:#fbf6ec;letter-spacing:.01em}
.cb .bt i{font:italic 500 calc(19*var(--u))/1 Cormorant;color:#d8b980}
.cb.com-titulo .bt b{display:none}
.cb.sem-titulo .bt b{font-size:calc(46*var(--u))}
.cb.sem-titulo .bt i{font-size:calc(24*var(--u))}`,
  },

  // Alexandra Serra's opinion: cream paper, chili red, a big quotation mark.
  "pimenta-na-lingua": {
    titulo: "Pimenta na Língua",
    autor: "Alexandra Serra",
    kicker: "Opinião",
    retrato: "alexandra-serra.jpg",
    classe: "pim",
    html: (d) => `
      <div class="ph" style="background-image:url('${d.foto}');background-position:${d.foco}"></div>
      <div class="paper"></div>
      <div class="q">“</div>
      ${headline(d)}
      ${byline(d)}
      <div class="band"></div>`,
    css: `
.pim{background:#f5ede0}
.pim .ph{left:52%}
.pim .paper{position:absolute;inset:0 48% 0 0;background:#f5ede0}
.pim .paper::after{content:"";position:absolute;top:0;bottom:0;right:calc(-1*var(--u));width:calc(8*var(--u));background:#c4271b}
.pim.sem-titulo .ph{left:40%}
.pim.sem-titulo .paper{right:60%}
.pim .q{position:absolute;left:calc(150*var(--u));top:calc(-30*var(--u));font:900 calc(260*var(--u))/1 Playfair;color:#c4271b;opacity:.14}
.pim .tx{position:absolute;left:calc(40*var(--u));top:calc(160*var(--u));width:44%;max-height:calc(330*var(--u));overflow:hidden}
.pim .k{display:inline-block;background:#c4271b;color:#fff;font:800 calc(14*var(--u))/1 Inter;letter-spacing:.2em;text-transform:uppercase;padding:calc(8*var(--u)) calc(12*var(--u));border-radius:calc(30*var(--u))}
.pim h1{margin-top:calc(18*var(--u));font:800 calc(56*var(--u))/1.06 Playfair;color:#2b1510;letter-spacing:-.01em}
.pim h1 em{font-style:italic;color:#c4271b}
.pim .tx p{margin-top:calc(14*var(--u));font:500 calc(20*var(--u))/1.35 Inter;color:#5a3a30}
.pim .by{position:absolute;left:calc(40*var(--u));bottom:calc(34*var(--u));display:flex;align-items:center;gap:calc(12*var(--u))}
.pim .pt{width:calc(54*var(--u));height:calc(54*var(--u));border-radius:50%;background-size:cover;background-position:center 25%;border:calc(2.5*var(--u)) solid #c4271b}
.pim .bt{display:flex;flex-direction:column;gap:calc(4*var(--u))}
.pim .bt b{font:800 calc(22*var(--u))/1 Playfair;color:#c4271b}
.pim .bt i{font:600 calc(14*var(--u))/1 Inter;font-style:normal;letter-spacing:.16em;text-transform:uppercase;color:#2b1510}
.pim.sem-titulo .q{left:calc(26*var(--u));top:calc(140*var(--u));font-size:calc(220*var(--u))}
.pim.sem-titulo .by{flex-direction:column;align-items:flex-start;bottom:auto;top:calc(290*var(--u));gap:calc(18*var(--u))}
.pim.sem-titulo .bt{gap:calc(16*var(--u))}
.pim.sem-titulo .bt b{font-size:calc(52*var(--u));line-height:1.02;width:calc(300*var(--u))}
.pim .band{display:none}`,
  },

  // Marluce Revorêdo: calm reflection. Sage, soft serif, photo in an arch.
  "mente-aberta": {
    titulo: "Mente Aberta",
    autor: "com Marluce Revorêdo",
    kicker: "Reflexão",
    retrato: "marluce-revoredo.jpg",
    classe: "ma",
    html: (d) => `
      <div class="arch"><div class="ph" style="background-image:url('${d.foto}');background-position:${d.foco}"></div></div>
      <svg class="leaf" viewBox="0 0 120 40"><path d="M2 20 C 40 20, 70 20, 118 20" stroke="#6e8b68" stroke-width="2" fill="none"/>
        <path d="M60 20 C 66 6, 82 2, 92 6 C 86 16, 72 22, 60 20 Z" fill="#8fae86"/><path d="M48 20 C 42 30, 30 36, 20 32 C 26 24, 38 18, 48 20 Z" fill="#a9c39f"/></svg>
      ${headline(d)}
      ${byline(d)}`,
    css: `
.ma{font-optical-sizing:none;font-variation-settings:"opsz" 36,"WONK" 0;font-variant-ligatures:no-common-ligatures no-discretionary-ligatures;background:radial-gradient(120% 120% at 0% 0%,#f6f3ea 0%,#e8eee2 60%,#dfe8d9 100%)}
.ma .arch{position:absolute;right:calc(44*var(--u));top:calc(40*var(--u));bottom:0;width:38%;border-radius:999px 999px 0 0;overflow:hidden;box-shadow:0 0 0 calc(6*var(--u)) #f6f3ea,0 0 0 calc(7.5*var(--u)) #b7c9ad}
.ma.sem-titulo .arch{width:46%}
.ma .leaf{position:absolute;left:calc(40*var(--u));top:calc(140*var(--u));width:calc(120*var(--u))}
.ma .tx{position:absolute;left:calc(40*var(--u));top:calc(190*var(--u));width:50%;max-height:calc(300*var(--u));overflow:hidden}
.ma *{font-optical-sizing:none!important;font-feature-settings:"liga" 0,"dlig" 0!important;font-variation-settings:"opsz" 24,"SOFT" 50,"WONK" 0!important}
.ma .k{font:500 calc(24*var(--u))/1 Fraunces;letter-spacing:.02em;color:#4d6b50}
.ma h1{margin-top:calc(14*var(--u));font:500 calc(60*var(--u))/1.08 Fraunces;color:#2c372c;letter-spacing:-.01em;font-variation-settings:"opsz" 24,"SOFT" 100,"WONK" 0}
.ma h1 em{font-style:italic;color:#8a4536}
.ma .tx p{margin-top:calc(14*var(--u));font:400 calc(20*var(--u))/1.4 Inter;color:#4a564a}
.ma .by{position:absolute;left:calc(40*var(--u));bottom:calc(34*var(--u));display:flex;align-items:center;gap:calc(12*var(--u))}
.ma .pt{width:calc(54*var(--u));height:calc(54*var(--u));border-radius:50%;background-size:cover;background-position:center 25%;border:calc(2.5*var(--u)) solid #8fae86}
.ma .bt{display:flex;flex-direction:column;gap:calc(4*var(--u))}
.ma .bt b{font:600 calc(20*var(--u))/1 Fraunces;color:#2c372c}
.ma .bt i{font:italic 400 calc(16*var(--u))/1 Fraunces;color:#4d6b50}
.ma.sem-titulo .by{flex-direction:column;align-items:flex-start;bottom:auto;top:calc(200*var(--u));gap:calc(16*var(--u))}
.ma.sem-titulo .pt{display:none}
.ma.sem-titulo .bt b{font:500 calc(62*var(--u))/1 Fraunces;letter-spacing:-.01em;color:#2c372c}
.ma.sem-titulo .bt i{font-size:calc(26*var(--u))}`,
  },

  // House news: a broadcast lower third over the full photo.
  "noticias-olha-que-duas": {
    titulo: "Notícias Olha que Duas",
    autor: "",
    kicker: "Notícias",
    retrato: "",
    classe: "nt",
    html: (d) => `
      ${
        d.inteira
          ? `<div class="ph blur" style="background-image:url('${d.foto}')"></div>
             <div class="ph fit" style="background-image:url('${d.foto}')"></div>`
          : `<div class="ph" style="background-image:url('${d.foto}');background-position:${d.foco}"></div>`
      }
      <div class="shade"></div>
      <div class="lt">
        <div class="tag"><span>${d.kicker}</span>${d.data ? `<time>${d.data}</time>` : ""}</div>
        ${d.titulo ? `<div class="tx" data-fit><h1>${d.titulo}</h1>${d.linha ? `<p>${d.linha}</p>` : ""}</div>` : ""}
      </div>`,
    css: `
.nt{background:#1a0a10}
.nt .ph.blur{inset:-40px;background-position:center;filter:blur(26px) brightness(.55) saturate(1.1)}
.nt .ph.fit{left:auto;right:5%;width:56%;bottom:24%;top:3%;background-size:contain;background-position:center;
  filter:drop-shadow(0 calc(10*var(--u)) calc(30*var(--u)) rgba(0,0,0,.5))}
.nt.sem-titulo .ph.fit{right:50%;transform:translateX(50%);width:76%;top:4%;bottom:13%}
.nt .shade{position:absolute;inset:0;background:linear-gradient(0deg,rgba(26,6,12,.94) 0%,rgba(26,6,12,.72) 30%,rgba(26,6,12,0) 62%)}
.nt.sem-titulo .shade{background:linear-gradient(0deg,rgba(26,6,12,.75) 0%,rgba(26,6,12,0) 30%)}
.nt .lt{position:absolute;left:calc(34*var(--u));right:calc(34*var(--u));bottom:calc(34*var(--u))}
.nt .tag{display:flex;align-items:stretch;font:800 calc(15*var(--u))/1 Inter;letter-spacing:.18em;text-transform:uppercase}
.nt .tag span{background:#c8241b;color:#fff;padding:calc(9*var(--u)) calc(14*var(--u))}
.nt .tag time{background:#f2c14e;color:#2a0d12;padding:calc(9*var(--u)) calc(14*var(--u));letter-spacing:.08em}
.nt .tx{margin-top:calc(16*var(--u));padding-top:calc(16*var(--u));border-top:calc(2*var(--u)) solid rgba(242,193,78,.7);max-height:calc(200*var(--u));overflow:hidden}
.nt h1{font:800 calc(44*var(--u))/1.1 Inter;color:#fff;letter-spacing:-.015em;max-width:92%}
.nt h1 em{font-style:normal;color:#f2c14e}
.nt .tx p{margin-top:calc(10*var(--u));font:500 calc(19*var(--u))/1.35 Inter;color:#eadfd6}`,
  },
};

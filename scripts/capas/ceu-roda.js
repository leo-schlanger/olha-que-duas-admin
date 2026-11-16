// Céu de Cada Mês: zodiac wheel + starfield as SVG strings.
// Plain script (no import/export): loaded by programas.mjs and by programa/ceu-de-cada-mes-v1.html.
(function () {
  const SIGNOS = ["Carneiro", "Touro", "Gémeos", "Caranguejo", "Leão", "Virgem",
    "Balança", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"];
  const GOLD = "#e3c27e";
  const LINE = "rgba(214,204,255,.42)";
  const rad = (a) => (a * Math.PI) / 180;
  const pt = (r, a) => [+(r * Math.cos(rad(a))).toFixed(2), +(r * Math.sin(rad(a))).toFixed(2)];

  // Sun signs that fall in a month (1-12): the one ending and the one starting around the 21st.
  const signosDoMes = (m) => [(m + 8) % 12, (m + 9) % 12];

  // Wheel in a -320..320 viewBox. Signs run clockwise so the month's pair reads left to right;
  // the wheel turns so that pair sits at the top.
  // signos: optional list of sign names to light instead of the month's pair; "todos" lights all
  // twelve without sectors (an episode about every sign).
  function roda({ mes = 0, signos, id = "r" } = {}) {
    const todos = signos === "todos";
    const hi = Array.isArray(signos) && signos.length
      ? signos.map((n) => SIGNOS.indexOf(n)).filter((i) => i >= 0).sort((a, b) => a - b)
      : mes ? signosDoMes(mes) : [];
    // the lit group is consecutive except across Peixes→Carneiro: start after the gap
    let first = hi[0] ?? 0;
    for (let k = 1; k < hi.length; k++) if (hi[k] - hi[k - 1] > 1) first = hi[k];
    const delta = hi.length ? -90 - 30 * first - 15 * hi.length : 180;
    const R1 = 300, R2 = 284, R3 = 222, R4 = 208, R5 = 150;
    let s = "";
    // soft glow behind the wheel
    s += `<defs><radialGradient id="${id}g"><stop offset="0" stop-color="#6b4fc4" stop-opacity=".38"/><stop offset=".6" stop-color="#3a2a80" stop-opacity=".12"/><stop offset="1" stop-color="#1a1440" stop-opacity="0"/></radialGradient></defs>`;
    s += `<circle r="318" fill="url(#${id}g)"/>`;
    // highlighted sectors
    for (const i of todos ? [] : hi) {
      const a0 = 30 * i + delta, a1 = 30 * (i + 1) + delta;
      const [x0, y0] = pt(R2, a0), [x1, y1] = pt(R2, a1), [x2, y2] = pt(R3, a1), [x3, y3] = pt(R3, a0);
      s += `<path d="M${x0} ${y0}A${R2} ${R2} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${R3} ${R3} 0 0 0 ${x3} ${y3}Z" fill="${GOLD}" fill-opacity=".16"/>`;
    }
    // rings
    s += `<g fill="none" stroke="${LINE}">`;
    s += `<circle r="${R1}" stroke-width="1.6"/><circle r="${R2}" stroke-width="1"/><circle r="${R3}" stroke-width="1"/>`;
    s += `<circle r="${R4}" stroke-width=".8" stroke-dasharray="1 5"/><circle r="${R5}" stroke-width="1"/></g>`;
    // degree ticks between R1 and R2
    s += `<g stroke="${LINE}">`;
    for (let d = 0; d < 360; d += 2) {
      const len = d % 30 === 0 ? 16 : d % 10 === 0 ? 9 : 5;
      const [x0, y0] = pt(R1, d + delta), [x1, y1] = pt(R1 - len, d + delta);
      s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke-width="${d % 30 === 0 ? 1.4 : .7}"/>`;
    }
    // sign dividers and spokes toward the centre
    for (let k = 0; k < 12; k++) {
      const a = 30 * k + delta;
      const [x0, y0] = pt(R2, a), [x1, y1] = pt(R3, a), [x2, y2] = pt(R4, a), [x3, y3] = pt(R5, a);
      s += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke-width="1"/>`;
      s += `<line x1="${x2}" y1="${y2}" x2="${x3}" y2="${y3}" stroke-width=".6" stroke-opacity=".6"/>`;
    }
    s += `</g>`;
    // gold stars on the outer ring at the sign cusps
    for (let k = 0; k < 12; k++) {
      const [x, y] = pt(R1, 30 * k + delta);
      s += `<circle cx="${x}" cy="${y}" r="3" fill="${GOLD}"/>`;
    }
    // sign names, always read upright
    const RT = (R2 + R3) / 2;
    s += `<defs>`;
    for (let i = 0; i < 12; i++) {
      const c = 30 * i + 15 + delta;
      const top = Math.sin(rad(c)) < 0.05;
      const [a0, a1] = top ? [c - 15, c + 15] : [c + 15, c - 15];
      const [x0, y0] = pt(RT, a0), [x1, y1] = pt(RT, a1);
      s += `<path id="${id}p${i}" d="M${x0} ${y0}A${RT} ${RT} 0 0 ${top ? 1 : 0} ${x1} ${y1}"/>`;
    }
    s += `</defs>`;
    for (let i = 0; i < 12; i++) {
      const on = !todos && hi.includes(i);
      s += `<text font-family="Cinzel" font-size="${on ? 16 : 14}" font-weight="${on ? 700 : 500}" letter-spacing="${on ? 2.4 : 2}" fill="${on || todos ? GOLD : "rgba(226,218,255,.62)"}" dominant-baseline="central" text-anchor="middle"><textPath href="#${id}p${i}" startOffset="50%">${SIGNOS[i].toUpperCase()}</textPath></text>`;
    }
    return `<svg viewBox="-320 -320 640 640" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }

  // Deterministic starfield for a w×h box (viewBox units).
  function estrelas(w, h, n = 140, seed = 7) {
    let x = seed >>> 0;
    const rnd = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
    let s = "";
    for (let i = 0; i < n; i++) {
      const cx = (rnd() * w).toFixed(1), cy = (rnd() * h).toFixed(1);
      const big = rnd() > 0.92;
      const r = big ? 1.5 + rnd() * 0.8 : 0.5 + rnd() * 0.8;
      s += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="#fff" fill-opacity="${(big ? 0.8 : 0.25 + rnd() * 0.45).toFixed(2)}"/>`;
    }
    // a few four-point sparkles in gold
    for (let i = 0; i < 6; i++) {
      const cx = rnd() * w, cy = rnd() * h, k = 4 + rnd() * 5;
      s += `<path transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${(k / 9).toFixed(2)})" d="M0-9L1.6-1.6L9 0L1.6 1.6L0 9L-1.6 1.6L-9 0L-1.6-1.6Z" fill="${GOLD}" fill-opacity=".85"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
    "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  globalThis.ceuRoda = { roda, estrelas, signosDoMes, SIGNOS, MESES };
})();

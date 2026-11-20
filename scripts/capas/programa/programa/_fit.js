// Shrink [data-fitw] elements until the word fits the column width.
document.fonts.ready.then(() => {
  for (const el of document.querySelectorAll("[data-fitw]")) {
    let s = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth && s > 40) { s -= 1; el.style.fontSize = s + "px"; }
  }
  document.body.dataset.ready = "1";
});

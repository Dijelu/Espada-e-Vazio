/* Visual secreto de Quincy: liberado ao tocar no emblema da Introdução. */
const CHAVE = "visual-quincy";

export function quincyAtivo(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

function aplicar(ligado: boolean) {
  const r = document.documentElement;
  if (ligado) r.setAttribute("data-skin", "quincy");
  else r.removeAttribute("data-skin");
}

function pulso(ligado: boolean) {
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzido) return;
  const el = document.createElement("div");
  el.className = "quincy-pulso " + (ligado ? "liga" : "desliga");
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<img src="/art/sym-intro.png" alt="">';
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1500);
}

export function alternarQuincy() {
  const novo = !quincyAtivo();
  try {
    localStorage.setItem(CHAVE, novo ? "1" : "0");
  } catch {
    /* sem armazenamento */
  }
  pulso(novo);
  window.setTimeout(() => aplicar(novo), novo ? 450 : 250);
}

export function iniciarQuincy() {
  aplicar(quincyAtivo());
}

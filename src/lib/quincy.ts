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

function salvar(v: boolean) {
  try {
    localStorage.setItem(CHAVE, v ? "1" : "0");
  } catch {
    /* sem armazenamento */
  }
}

const FRASES = [
  "Duzentos anos de silêncio.",
  "O mundo os deu por extintos.",
  "Mas o sangue de prata nunca secou.",
];

let rodando = false;

function retorno() {
  rodando = true;
  const el = document.createElement("div");
  el.className = "quincy-retorno";
  el.setAttribute("role", "presentation");
  el.innerHTML =
    '<div class="qr-poeira"></div>' +
    FRASES.map((t, i) => `<p class="qr-frase qr-f${i + 1}">${t}</p>`).join("") +
    '<div class="qr-luz"></div>' +
    '<img class="qr-emblema" src="/art/sym-intro.png" alt="">' +
    '<h2 class="qr-titulo">O Retorno</h2>' +
    '<small class="qr-pular">toque para pular</small>';
  document.body.appendChild(el);
  let feito = false;
  const fim = () => {
    if (feito) return;
    feito = true;
    aplicar(true);
    el.classList.add("qr-sai");
    window.setTimeout(() => {
      el.remove();
      rodando = false;
    }, 900);
  };
  el.addEventListener("click", fim);
  window.setTimeout(() => aplicar(true), 8200);
  window.setTimeout(fim, 10200);
}

function despedida() {
  const el = document.createElement("div");
  el.className = "quincy-pulso desliga";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<img src="/art/sym-intro.png" alt="">';
  document.body.appendChild(el);
  window.setTimeout(() => aplicar(false), 250);
  window.setTimeout(() => el.remove(), 1500);
}

export function alternarQuincy() {
  if (rodando) return;
  const novo = !quincyAtivo();
  salvar(novo);
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzido) {
    aplicar(novo);
    return;
  }
  if (novo) retorno();
  else despedida();
}

export function iniciarQuincy() {
  aplicar(quincyAtivo());
}

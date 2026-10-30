import { musicaQuincy, trocarFaixaDoTema } from "./som";

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
  trocarFaixaDoTema();
}

function salvar(v: boolean) {
  try {
    localStorage.setItem(CHAVE, v ? "1" : "0");
  } catch {
    /* sem armazenamento */
  }
}

const CENA0 = [
  "Os Quincy já tiveram um reino de pedra e prata.",
  "Hoje, só ruínas e gelo guardam o seu nome.",
];
const CENA1 = [
  "Duzentos anos atrás, o Seireitei decretou o fim dos Quincy.",
  "As cidades arderam e os sobreviventes se esconderam nas sombras.",
  "O mundo os deu por extintos.",
];
const CENA2 = [
  "Mas o Rei Quincy não morreu. Esperou, em silêncio, enquanto o poder voltava.",
  "O sangue de prata nunca secou.",
];

let rodando = false;

function retorno() {
  rodando = true;
  musicaQuincy(true);
  const el = document.createElement("div");
  el.className = "quincy-retorno";
  el.setAttribute("role", "presentation");
  el.innerHTML =
    '<div class="qr-quadro qr-q0"></div><div class="qr-quadro qr-q1"></div><div class="qr-quadro qr-q2"></div>' +
    '<div class="qr-poeira"></div>' +
    CENA0.map((t, i) => `<p class="qr-frase qr-z${i + 1}">${t}</p>`).join("") +
    CENA1.map((t, i) => `<p class="qr-frase qr-a${i + 1}">${t}</p>`).join("") +
    CENA2.map((t, i) => `<p class="qr-frase qr-b${i + 1}">${t}</p>`).join("") +
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
    musicaQuincy(false);
    el.classList.add("qr-sai");
    window.setTimeout(() => {
      el.remove();
      rodando = false;
    }, 900);
  };
  el.addEventListener("click", fim);
  window.setTimeout(() => aplicar(true), 16800);
  window.setTimeout(fim, 18800);
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

/* Movimento do site: revelação dos cartões na rolagem, brilho que segue o mouse e parallax suave do topo.
   Tudo é melhoria opcional: sem JavaScript, sem IntersectionObserver ou com "reduzir movimento" ligado, o site fica como sempre foi.
   Só mexe em opacity e transform (via animation e translate), então não causa salto de layout. */

/** O que entra com revelação ao aparecer na tela. */
const REVELA = ".strip, .bars .bar, .cartas .carta, .grade2 .caixa, .q-marco, .q-lema, .page > h2.title-font, .achados .result";
/** O que ganha brilho que segue o mouse. */
const BRILHA = ".strip, .bars .bar, .cartas .carta";

const quietude = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export function iniciarMovimento(): void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined" || quietude()) return;
  const raiz = document.documentElement;
  raiz.classList.add("mv");

  /* revelação */
  const io = new IntersectionObserver(
    (lista) => {
      for (const e of lista) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.mv = "1";
        io.unobserve(e.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  let agendado = false;
  const varrer = () => {
    agendado = false;
    const novos: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>(REVELA).forEach((el) => {
      if (el.dataset.mv) return;
      el.dataset.mv = "0";
      const irmaos = el.parentElement ? Array.from(el.parentElement.children) : [];
      el.style.setProperty("--mv-i", String(Math.min(Math.max(irmaos.indexOf(el), 0), 7)));
      io.observe(el);
      novos.push(el);
    });
    // rede de segurança: se algo não chegar a ser revelado, aparece depois de 3 s
    if (novos.length) window.setTimeout(() => novos.forEach((el) => { if (el.dataset.mv === "0") { el.dataset.mv = "1"; io.unobserve(el); } }), 3000);
  };
  const agendar = () => { if (!agendado) { agendado = true; requestAnimationFrame(varrer); } };
  new MutationObserver(agendar).observe(document.body, { childList: true, subtree: true });
  agendar();

  /* brilho que segue o mouse (só com mouse de verdade) */
  let quadro = 0;
  document.addEventListener(
    "pointermove",
    (ev) => {
      if (ev.pointerType !== "mouse" || quadro) return;
      const alvo = (ev.target as Element | null)?.closest?.(BRILHA) as HTMLElement | null;
      if (!alvo) return;
      quadro = requestAnimationFrame(() => {
        quadro = 0;
        const r = alvo.getBoundingClientRect();
        alvo.style.setProperty("--mx", `${ev.clientX - r.left}px`);
        alvo.style.setProperty("--my", `${ev.clientY - r.top}px`);
      });
    },
    { passive: true }
  );

  /* parallax suave do topo da capa */
  let pq = 0;
  const parallax = () => {
    pq = 0;
    const y = Math.min(window.scrollY, 900);
    const hero = document.querySelector<HTMLElement>(".hero");
    if (hero) hero.style.setProperty("--py", String(Math.round(y * 0.12)));
  };
  window.addEventListener("scroll", () => { if (!pq) pq = requestAnimationFrame(parallax); }, { passive: true });
}

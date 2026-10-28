/** Desencoraja a abertura das ferramentas do navegador na versão publicada. */
export function iniciarProtecao() {
  if (!import.meta.env.PROD) return;
  const campo = (a: EventTarget | null) => a instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  window.addEventListener(
    "keydown",
    (e) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const proibido =
        e.key === "F12" ||
        (ctrl && e.shiftKey && ["i", "j", "c", "k"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k)) ||
        (ctrl && !e.shiftKey && k === "u");
      if (proibido) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
  window.addEventListener("contextmenu", (e) => {
    if (!campo(e.target)) e.preventDefault();
  });
}

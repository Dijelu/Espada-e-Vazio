import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

export type TipoEfeito = "bankai" | "resurreccion" | "vollstandig" | "mascara";
interface Pedido {
  tipo: TipoEfeito;
  nome?: string;
  id: number;
}

const EVENTO = "espada:liberacao";

/** Pede a animação de tela cheia de uma liberação. Não faz nada se o navegador não suportar. */
export function dispararLiberacao(tipo: TipoEfeito, nome?: string) {
  try {
    window.dispatchEvent(new CustomEvent<Pedido>(EVENTO, { detail: { tipo, nome, id: Date.now() } }));
  } catch {
    /* efeito é só enfeite */
  }
}

const TEXTOS: Record<TipoEfeito, { grande: string; pequeno: string }> = {
  bankai: { grande: "卍解", pequeno: "BANKAI" },
  resurreccion: { grande: "RESURRECCIÓN", pequeno: "Hollow" },
  vollstandig: { grande: "VOLLSTÄNDIG", pequeno: "Quincy" },
  mascara: { grande: "仮面", pequeno: "Máscara Hollow" },
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Treme um elemento com força que vai caindo. */
function tremer(tl: gsap.core.Timeline, alvo: Element | null, forca: number, dur: number, em: number) {
  if (!alvo) return;
  const passo = 0.04;
  const n = Math.max(2, Math.round(dur / passo));
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    tl.to(alvo, { x: rnd(-forca, forca) * k, y: rnd(-forca, forca) * k, duration: passo, ease: "none" }, em + i * passo);
  }
  tl.to(alvo, { x: 0, y: 0, duration: 0.05, clearProps: "transform" }, em + n * passo);
}

/** Linha quebrada que sai do centro, para as rachaduras da Resurrección. */
function rachadura(ang: number): string {
  let x = 50;
  let y = 50;
  let a = ang;
  let d = "M50 50";
  for (let r = 0; r < 7; r++) {
    a += rnd(-0.45, 0.45);
    const len = rnd(6, 11);
    x += Math.cos(a) * len;
    y += Math.sin(a) * len;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/** Animações de tela cheia ao liberar Bankai, Resurrección ou Vollständig: uma por tipo. */
export function EfeitoLiberacao() {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ouvir = (e: Event) => setPedido((e as CustomEvent<Pedido>).detail);
    window.addEventListener(EVENTO, ouvir);
    return () => window.removeEventListener(EVENTO, ouvir);
  }, []);

  const dados = useMemo(
    () => ({
      pilares: Array.from({ length: 9 }, (_, i) => ({ x: 6 + i * 11 + rnd(-3, 3), l: rnd(5, 11), a: rnd(55, 95) })),
      rachaduras: Array.from({ length: 11 }, (_, i) => rachadura((Math.PI * 2 * i) / 11 + rnd(-0.2, 0.2))),
      cacos: Array.from({ length: 18 }, () => ({ ang: rnd(0, Math.PI * 2), dist: rnd(260, 760), t: rnd(10, 30), r: rnd(-540, 540) })),
      brilhos: Array.from({ length: 30 }, () => ({ x: rnd(2, 98), a: rnd(300, 900), t: rnd(3, 9) })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pedido?.id]
  );

  useLayoutEffect(() => {
    if (!pedido || !raiz.current) return;
    const el = raiz.current;
    const corpo = document.getElementById("root");
    const reduz = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let fim: gsap.core.Timeline | null = null;
    let ctx: gsap.Context | null = null;
    try {
    ctx = gsap.context(() => {
      const q = (s: string) => gsap.utils.toArray<Element>(s, el);
      const tl = gsap.timeline({ onComplete: () => setPedido(null) });
      fim = tl;
      const texto = q(".fx-texto");
      if (reduz) {
        tl.fromTo(texto, { opacity: 0 }, { opacity: 1, duration: 0.3 }).to(texto, { opacity: 0, duration: 0.5 }, 1.2);
        return;
      }

      const comprimento = (t: Element) => {
        const p = t as unknown as SVGPathElement;
        const L = p.getTotalLength ? p.getTotalLength() : 100;
        p.style.strokeDasharray = String(L);
        return L;
      };

      if (pedido.tipo === "bankai") {
        // clarão, pilares de reiatsu subindo, ondas de choque e o nome batendo na tela
        tl.fromTo(q(".fx-flash"), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0)
          .to(q(".fx-flash"), { opacity: 0, duration: 0.6, ease: "power2.out" }, 0.1)
          .fromTo(q(".fx-vinheta"), { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.05)
          .to(q(".fx-vinheta"), { opacity: 0, duration: 0.7 }, 2.0)
          .fromTo(q(".fx-pilar"), { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.55, stagger: 0.05, ease: "power4.out", transformOrigin: "50% 100%" }, 0.1)
          .to(q(".fx-pilar"), { opacity: 0, duration: 0.7, stagger: 0.03 }, 1.4)
          .fromTo(q(".fx-anel"), { scale: 0.1, opacity: 0.95 }, { scale: 3.4, opacity: 0, duration: 1.2, stagger: 0.2, ease: "power2.out" }, 0.12)
          .fromTo(texto, { scale: 2.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.2)" }, 0.28)
          .to(texto, { opacity: 0, scale: 1.1, duration: 0.5 }, 2.1);
        tremer(tl, corpo, 18, 1.1, 0.1);
        tremer(tl, corpo, 7, 0.6, 1.3);
      } else if (pedido.tipo === "resurreccion") {
        // coração do Hollow batendo, rachaduras no mundo, estilhaços de osso e texto falhando
        tl.fromTo(q(".fx-sangue"), { opacity: 0 }, { opacity: 0.55, duration: 0.12 }, 0)
          .to(q(".fx-sangue"), { opacity: 0.12, duration: 0.18 }, 0.12)
          .to(q(".fx-sangue"), { opacity: 0.7, duration: 0.1 }, 0.45)
          .to(q(".fx-sangue"), { opacity: 0.15, duration: 0.25 }, 0.55)
          .to(q(".fx-sangue"), { opacity: 0.85, duration: 0.08 }, 1.0)
          .to(q(".fx-sangue"), { opacity: 0, duration: 1.0, ease: "power2.out" }, 1.1)
          .fromTo(q(".fx-rachadura"), { strokeDashoffset: (_i: number, t: Element) => comprimento(t), opacity: 1 }, { strokeDashoffset: 0, duration: 0.55, stagger: 0.05, ease: "power3.out" }, 0.05)
          .to(q(".fx-rachadura"), { opacity: 0, duration: 0.8 }, 2.0)
          .fromTo(
            q(".fx-caco"),
            { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1 },
            {
              x: (i: number) => Math.cos(dados.cacos[i].ang) * dados.cacos[i].dist,
              y: (i: number) => Math.sin(dados.cacos[i].ang) * dados.cacos[i].dist,
              rotation: (i: number) => dados.cacos[i].r,
              opacity: 0,
              scale: 0.4,
              duration: 1.3,
              ease: "power3.out",
            },
            0.95
          )
          .fromTo(texto, { opacity: 0, scaleY: 0.2 }, { opacity: 1, scaleY: 1, duration: 0.2, ease: "power4.out" }, 0.5);
        // texto falhando
        for (let i = 0; i < 6; i++) tl.to(texto, { x: rnd(-14, 14), skewX: rnd(-14, 14), duration: 0.05 }, 0.75 + i * 0.07);
        tl.to(texto, { x: 0, skewX: 0, duration: 0.05 }, 1.2).to(texto, { opacity: 0, duration: 0.6 }, 2.0);
        tremer(tl, corpo, 9, 0.45, 0.05);
        tremer(tl, corpo, 20, 0.7, 0.95);
      } else if (pedido.tipo === "mascara") {
        // a mão cobre o rosto: tudo escurece, a aura vermelha e preta gira, a máscara se forma e bate na tela
        tl.fromTo(q(".fx-escuro"), { opacity: 0 }, { opacity: 1, duration: 0.35 }, 0)
          .to(q(".fx-escuro"), { opacity: 0, duration: 0.7 }, 2.0)
          .fromTo(q(".fx-aura"), { opacity: 0, rotation: 0, scale: 0.3 }, { opacity: 1, rotation: 140, scale: 1.3, duration: 2.0, ease: "power1.out" }, 0.1)
          .to(q(".fx-aura"), { opacity: 0, duration: 0.6 }, 1.7)
          .fromTo(q(".fx-traco"), { strokeDashoffset: (_i: number, t: Element) => comprimento(t), opacity: 1 }, { strokeDashoffset: 0, duration: 0.45, stagger: 0.06, ease: "power3.out" }, 0.55)
          .fromTo(q(".fx-mascara-face"), { opacity: 0, scale: 2.4, y: -40 }, { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: "power4.in" }, 0.7)
          .fromTo(q(".fx-flash"), { opacity: 0 }, { opacity: 0.95, duration: 0.05 }, 0.98)
          .to(q(".fx-flash"), { opacity: 0, duration: 0.5 }, 1.03)
          .fromTo(q(".fx-anel"), { scale: 0.2, opacity: 0.9 }, { scale: 3, opacity: 0, duration: 1.0, stagger: 0.15, ease: "power2.out" }, 1.0)
          .to(q(".fx-mascara-face"), { scale: 1.06, duration: 0.9, ease: "sine.inOut" }, 1.1)
          .to(q(".fx-mascara-face"), { opacity: 0, duration: 0.5 }, 2.0)
          .fromTo(texto, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, 1.05)
          .to(texto, { opacity: 0, duration: 0.5 }, 2.2);
        tremer(tl, corpo, 3, 0.6, 0.1);
        tremer(tl, corpo, 22, 0.55, 0.98);
      } else {
        // luz Quincy: emblema girando, raios, anéis de reishi e centelhas subindo
        tl.fromTo(q(".fx-flash"), { opacity: 0 }, { opacity: 0.9, duration: 0.1 }, 0)
          .to(q(".fx-flash"), { opacity: 0, duration: 0.8 }, 0.12)
          .fromTo(q(".fx-raios"), { opacity: 0, rotation: 0, scale: 0.4 }, { opacity: 1, rotation: 70, scale: 1.4, duration: 2.0, ease: "power1.out" }, 0.05)
          .to(q(".fx-raios"), { opacity: 0, duration: 0.6 }, 1.7)
          .fromTo(q(".fx-emblema"), { scale: 0.1, rotation: -140, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, 0.1)
          .to(q(".fx-emblema"), { rotation: 25, scale: 1.12, duration: 1.0, ease: "sine.inOut" }, 0.9)
          .to(q(".fx-emblema"), { opacity: 0, scale: 1.6, duration: 0.5 }, 1.9)
          .fromTo(q(".fx-anel-q"), { scale: 0.2, opacity: 0.9, rotation: 0 }, { scale: 2.6, opacity: 0, rotation: 120, duration: 1.4, stagger: 0.18, ease: "power2.out" }, 0.15)
          .fromTo(
            q(".fx-brilho"),
            { y: 0, opacity: 0 },
            { y: (i: number) => -dados.brilhos[i].a, opacity: 1, duration: 0.9, stagger: 0.03, ease: "power1.out", yoyo: true, repeat: 1 },
            0.2
          )
          .fromTo(texto, { opacity: 0, y: 24, letterSpacing: "0.5em" }, { opacity: 1, y: 0, letterSpacing: "0.12em", duration: 0.7, ease: "power3.out" }, 0.45)
          .to(texto, { opacity: 0, duration: 0.5 }, 2.2);
        tremer(tl, corpo, 4, 1.3, 0.1);
      }
    }, el);
    } catch {
      setPedido(null);
    }
    return () => {
      (fim as gsap.core.Timeline | null)?.kill();
      ctx?.revert();
      corpo?.style.removeProperty("transform");
    };
  }, [pedido, dados]);

  if (!pedido) return null;
  const t = TEXTOS[pedido.tipo];
  return createPortal(
    <div ref={raiz} key={pedido.id} className={`fx fx-${pedido.tipo}`} aria-hidden="true">
      {pedido.tipo === "bankai" && (
        <>
          <div className="fx-vinheta" />
          {dados.pilares.map((p, i) => (
            <div key={i} className="fx-pilar" style={{ left: `${p.x}%`, width: `${p.l}%`, height: `${p.a}%` }} />
          ))}
          {[0, 1, 2].map((i) => <div key={i} className="fx-anel" />)}
          <div className="fx-flash" />
        </>
      )}
      {pedido.tipo === "resurreccion" && (
        <>
          <div className="fx-sangue" />
          <svg className="fx-rachaduras" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            {dados.rachaduras.map((d, i) => (
              <path key={i} className="fx-rachadura" d={d} />
            ))}
          </svg>
          {dados.cacos.map((c, i) => (
            <div key={i} className="fx-caco" style={{ width: c.t, height: c.t * 1.8 }} />
          ))}
        </>
      )}
      {pedido.tipo === "mascara" && (
        <>
          <div className="fx-escuro" />
          <div className="fx-aura" />
          {[0, 1].map((i) => <div key={i} className="fx-anel" />)}
          <svg className="fx-mascara-face" viewBox="0 0 100 130" aria-hidden="true">
            <path className="fx-mascara-casco" d="M50 4 C78 4 92 30 90 62 C88 96 70 126 50 126 C30 126 12 96 10 62 C8 30 22 4 50 4 Z" />
            <path className="fx-mascara-olho" d="M22 46 L44 56 L42 66 L20 58 Z" />
            <path className="fx-mascara-olho" d="M78 46 L56 56 L58 66 L80 58 Z" />
            <path className="fx-traco" d="M33 62 C31 82 34 98 40 112" />
            <path className="fx-traco" d="M67 62 C69 82 66 98 60 112" />
            <path className="fx-traco" d="M50 6 L50 40" />
            <path className="fx-traco" d="M30 14 C36 24 40 32 44 40" />
            <path className="fx-traco" d="M70 14 C64 24 60 32 56 40" />
            <path className="fx-mascara-boca" d="M36 104 L64 104" />
          </svg>
          <div className="fx-flash" />
        </>
      )}
      {pedido.tipo === "vollstandig" && (
        <>
          <div className="fx-raios" />
          {[0, 1, 2].map((i) => <div key={i} className="fx-anel-q" />)}
          <img className="fx-emblema" src="/art/sym-intro.png" alt="" />
          {dados.brilhos.map((b, i) => (
            <div key={i} className="fx-brilho" style={{ left: `${b.x}%`, width: b.t, height: b.t }} />
          ))}
          <div className="fx-flash" />
        </>
      )}
      <div className="fx-texto">
        <b>{t.grande}</b>
        <small>{pedido.nome || t.pequeno}</small>
      </div>
    </div>,
    document.body
  );
}

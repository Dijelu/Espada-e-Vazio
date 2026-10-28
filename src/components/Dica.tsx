import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** conteúdo do balão */
  balao: ReactNode;
  /** o elemento que recebe a dica; pode ser uma função que recebe o alternador (para botões "Ler" no celular) */
  children: ReactNode | ((alternar: () => void) => ReactNode);
  className?: string;
}

/** Balão de dica flutuante: aparece ao passar o mouse, ao focar com o teclado ou ao tocar no botão de leitura, sem empurrar os outros elementos. */
export function Dica({ balao, children, className }: Props) {
  const alvo = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [fixo, setFixo] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; acima: boolean; larg: number } | null>(null);
  const visivel = hover || fixo;

  const medir = useCallback(() => {
    const el = alvo.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const larg = Math.min(340, window.innerWidth - 16);
    const x = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8));
    const acima = r.bottom + 220 > window.innerHeight && r.top > 240;
    setPos({ x, y: acima ? r.top - 8 : r.bottom + 8, acima, larg });
  }, []);

  useEffect(() => {
    if (!visivel) return;
    medir();
    const sai = () => {
      setHover(false);
      setFixo(false);
    };
    window.addEventListener("scroll", sai, true);
    window.addEventListener("resize", sai);
    return () => {
      window.removeEventListener("scroll", sai, true);
      window.removeEventListener("resize", sai);
    };
  }, [visivel, medir]);

  useEffect(() => {
    if (!fixo) return;
    const fora = (e: Event) => {
      if (alvo.current && !alvo.current.contains(e.target as Node)) setFixo(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setFixo(false);
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [fixo]);

  const alternar = () => setFixo((v) => !v);

  return (
    <span
      ref={alvo}
      className={`dica-alvo ${className ?? ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      {typeof children === "function" ? children(alternar) : children}
      {visivel && pos &&
        createPortal(
          <div className="dica-balao" role="tooltip" style={{ left: pos.x, top: pos.y, width: pos.larg, transform: pos.acima ? "translateY(-100%)" : undefined }}>
            {balao}
          </div>,
          document.body
        )}
    </span>
  );
}

import { efeito } from "../lib/som";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

type Tema = "dark" | "light";
interface Ctx {
  tema: Tema;
  alternar: () => void;
}
const ThemeCtx = createContext<Ctx>({ tema: "dark", alternar: () => {} });
export const useTema = () => useContext(ThemeCtx);

function inicial(): Tema {
  try {
    const t = localStorage.getItem("tema");
    if (t === "light" || t === "dark") return t;
  } catch {
    /* sem armazenamento */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(inicial);
  const [anim, setAnim] = useState<null | Tema | "sai">(null);
  const alvo = useRef<Tema>(tema);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    try {
      localStorage.setItem("tema", tema);
    } catch {
      /* ignora */
    }
  }, [tema]);

  const alternar = useCallback(() => {
    if (anim) return;
    const novo: Tema = tema === "dark" ? "light" : "dark";
    efeito.tema(novo === "dark");
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) {
      setTema(novo);
      return;
    }
    alvo.current = novo;
    setAnim(novo);
    window.setTimeout(() => {
      setTema(novo);
      setAnim("sai");
    }, 950);
    window.setTimeout(() => setAnim(null), 1500);
  }, [anim, tema]);

  const indo = anim === "sai" ? alvo.current : anim;
  const indoEscuro = indo === "dark";

  return (
    <ThemeCtx.Provider value={{ tema, alternar }}>
      {children}
      {anim && (
        <div
          className={`theme-overlay ${indoEscuro ? "vai-escuro" : "vai-claro"} ${anim === "sai" ? "sai" : ""}`}
          aria-hidden="true"
        >
          <img src={indoEscuro ? "/art/sym-mask-claro.png" : "/art/sym-flame.png"} alt="" />
        </div>
      )}
    </ThemeCtx.Provider>
  );
}

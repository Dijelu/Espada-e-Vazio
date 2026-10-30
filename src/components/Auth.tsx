import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface Ctx {
  sessao: Session | null;
  carregando: boolean;
  sair: () => Promise<void>;
  /** a pessoa chegou pelo link de "esqueci a senha" e precisa criar uma senha nova */
  recuperando: boolean;
  fimRecuperacao: () => void;
}
const AuthCtx = createContext<Ctx>({ sessao: null, carregando: true, sair: async () => {}, recuperando: false, fimRecuperacao: () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(Boolean(supabase));
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSessao(s);
      if (evento === "PASSWORD_RECOVERY") setRecuperando(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const sair = async () => {
    await supabase?.auth.signOut();
  };

  return <AuthCtx.Provider value={{ sessao, carregando, sair, recuperando, fimRecuperacao: () => setRecuperando(false) }}>{children}</AuthCtx.Provider>;
}

/** Só deixa passar quem entrou; os demais vão para a tela de login e voltam depois. */
export function RequerLogin({ children }: { children: ReactNode }) {
  const { sessao, carregando } = useAuth();
  const local = useLocation();
  if (carregando) return <main className="page"><p>Carregando…</p></main>;
  if (!sessao) return <Navigate to="/conta" replace state={{ voltar: local.pathname }} />;
  return <>{children}</>;
}

import { useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Topbar from "./components/Topbar";
import Busca from "./components/Busca";
import Capa from "./pages/Capa";
import Livro from "./pages/Livro";
import Capitulo from "./pages/Capitulo";
import EmBreve from "./pages/EmBreve";
import Fichas from "./pages/Fichas";
import NovaFicha from "./pages/NovaFicha";
import Ficha from "./pages/Ficha";
import Conta from "./pages/Conta";
import { RequerLogin } from "./components/Auth";
import { efeito } from "./lib/som";

export default function App() {
  const [busca, setBusca] = useState(false);
  const { pathname } = useLocation();
  const primeira = useRef(true);

  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (busca) efeito.abrir();
    else efeito.fechar();
  }, [busca]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBusca((b) => !b);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Topbar onBuscar={() => setBusca(true)} />
      <Busca aberto={busca} onFechar={() => setBusca(false)} />
      <Routes>
        <Route path="/" element={<Capa />} />
        <Route path="/livro" element={<Livro />} />
        <Route path="/livro/:slug" element={<Capitulo />} />
        <Route path="/fichas" element={<RequerLogin><Fichas /></RequerLogin>} />
        <Route path="/fichas/nova" element={<RequerLogin><NovaFicha /></RequerLogin>} />
        <Route path="/fichas/:id" element={<RequerLogin><Ficha /></RequerLogin>} />
        <Route path="/campanhas" element={<EmBreve titulo="Campanhas" texto="Mesas, convites e o Painel do Mestre chegam nas etapas finais." />} />
        <Route path="/ferramentas" element={<EmBreve titulo="Ferramentas do Mestre" texto="Simulador, NPC pareado, Solo/Raid e Boss estão em preparação." />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="*" element={<EmBreve titulo="Página não encontrada" texto="Esse caminho não existe." />} />
      </Routes>
      <footer className="footer">
        Obra de fã, sem fins lucrativos. Bleach © Tite Kubo / Shueisha. Créditos e fontes no último capítulo do livro.
      </footer>
    </>
  );
}

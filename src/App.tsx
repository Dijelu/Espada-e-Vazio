import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Topbar from "./components/Topbar";
import Busca from "./components/Busca";
import Capa from "./pages/Capa";
import EmBreve from "./pages/EmBreve";
import { RequerLogin } from "./components/Auth";
import { ErroTela } from "./components/ErroTela";
import { efeito } from "./lib/som";
import { EfeitoLiberacao } from "./components/EfeitoLiberacao";

// páginas carregadas só quando abertas, para o site abrir mais rápido
const Livro = lazy(() => import("./pages/Livro"));
const Capitulo = lazy(() => import("./pages/Capitulo"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Fichas = lazy(() => import("./pages/Fichas"));
const NovaFicha = lazy(() => import("./pages/NovaFicha"));
const Ficha = lazy(() => import("./pages/Ficha"));
const Conta = lazy(() => import("./pages/Conta"));
const ImportarLivro = lazy(() => import("./pages/ImportarLivro"));

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
      <EfeitoLiberacao />
      <ErroTela>
      <Suspense fallback={<main className="page"><p>Carregando…</p></main>}>
      <Routes>
        <Route path="/" element={<Capa />} />
        <Route path="/livro" element={<Livro />} />
        <Route path="/livro/:slug" element={<Capitulo />} />
        <Route path="/fichas" element={<RequerLogin><Fichas /></RequerLogin>} />
        <Route path="/fichas/nova" element={<RequerLogin><NovaFicha /></RequerLogin>} />
        <Route path="/fichas/:id" element={<RequerLogin><Ficha /></RequerLogin>} />
        <Route path="/campanhas" element={<EmBreve titulo="Campanhas" texto="Mesas, convites e o Painel do Mestre chegam nas etapas finais." />} />
        <Route path="/ferramentas" element={<Ferramentas />} />
        <Route path="/ferramentas/simulador" element={<Simulador />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="/admin/livro" element={<RequerLogin><ImportarLivro /></RequerLogin>} />
        <Route path="*" element={<EmBreve titulo="Página não encontrada" texto="Esse caminho não existe." />} />
      </Routes>
      </Suspense>
      </ErroTela>
      <footer className="footer">
        Obra de fã, sem fins lucrativos. Bleach © Tite Kubo / Shueisha. Créditos e fontes no último capítulo do livro.
      </footer>
    </>
  );
}

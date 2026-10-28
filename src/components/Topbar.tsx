import { NavLink, Link } from "react-router-dom";
import { useTema } from "./Theme";

export default function Topbar({ onBuscar }: { onBuscar: () => void }) {
  const { tema, alternar } = useTema();
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "ativo" : "");
  return (
    <header className="topbar">
      <Link to="/" className="logo">
        ESPADA <span>&amp;</span> VAZIO
      </Link>
      <nav className="nav" aria-label="Principal">
        <NavLink to="/livro" className={cls}>Livro</NavLink>
        <NavLink to="/fichas" className={cls}>Fichas</NavLink>
        <NavLink to="/campanhas" className={cls}>Campanhas</NavLink>
        <NavLink to="/ferramentas" className={cls}>Ferramentas</NavLink>
        <NavLink to="/conta" className={cls}>Entrar</NavLink>
      </nav>
      <button className="search-btn" onClick={onBuscar} aria-label="Buscar no livro">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        Buscar no livro…<kbd>Ctrl K</kbd>
      </button>
      <button
        className="theme-btn"
        onClick={alternar}
        aria-label={tema === "dark" ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
      >
        <img src={tema === "dark" ? "/art/sym-flame.jpg" : "/art/sym-mask.jpg"} alt="" />
      </button>
    </header>
  );
}

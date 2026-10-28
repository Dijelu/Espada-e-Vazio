import { Link } from "react-router-dom";
import { capitulos } from "../content/livro";

const tiras = [
  { t: "Livro", d: "Regras com busca", img: "c08", to: "/livro" },
  { t: "Fichas", d: "Crie e evolua", img: "c03", to: "/fichas" },
  { t: "Campanhas", d: "Painel do Mestre", img: "c13", to: "/campanhas" },
  { t: "Simulador", d: "Teste os combates", img: "c14", to: "/ferramentas" },
  { t: "Ameaças", d: "Hollows e chefes", img: "c05", to: "/livro/ameacas" },
];

export default function Capa() {
  void capitulos;
  return (
    <main>
      <section className="hero">
        <img className="hero-art" src="/art/c04.jpg" alt="" />
        <div className="hero-inner">
          <h1 className="title-font">
            Espada<br />
            <span>&amp;</span> vazio
          </h1>
          <p>Um sistema de RPG de mesa no mundo de Bleach. Livro de regras, fichas e ferramentas do Mestre num só lugar.</p>
          <div className="row">
            <Link className="btn btn-red" to="/livro">Abrir o livro</Link>
            <Link className="btn btn-paper" to="/fichas">Criar ficha</Link>
          </div>
        </div>
      </section>
      <div className="page">
        <h2 className="title-font" style={{ fontSize: 30, margin: "0 0 18px" }}>O que você encontra aqui</h2>
        <div className="strips">
          {tiras.map((s) => (
            <Link key={s.t} to={s.to} className="strip">
              <img src={`/art/${s.img}.jpg`} alt="" loading="lazy" />
              <div>
                <b>{s.t}</b>
                <small>{s.d}</small>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

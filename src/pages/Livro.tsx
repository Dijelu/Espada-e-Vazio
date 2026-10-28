import { Link } from "react-router-dom";
import { capitulos } from "../content/livro";

export default function Livro() {
  return (
    <main className="page">
      <h1 className="title-font" style={{ fontSize: "clamp(48px,9vw,88px)", margin: 0, lineHeight: 0.9 }}>O Livro</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, margin: "6px 0 24px" }}>Regras, classes e ameaças. Escolha um capítulo.</p>
      <div className="bars">
        {capitulos.map((c, i) => (
          <Link key={c.slug} to={`/livro/${c.slug}`} className={`bar ${i < 2 ? "big" : ""}`}>
            <div className="bar-num">{c.no === 0 ? "★" : c.no}</div>
            <div className="bar-text">
              <b>{c.title}</b>
              <span>{c.desc}</span>
            </div>
            <div className="bar-go">Abrir →</div>
            <div className="bar-art">
              <img src={`/art/${c.art}.jpg`} alt="" loading="lazy" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

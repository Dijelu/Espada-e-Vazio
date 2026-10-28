import { Link } from "react-router-dom";

export default function EmBreve({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <main className="page">
      <div className="em-breve">
        <h1 className="title-font">{titulo}</h1>
        <p>{texto}</p>
        <div className="row">
          <Link className="btn btn-red" to="/livro">Abrir o livro</Link>
        </div>
      </div>
    </main>
  );
}

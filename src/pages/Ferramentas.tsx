import { Link } from "react-router-dom";

const ITENS = [
  { t: "Simulador de combate", d: "Duelos do jogador contra o NPC pareado, com taxa de vitória, rodadas e dano por rodada.", to: "/ferramentas/simulador" },
  { t: "NPC pareado", d: "Já está dentro do simulador: aplica o fator k, o NPC de suporte e o Hollow espelhado.", to: "/ferramentas/simulador" },
  { t: "Solo / Raid e Boss", d: "Em preparação.", to: "" },
];

export default function Ferramentas() {
  return (
    <main className="page">
      <h1 className="title-font">Ferramentas do Mestre</h1>
      <div className="cartas">
        {ITENS.map((i) => (
          <article className="carta" key={i.t}>
            {i.to ? (
              <Link to={i.to} className="carta-corpo"><b className="title-font">{i.t}</b><span>{i.d}</span></Link>
            ) : (
              <div className="carta-corpo"><b className="title-font">{i.t}</b><span>{i.d}</span></div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

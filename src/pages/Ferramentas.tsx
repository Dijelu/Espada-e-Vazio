import { Link } from "react-router-dom";

const ITENS = [
  { t: "Simulador de combate", d: "Duelos do jogador contra o NPC, com o NPC pareado (fator k, suporte e Hollow) incluído. Mostra taxa de vitória, rodadas e dano por rodada.", to: "/ferramentas/simulador" },
  { t: "NPCs da campanha", d: "Em preparação: o Mestre cria NPCs da mesa, coloca no combate e abre a ficha deles.", to: "" },
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

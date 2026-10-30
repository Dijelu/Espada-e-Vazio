import { useState } from "react";
import { KIDOS } from "../regras/catalogo";
import type { Calculo, Ficha } from "../regras/ficha";

const CHAVE = "esv:painel-kido";
const lerAberto = () => {
  try { return localStorage.getItem(CHAVE) !== "fechado"; } catch { return true; }
};

/** Painel que abre e fecha com os Hadōs e Bakudōs que a pessoa escolheu na ficha. */
export function PainelKidos({ f, c }: { f: Ficha; c: Calculo }) {
  const [aberto, setAberto] = useState(lerAberto);
  if (f.kidos.length === 0) return null;
  const alternar = (v: boolean) => {
    setAberto(v);
    try { localStorage.setItem(CHAVE, v ? "aberto" : "fechado"); } catch { /* sem armazenamento */ }
  };
  const grupo = (tipo: "hadou" | "bakudou", titulo: string) => {
    const lista = f.kidos
      .filter((k) => k.tipo === tipo)
      .map((k) => ({ k, d: KIDOS.find((x) => x.tipo === k.tipo && x.n === k.n) }))
      .sort((a, b) => a.k.n - b.k.n);
    if (lista.length === 0) return null;
    return (
      <div key={tipo}>
        <h4 className="sub-passivas">{titulo} ({lista.length})</h4>
        {lista.map(({ k, d }) => (
          <details className="poder-livro kido" key={k.tipo + k.n}>
            <summary>
              <b>{titulo} {k.n}: {k.nome}</b>
              {d?.rank && <small> · rank {d.rank}</small>}
            </summary>
            {d?.meta && <p className="ajuda">{d.meta}</p>}
            {d?.texto && <p>{d.texto}</p>}
          </details>
        ))}
      </div>
    );
  };
  return (
    <details className="caixa painel-kidos" open={aberto} onToggle={(e) => alternar((e.currentTarget as HTMLDetailsElement).open)}>
      <summary><h3>Kidōs <small>{f.kidos.length} escolhido{f.kidos.length === 1 ? "" : "s"} · CD {c.cdKido}</small></h3></summary>
      {(f.estado.liberado === "shikai" || f.estado.liberado === "bankai") && (
        <p className="ajuda">Com a {f.estado.liberado === "bankai" ? "Bankai" : "Shikai"} ativa, cada Hadō que você lançar causa <b>+{f.estado.liberado === "bankai" ? 2 * c.prof : c.prof}</b> de dano.</p>
      )}
      {grupo("hadou", "Hadō")}
      {grupo("bakudou", "Bakudō")}
    </details>
  );
}

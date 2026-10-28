import { Dica } from "./Dica";
import { SeletorEssencia } from "./SeletorEssencia";
import { essenciaPorNome } from "../regras/essencias";

/** Texto do que a essência faz na etapa atual (1 = texto base; 2 em diante = etapas). */
export function efeitoDaEtapa(nome: string, etapa: number) {
  const e = essenciaPorNome(nome);
  if (!e) return { livro: undefined, atual: "" };
  const atual = etapa <= 1 ? e.texto : e.etapas[Math.min(etapa, e.etapas.length + 1) - 2] || e.texto;
  return { livro: e, atual };
}

/** Nome da essência com balão que explica o que ela faz e uma linha curta de resumo. */
export function NomeEssencia({ nome, etapa }: { nome: string; etapa: number }) {
  const { livro, atual } = efeitoDaEtapa(nome, etapa);
  if (!livro) return <span className="ess-nome"><b>{nome}</b><small className="ajuda">Essência própria ou ainda fora do livro.</small></span>;
  return (
    <Dica
      className="ess-nome"
      balao={
        <>
          <b>{livro.nome}</b>
          <small>Etapa {etapa} de {livro.etapas.length + 1}</small>
          <p>{livro.texto}</p>
          {livro.etapas.length > 0 && (
            <ul>
              {livro.etapas.map((t, i) => <li key={i} style={{ fontWeight: etapa === i + 2 ? 700 : 400 }}>Etapa {i + 2}: {t}</li>)}
            </ul>
          )}
        </>
      }
    >
      {(alternar) => (
        <span className="ess-nome">
          <b>{livro.nome}</b>
          <small className="ess-resumo">{atual.replace(/^\([^)]*\)\s*/, "")}</small>
          <button type="button" className="btn-mini ler" onClick={alternar}>Ler</button>
        </span>
      )}
    </Dica>
  );
}

/** Botão para trocar a essência de uma linha por outra do livro. */
export function TrocarEssencia({ tipo, existentes, onTrocar }: { tipo?: string; existentes: string[]; onTrocar: (nome: string) => void }) {
  return <SeletorEssencia tipo={tipo} existentes={existentes} onEscolher={onTrocar} rotulo="Trocar" className="btn-mini" />;
}

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ESSENCIAS, ROTULO_GRUPO, gruposDaClasse, type EssenciaLivro, type GrupoEssencia } from "../regras/essencias";

interface Props {
  /** tipo da classe (shinigami, quincy, hollow); sem tipo mostra tudo */
  tipo?: string;
  /** nomes das essências que a ficha já tem */
  existentes: string[];
  onEscolher: (nome: string) => void;
  rotulo?: string;
  /** classe do botão que abre a janela */
  className?: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SeletorEssencia({ tipo, existentes, onEscolher, rotulo = "Escolher essência do livro", className = "btn btn-paper" }: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<GrupoEssencia | "classe">("classe");
  const [livre, setLivre] = useState("");
  const [vista, setVista] = useState<EssenciaLivro | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", fechar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fechar);
      document.body.style.overflow = "";
    };
  }, [aberto]);

  const permitidos = gruposDaClasse(tipo);
  const lista = useMemo(() => {
    const q = norm(busca.trim());
    return ESSENCIAS.filter((e) => {
      if (grupo === "classe" ? !permitidos.includes(e.grupo) : e.grupo !== grupo) return false;
      return !q || norm(e.nome).includes(q) || norm(e.texto).includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, grupo, tipo]);

  const tem = (nome: string) => existentes.some((n) => n.trim().toLowerCase() === nome.toLowerCase());
  const escolher = (nome: string) => {
    onEscolher(nome);
    setAberto(false);
    setVista(null);
    setBusca("");
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
      {aberto && createPortal(
        <div className="seletor-fundo" role="dialog" aria-modal="true" aria-label="Escolher essência" onClick={(e) => e.target === e.currentTarget && setAberto(false)}>
          <div className="seletor">
            <div className="seletor-topo">
              <h3 className="title-font">Essências Espirituais</h3>
              <button type="button" className="fechar" onClick={() => setAberto(false)} aria-label="Fechar">×</button>
            </div>
            <input className="seletor-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou efeito" aria-label="Buscar essência" autoFocus />
            <div className="chips" role="group" aria-label="Grupo">
              <button type="button" className={`chip chip-btn ${grupo === "classe" ? "on" : ""}`} onClick={() => setGrupo("classe")}>Da minha classe</button>
              {permitidos.map((g) => (
                <button key={g} type="button" className={`chip chip-btn ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>
                  {ROTULO_GRUPO[g]}
                </button>
              ))}
            </div>
            <ul className="seletor-lista">
              {lista.length === 0 && <li className="ajuda">Nada encontrado. Use o campo abaixo para anotar uma essência própria.</li>}
              {lista.map((e) => {
                const aberta = vista?.nome === e.nome;
                const ja = tem(e.nome);
                return (
                  <li key={e.nome} className={aberta ? "aberta" : ""}>
                    <button type="button" className="seletor-item" onClick={() => setVista(aberta ? null : e)} aria-expanded={aberta}>
                      <b>{e.nome}</b>
                      <small>{ROTULO_GRUPO[e.grupo]}{e.repetivel ? " · repetível" : ""}{e.etapas.length ? ` · ${e.etapas.length + 1} etapas` : " · sem etapas"}</small>
                      {!aberta && <span className="seletor-previa">{e.texto.replace(/^\([^)]*\)\s*/, "")}</span>}
                      {ja && <em>já tem</em>}
                    </button>
                    {aberta && (
                      <div className="seletor-detalhe">
                        {e.texto.split("\n\n").map((p, i) => (p.startsWith("|") ? null : <p key={i}>{p}</p>))}
                        {e.etapas.length > 0 && (
                          <ol start={2}>
                            {e.etapas.map((t, i) => <li key={i}>{t}</li>)}
                          </ol>
                        )}
                        {e.nota && <p className="ajuda">{e.nota}</p>}
                        {ja && !e.repetivel ? (
                          <p className="ajuda">Você já tem esta essência: suba a etapa dela na lista.</p>
                        ) : (
                          <>
                            {e.grupo === "proibida" && <p className="ajuda">Proibida: só com a autorização do Mestre.</p>}
                            <button type="button" className="btn" onClick={() => escolher(e.nome)}>Adicionar {e.nome}</button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <form
              className="add-linha"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (livre.trim()) {
                  escolher(livre.trim());
                  setLivre("");
                }
              }}
            >
              <input value={livre} onChange={(e) => setLivre(e.target.value)} placeholder="Ou digite uma essência própria / combinada com o Mestre" aria-label="Essência própria" />
              <button className="btn-mini" type="submit">Anotar</button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

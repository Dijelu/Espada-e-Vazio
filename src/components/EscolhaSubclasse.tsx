import { useEffect, useState } from "react";
import { CLASSES, classePorId, type Ficha } from "../regras/ficha";
import descricoes from "../regras/subclasses.json";

const TEXTO = descricoes as Record<string, string>;

interface Props {
  f: Ficha;
  onEscolher: (nome: string) => void;
  onFechar: () => void;
}

/** Janela para escolher a subclasse (Caminho, Estilo, Tradição...) quando o personagem chega ao nível 3. */
export function EscolhaSubclasse({ f, onEscolher, onFechar }: Props) {
  const classe = classePorId(f.classe);
  const [livre, setLivre] = useState(f.subclasse);

  useEffect(() => {
    const t = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", t);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", t);
      document.body.style.overflow = "";
    };
  }, [onFechar]);

  if (!classe) return null;
  const emprestadas = classe.subclasses.length === 0 ? CLASSES.filter((c) => c.id !== classe.id).flatMap((c) => c.subclasses) : [];

  return (
    <div className="construtor" role="dialog" aria-modal="true" aria-label={`Escolher ${classe.subclasseNome}`}>
      <div className="construtor-topo">
        <div>
          <small className="ajuda">Nível {f.nivel} · {classe.nome}</small>
          <h2 className="title-font">Escolha a sua {classe.subclasseNome}</h2>
        </div>
        <button type="button" className="fechar" onClick={onFechar} aria-label="Fechar">×</button>
      </div>
      <p className="ajuda construtor-dica">Esta escolha define as características que você ganha nos níveis seguintes. Leia com calma: ela é parte da identidade do personagem.</p>
      <div className="construtor-corpo">
        {classe.subclasses.length > 0 ? (
          <div className="opcoes-grandes">
            {classe.subclasses.map((s) => (
              <button key={s} type="button" className={`opcao ${f.subclasse === s ? "on" : ""}`} onClick={() => onEscolher(s)}>
                <b>{s}</b>
                <small>{TEXTO[s] || "Veja os detalhes no Capítulo 3."}</small>
              </button>
            ))}
          </div>
        ) : (
          <>
            <p>O {classe.nome} escolhe a sua subclasse emprestada de outra classe. Escreva ou toque numa das opções.</p>
            <input className="seletor-busca" value={livre} onChange={(e) => setLivre(e.target.value)} placeholder="Subclasse emprestada" aria-label="Subclasse emprestada" />
            <div className="chips">
              {emprestadas.map((s) => <button key={s} type="button" className="chip chip-btn" onClick={() => setLivre(s)}>{s}</button>)}
            </div>
            <button type="button" className="btn" disabled={!livre.trim()} onClick={() => onEscolher(livre.trim())}>Usar {livre.trim() || "…"}</button>
          </>
        )}
      </div>
      <div className="construtor-rodape">
        <button type="button" className="btn btn-paper" onClick={onFechar}>Decidir depois</button>
      </div>
    </div>
  );
}

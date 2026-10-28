import type { ReactNode } from "react";
import { ATRIBUTOS, origemPorId, type Atr, type Ficha } from "../regras/ficha";

/** Controle de número com botões de mais e menos. */
export function Passo({
  valor,
  onChange,
  min = 0,
  max = 99,
  rotulo,
}: {
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  rotulo: string;
}) {
  return (
    <div className="passo" role="group" aria-label={rotulo}>
      <button type="button" onClick={() => onChange(Math.max(min, valor - 1))} disabled={valor <= min} aria-label={`Diminuir ${rotulo}`}>−</button>
      <output>{valor}</output>
      <button type="button" onClick={() => onChange(Math.min(max, valor + 1))} disabled={valor >= max} aria-label={`Aumentar ${rotulo}`}>+</button>
    </div>
  );
}

export function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <label className="campo">
      <span>{rotulo}</span>
      {children}
    </label>
  );
}

/** Variações da Origem, incluindo as etapas que o Hollow ganha com o nível. */
export function SeletorVariacoes({ ficha, onChange }: { ficha: Ficha; onChange: (p: Partial<Ficha>) => void }) {
  const o = origemPorId(ficha.origem);
  if (!o) return null;
  const gil = origemPorId("gillian")!;
  const adj = origemPorId("adjuchas")!;

  const bloco = (titulo: string, lista: typeof o.variacoes, valor: string, set: (id: string) => void) => (
    <fieldset className="variacoes">
      <legend>{titulo}</legend>
      {lista.map((v) => (
        <label key={v.id} className={`opcao ${valor === v.id ? "on" : ""}`}>
          <input type="radio" name={titulo} checked={valor === v.id} onChange={() => set(v.id)} />
          <b>{v.nome}</b>
          <span>{v.texto}</span>
        </label>
      ))}
    </fieldset>
  );

  const mente = (o.id === "hollow-comum" && ficha.variacaoGillian === "mente-clara") || (o.id === "gillian" && ficha.variacao === "mente-clara");

  return (
    <>
      {bloco(o.id === "hollow-comum" ? "Variação do Hollow Comum (níveis 1 a 4)" : "Variação", o.variacoes, ficha.variacao, (id) => onChange({ variacao: id }))}
      {o.id === "hollow-comum" && ficha.nivel >= 5 && bloco("Variação de Gillian (a partir do nível 5)", gil.variacoes, ficha.variacaoGillian, (id) => onChange({ variacaoGillian: id }))}
      {mente && ficha.nivel >= 10 && bloco("Variação de Adjuchas (a partir do nível 10)", adj.variacoes, ficha.variacaoAdjuchas, (id) => onChange({ variacaoAdjuchas: id }))}
    </>
  );
}

export function LinhaAtributos({ atr }: { atr: Record<Atr, number> }) {
  return (
    <div className="atrs">
      {ATRIBUTOS.map((a) => (
        <div className="atr" key={a.id}>
          <small>{a.sigla}</small>
          <b>{atr[a.id]}</b>
          <span>{a.nome}</span>
        </div>
      ))}
    </div>
  );
}

export const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()));

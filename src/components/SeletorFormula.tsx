import { resumoAnalise, type AnaliseDano } from "../regras/teto-dano";
import { useState } from "react";
import { valor, type CtxForma } from "../regras/efeitos-forma";
import { resolverDano } from "../regras/liberacoes";

/** Seleção no lugar de fórmulas digitadas: base (número, nível, proficiência ou atributo), multiplicador e soma. */

const BASES: { id: string; nome: string }[] = [
  { id: "FIXO", nome: "Número fixo" },
  { id: "PROF", nome: "Proficiência" },
  { id: "NIV", nome: "Nível" },
  { id: "FOR", nome: "Força" },
  { id: "DES", nome: "Destreza" },
  { id: "CON", nome: "Constituição" },
  { id: "MEN", nome: "Mente" },
  { id: "ESP", nome: "Espírito" },
];
const MULTS: { id: string; nome: string }[] = [
  { id: "d3", nome: "÷ 3" },
  { id: "d2", nome: "÷ 2 (metade)" },
  { id: "x1", nome: "× 1" },
  { id: "x2", nome: "× 2" },
  { id: "x3", nome: "× 3" },
  { id: "x4", nome: "× 4" },
  { id: "x5", nome: "× 5" },
  { id: "x10", nome: "× 10" },
];

interface Partes { base: string; mult: string; soma: number }

/** Lê uma fórmula simples ([PROF]*2+1, [NIV]/2, 5); devolve null se for mais complicada que isso. */
export function lerFormula(txt: string | number | undefined): Partes | null {
  const t = String(txt ?? "0").replace(/\s+/g, "").replace(/\b(NIV|PROF|FOR|DES|CON|MEN|ESP)\b/g, "[$1]").replace(/\[\[(\w+)\]\]/g, "[$1]");
  if (/^-?\d+$/.test(t)) return { base: "FIXO", mult: "x1", soma: Number(t) };
  const m = /^\[(NIV|PROF|FOR|DES|CON|MEN|ESP)\](?:\*(\d+)|\/(\d+))?(?:([+-]\d+))?$/.exec(t);
  if (!m) return null;
  const mult = m[2] ? `x${m[2]}` : m[3] ? `d${m[3]}` : "x1";
  if (!MULTS.some((x) => x.id === mult)) return null;
  return { base: m[1], mult, soma: m[4] ? Number(m[4]) : 0 };
}

export function montarFormula(p: Partes): string {
  if (p.base === "FIXO") return String(p.soma);
  const op = p.mult === "x1" ? "" : p.mult.startsWith("x") ? `*${p.mult.slice(1)}` : `/${p.mult.slice(1)}`;
  const soma = p.soma > 0 ? `+${p.soma}` : p.soma < 0 ? String(p.soma) : "";
  return `[${p.base}]${op}${soma}`;
}

interface PropsValor {
  rotulo: string;
  valor: string | number;
  onChange: (v: string) => void;
  ctx?: CtxForma;
  /** atributos aparecem como base? (some em contextos onde só faz sentido número/nível/proficiência) */
  semAtributos?: boolean;
}

export function SeletorValor({ rotulo, valor: v, onChange, ctx, semAtributos }: PropsValor) {
  const lido = lerFormula(v);
  const [livre, setLivre] = useState(false);
  const bases = semAtributos ? BASES.slice(0, 3) : BASES;
  const atual = valor(String(v), ctx ?? { n: 1, prof: 2, atr: { for: 0, des: 0, con: 0, men: 0, esp: 0 } });
  if (!lido || livre) {
    return (
      <div className="seletor-formula">
        <span className="rotulo-sel">{rotulo}</span>
        <p className="ajuda">Conta personalizada: <code>{String(v)}</code>{ctx ? ` (vale ${atual} agora)` : ""}</p>
        <button type="button" className="link" onClick={() => { setLivre(false); onChange("0"); }}>Trocar por seleção</button>
      </div>
    );
  }
  const mud = (p: Partial<Partes>) => onChange(montarFormula({ ...lido, ...p }));
  return (
    <div className="seletor-formula">
      <span className="rotulo-sel">{rotulo}</span>
      <div className="linha-sel">
        <select aria-label={`${rotulo}: de onde vem`} value={lido.base} onChange={(e) => mud({ base: e.target.value, mult: "x1", soma: e.target.value === "FIXO" ? Math.max(1, lido.soma) : 0 })}>
          {bases.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
        </select>
        {lido.base !== "FIXO" && (
          <select aria-label={`${rotulo}: multiplicador`} value={lido.mult} onChange={(e) => mud({ mult: e.target.value })}>
            {MULTS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        )}
        <label className="soma-sel">{lido.base === "FIXO" ? "Valor" : "Somar"}
          <input type="number" aria-label={`${rotulo}: ${lido.base === "FIXO" ? "valor" : "somar"}`} min={-20} max={99} value={lido.soma} onChange={(e) => mud({ soma: Math.max(-20, Math.min(99, Math.floor(Number(e.target.value) || 0))) })} />
        </label>
        {ctx && lido.base !== "FIXO" && <small className="ajuda">= {atual} no seu nível</small>}
      </div>
    </div>
  );
}

interface PropsDano {
  rotulo?: string;
  valor: string;
  onChange: (v: string) => void;
  ctx?: CtxForma;
  /** limites e custo calculados (teto de dano) */
  analise?: AnaliseDano | null;
}

const DADOS = [4, 6, 8, 10, 12, 20];
const dentro = (formula: string) => formula.replace(/\[([A-Z]{3,4})\]/g, "$1");
const embrulha = (formula: string) => (/^\d+$/.test(formula) ? formula : `[${dentro(formula)}]`);

/** Dano em dados escolhido por seleção: quantidade de dados (fixa ou por nível/proficiência), tipo de dado e bônus. */
export function SeletorDano({ rotulo = "Dano", valor: v, onChange, ctx, analise }: PropsDano) {
  const txt = (v ?? "").replace(/\s+/g, "");
  const m = /^(\[[^\]]+\]|\d+)d(\d+)(?:\+(\[[^\]]+\]|\d+))?$/.exec(txt);
  const [livre, setLivre] = useState(false);
  const previa = ctx && txt ? resolverDano(txt, { nivel: ctx.n } as never, { prof: ctx.prof, atr: ctx.atr } as never) : "";
  if (txt === "") {
    return (
      <div className="seletor-formula">
        <span className="rotulo-sel">{rotulo}</span>
        <button type="button" className="btn-mini" onClick={() => onChange("1d8")}>Adicionar dano em dados</button>
      </div>
    );
  }
  if (!m || livre) {
    return (
      <div className="seletor-formula">
        <span className="rotulo-sel">{rotulo}</span>
        <p className="ajuda">Dano personalizado: <code>{v}</code>{previa ? ` (rola ${previa})` : ""}</p>
        <div className="acoes-linha">
          <button type="button" className="link" onClick={() => { setLivre(false); onChange("1d8"); }}>Trocar por seleção</button>
          <button type="button" className="link-perigo" onClick={() => onChange("")}>Sem dano</button>
        </div>
      </div>
    );
  }
  const qtd = lerFormula(m[1].startsWith("[") ? dentro(m[1].slice(1, -1)) : m[1]);
  const bonus = m[3] ? lerFormula(m[3].startsWith("[") ? m[3].slice(1, -1) : m[3]) : { base: "FIXO", mult: "x1", soma: 0 };
  if (!qtd || !bonus) {
    return (
      <div className="seletor-formula">
        <span className="rotulo-sel">{rotulo}</span>
        <p className="ajuda">Dano personalizado: <code>{v}</code>{previa ? ` (rola ${previa})` : ""}</p>
        <button type="button" className="link" onClick={() => { setLivre(false); onChange("1d8"); }}>Trocar por seleção</button>
      </div>
    );
  }
  const gera = (q: string, d: number, b: string) => `${embrulha(q)}d${d}${b && b !== "0" ? `+${embrulha(b)}` : ""}`;
  const q = montarFormula(qtd);
  const b = montarFormula(bonus);
  const d = Number(m[2]);
  return (
    <div className="seletor-formula seletor-dano">
      <span className="rotulo-sel">{rotulo}</span>
      <SeletorValor rotulo="Quantidade de dados" valor={q} semAtributos onChange={(x) => onChange(gera(x === "0" ? "1" : x, d, b))} ctx={ctx} />
      <label className="soma-sel">Dado
        <select aria-label={`${rotulo}: tipo de dado`} value={d} onChange={(e) => onChange(gera(q, Number(e.target.value), b))}>
          {DADOS.filter((x) => !analise || x <= analise.facesMax || x === d).map((x) => <option key={x} value={x}>d{x}</option>)}
        </select>
      </label>
      <SeletorValor rotulo="Bônus fixo no dano" valor={b} onChange={(x) => onChange(gera(q, d, x))} ctx={ctx} />
      <p className="ajuda">Rola: <b>{previa || txt}</b></p>
      {analise && <p className={`ajuda teto-dano ${analise.erros.length ? "estourou" : ""}`}>{resumoAnalise(analise)}</p>}
      {analise?.erros.map((e) => <p key={e} className="aviso-mini" role="alert">{e}</p>)}
      <button type="button" className="link-perigo" onClick={() => onChange("")}>Tirar o dano</button>
    </div>
  );
}

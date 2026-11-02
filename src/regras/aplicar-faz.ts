/* Aplica à ficha o que um gatilho de forma faz (cura, PV temporários, PR, dano rolado, condição). */
import type { Calculo, Ficha } from "./ficha";
import { ATR_NOME, valor, type Faz } from "./efeitos-forma";
import { resolverDano } from "./liberacoes";

export interface ResultadoFaz {
  /** campos da ficha que mudam (PV, PR) */
  parte: Partial<Ficha>;
  /** novo valor de PV temporários, se o gatilho der */
  pvTemp?: number;
  /** o que aconteceu, em palavras */
  dito: string[];
  /** expressão de dano para rolar, se houver */
  rolar?: string;
}

export function aplicarFaz(f: Ficha, c: Calculo, z: Faz): ResultadoFaz {
  const ctx = { n: f.nivel, prof: c.prof, atr: c.atr };
  const parte: Partial<Ficha> = {};
  const dito: string[] = [];
  let pvTemp: number | undefined;
  let rolar: string | undefined;
  if (z.curaPv !== undefined) { const v = valor(z.curaPv, ctx); parte.pvAtual = Math.min(c.pv, f.pvAtual + v); dito.push(`+${v} PV`); }
  if (z.pvTemp !== undefined) { const v = valor(z.pvTemp, ctx); pvTemp = Math.max(f.estado.pvTemp ?? 0, v); dito.push(`${v} PV temporários`); }
  if (z.pr !== undefined) { const v = valor(z.pr, ctx); parte.prAtual = Math.min(c.pr, f.prAtual + v); dito.push(`+${v} PR`); }
  if (z.prTemp !== undefined) { const v = valor(z.prTemp, ctx); parte.prAtual = (parte.prAtual ?? f.prAtual) + v; dito.push(`+${v} PR extras`); }
  if (z.dano) { rolar = resolverDano(z.dano.expr, f, c); dito.push(`${z.dano.tipo}${z.dano.area ? ` (${z.dano.area})` : ""}`); }
  if (z.condicao) {
    const cd = 8 + c.prof + c.atr.esp;
    dito.push(`o alvo fica ${z.condicao.nome}${z.condicao.salva ? ` (salvaguarda de ${ATR_NOME[z.condicao.salva]}, CD ${cd}; na falha)` : ""}${z.condicao.duracao ? ` por ${z.condicao.duracao}` : ""}`);
  }
  if (z.texto) dito.push(z.texto);
  return { parte, pvTemp, dito, rolar };
}

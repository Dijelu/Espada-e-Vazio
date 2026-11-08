/* Custo de liberação e duração de uma forma, calculados a partir das peças escolhidas.
   Um turno dura 6 segundos: 10 turnos = 1 minuto. */
import type { FormaLib } from "./ficha";
import { custoPeca, valor, type CtxForma, type InstEfeito } from "./efeitos-forma";

export const TURNOS_POR_MINUTO = 10;

/** "1 minuto (10 turnos)", "30 segundos (5 turnos)", "1 min 30 s (15 turnos)". */
export function duracaoEmPalavras(turnos: number): string {
  const t = Math.max(1, Math.round(turnos));
  const seg = t * 6;
  const min = Math.floor(seg / 60);
  const resto = seg % 60;
  const tempo = min === 0 ? `${seg} segundos` : resto === 0 ? `${min} ${min === 1 ? "minuto" : "minutos"}` : `${min} min ${resto} s`;
  return `${tempo} (${t} ${t === 1 ? "turno" : "turnos"})`;
}

export interface Liberacao {
  /** PR para liberar; null quando a regra da forma fixa o custo */
  custoPr: number | null;
  /** duração em turnos; null quando a forma dura até o fim da cena ou até você encerrar */
  turnos: number | null;
  duracaoTexto: string;
  /** passos da conta, para mostrar ao jogador */
  conta: string[];
}

interface Extra {
  /** Bankai Plena: só muda o texto da conta. A ficha guarda o custo cheio e a metade é cobrada na hora de liberar (custoBankai, em liberacoes.ts). */
  plena?: boolean;
  /** conta antiga, que já gravava o custo da Plena pela metade: só para o reparo reconhecer fichas salvas assim */
  metadeAntiga?: boolean;
}

/** Poder bruto da forma: soma dos preços positivos (sem contar o que os pontos fracos devolvem). */
export function poderBruto(pecas: InstEfeito[], ctx: CtxForma): number {
  return pecas.reduce((s, p) => s + Math.max(0, custoPeca(p, ctx)), 0);
}

export function calcularLiberacao(tipo: FormaLib["tipo"], pecas: InstEfeito[], ctx: CtxForma, extra: Extra = {}): Liberacao {
  const poder = poderBruto(pecas, ctx);
  const conta: string[] = [];
  let custoPr: number | null = null;

  if (tipo === "shikai") {
    custoPr = Math.max(3, Math.min(10, 3 + Math.ceil(poder * 0.85)));
    conta.push(`Custo: 3 PR de base + 0,85 por ponto de poder (${poder}) = ${custoPr} PR (de 3 a 10).`);
  } else if (tipo === "bankai") {
    const bruto = Math.max(20, Math.min(80, Math.round(20 + poder * 3)));
    custoPr = extra.metadeAntiga ? Math.ceil(bruto / 2) : bruto;
    conta.push(`Custo: 20 PR de base + 3 por ponto de poder (${poder}) = ${bruto} PR (de 20 a 80).`);
  } else if (tipo === "bankai2") {
    custoPr = Math.max(40, Math.min(80, Math.round(30 + poder * 3)));
    conta.push(`Custo: 30 PR de base + 3 por ponto de poder (${poder}) = ${custoPr} PR (de 40 a 80).`);
  }

  // duração
  const base = tipo === "bankai" || tipo === "bankai2" ? TURNOS_POR_MINUTO : null;
  let limite: number | null = null;
  let mais = 0;
  for (const p of pecas) for (const e of p.efeitos) {
    if (e.k === "duracao") { const v = Math.max(1, valor(e.turnos, ctx)); limite = limite === null ? v : Math.min(limite, v); }
    if (e.k === "duracaoMais") mais += Math.max(0, valor(e.turnos, ctx));
  }
  let turnos: number | null = base;
  if (base !== null) {
    conta.push(`Duração de base: ${duracaoEmPalavras(base)}.`);
    if (limite !== null) { turnos = Math.min(base, limite); conta.push(`Cartão de duração curta: limite de ${duracaoEmPalavras(limite)}.`); }
    if (mais > 0 && turnos !== null) { turnos += mais; conta.push(`Cartões de duração extra: +${mais} turnos.`); }
  } else {
    if (limite !== null) { turnos = limite; conta.push(`Cartão de duração curta: a forma dura ${duracaoEmPalavras(limite)}.`); }
    if (mais > 0 && turnos !== null) { turnos += mais; conta.push(`Cartões de duração extra: +${mais} turnos.`); }
  }
  if (turnos !== null && mais > 0 && custoPr !== null) {
    const adicional = Math.ceil(mais / TURNOS_POR_MINUTO * 4);
    custoPr = Math.min(80, custoPr + adicional);
    conta.push(`Duração maior pesa no custo: +${adicional} PR = ${custoPr} PR.`);
  }
  if (tipo === "bankai" && extra.plena && custoPr !== null) conta.push(`Bankai Plena: ao liberar você paga a metade, ${Math.ceil(custoPr / 2)} PR (a ficha guarda o custo cheio, ${custoPr} PR).`);
  const duracaoTexto = turnos !== null ? duracaoEmPalavras(turnos) : tipo === "shikai" || tipo === "vollstandig" ? "até você encerrar" : "até o fim da cena";
  return { custoPr, turnos, duracaoTexto, conta };
}

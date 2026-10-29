/* Simulador de combate do Mestre: duelos 1v1 (NPC pareado) por sorteio de muitas lutas. */

export interface Acao {
  id: string;
  nome: string;
  /** bônus total de acerto */
  acerto: number;
  /** expressão de dano, ex.: "2d8+3" */
  dano: string;
  /** golpes por turno */
  golpes: number;
  /** custo em PR (0 = ataque comum) */
  custo: number;
  /** dano esotérico/de energia: ignora o Hierro e a RD física */
  esoterico: boolean;
  /** menor valor do d20 que é crítico */
  crit: number;
  mult: number;
}

export interface Combatente {
  nome: string;
  pv: number;
  pr: number;
  cr: number;
  iniciativa: number;
  rdFis: number;
  rdEso: number;
  hierro: boolean;
  acoes: Acao[];
}

const d = (n: number) => 1 + Math.floor(Math.random() * n);

interface Termos { dados: [number, number][]; fixo: number }

export function lerDano(expr: string): Termos {
  const dados: [number, number][] = [];
  let fixo = 0;
  for (const m of expr.replace(/\s+/g, "").matchAll(/([+-]?)(\d+)d(\d+)|([+-]?)(\d+)/gi)) {
    if (m[3]) dados.push([(m[1] === "-" ? -1 : 1) * Number(m[2]), Number(m[3])]);
    else if (m[5]) fixo += (m[4] === "-" ? -1 : 1) * Number(m[5]);
  }
  return { dados, fixo };
}

export const mediaDano = (expr: string) => {
  const t = lerDano(expr);
  return t.dados.reduce((s, [n, f]) => s + n * (f + 1) / 2, 0) + t.fixo;
};

function rolarDano(t: Termos, mult: number) {
  let s = 0;
  for (const [n, f] of t.dados) for (let i = 0; i < Math.abs(n); i++) s += Math.sign(n) * d(f) * mult;
  return s + t.fixo;
}

const chanceAcerto = (acerto: number, cr: number) => Math.min(0.95, Math.max(0.05, (21 - (cr - acerto)) / 20));

function esperado(a: Acao, alvo: Combatente) {
  const t = lerDano(a.dano);
  const media = mediaDano(a.dano);
  const pc = Math.max(0.05, (21 - a.crit) / 20);
  const ph = Math.max(chanceAcerto(a.acerto, alvo.cr), pc);
  const bruto = media + pc * Math.max(0, a.mult - 1) * (media - t.fixo);
  const reduz = a.esoterico ? alvo.rdEso : alvo.rdFis;
  const fator = !a.esoterico && alvo.hierro ? 0.5 : 1;
  return a.golpes * ph * Math.max(0, bruto * fator - reduz);
}

function golpe(a: Acao, alvo: Combatente) {
  const t = lerDano(a.dano);
  const r = d(20);
  if (r === 1) return 0;
  const crit = r >= a.crit;
  if (!crit && r !== 20 && r + a.acerto < alvo.cr) return 0;
  let dano = rolarDano(t, 1) + (crit ? rolarDano({ dados: t.dados, fixo: 0 }, Math.max(1, a.mult) - 1) : 0);
  if (!a.esoterico && alvo.hierro) dano = Math.floor(dano / 2);
  return Math.max(0, dano - (a.esoterico ? alvo.rdEso : alvo.rdFis));
}

/** Escolhe a ação de maior dano esperado que ainda cabe nos PR. */
function escolher(c: { acoes: Acao[] }, pr: number, alvo: Combatente) {
  let melhor: Acao | null = null;
  let m = -1;
  for (const a of c.acoes) {
    if (a.custo > pr) continue;
    const e = esperado(a, alvo);
    if (e > m) { m = e; melhor = a; }
  }
  return melhor;
}

export interface Resultado {
  lutas: number;
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
  rodadas: number;
  /** PV médios que o vencedor tinha ao fim, em % */
  pvRestanteA: number;
  pvRestanteB: number;
  danoRodadaA: number;
  danoRodadaB: number;
}

export function duelo(a: Combatente, b: Combatente, lutas: number, limite = 40): Resultado {
  const r: Resultado = { lutas, vitoriasA: 0, vitoriasB: 0, empates: 0, rodadas: 0, pvRestanteA: 0, pvRestanteB: 0, danoRodadaA: 0, danoRodadaB: 0 };
  let nA = 0, nB = 0, totA = 0, totB = 0, rodTotal = 0;
  for (let i = 0; i < lutas; i++) {
    let pvA = a.pv, pvB = b.pv, prA = a.pr, prB = b.pr;
    const aPrimeiro = d(20) + a.iniciativa >= d(20) + b.iniciativa;
    let rod = 0;
    while (pvA > 0 && pvB > 0 && rod < limite) {
      rod++;
      const ordem = aPrimeiro ? [0, 1] : [1, 0];
      for (const quem of ordem) {
        if (pvA <= 0 || pvB <= 0) break;
        const eu = quem === 0 ? a : b;
        const alvo = quem === 0 ? b : a;
        const pr = quem === 0 ? prA : prB;
        const ac = escolher(eu, pr, alvo);
        if (!ac) continue;
        if (quem === 0) prA -= ac.custo; else prB -= ac.custo;
        let dano = 0;
        for (let g = 0; g < ac.golpes; g++) dano += golpe(ac, alvo);
        if (quem === 0) { pvB -= dano; totA += dano; } else { pvA -= dano; totB += dano; }
      }
    }
    rodTotal += rod;
    if (pvB <= 0 && pvA > 0) { r.vitoriasA++; r.pvRestanteA += pvA / a.pv; nA++; }
    else if (pvA <= 0 && pvB > 0) { r.vitoriasB++; r.pvRestanteB += pvB / b.pv; nB++; }
    else r.empates++;
  }
  r.rodadas = rodTotal / lutas;
  r.pvRestanteA = nA ? (100 * r.pvRestanteA) / nA : 0;
  r.pvRestanteB = nB ? (100 * r.pvRestanteB) / nB : 0;
  r.danoRodadaA = totA / Math.max(1, rodTotal);
  r.danoRodadaB = totB / Math.max(1, rodTotal);
  return r;
}

export type Veredito = { texto: string; nivel: "ok" | "tolera" | "fora" };
/** Meta do livro: o jogador vence de 55% a 65%; tolerância de 45% a 75%. */
export function veredito(vitoriasJogador: number): Veredito {
  const p = vitoriasJogador * 100;
  if (p >= 55 && p <= 65) return { texto: "Dentro da meta do livro (55% a 65%).", nivel: "ok" };
  if (p >= 45 && p <= 75) return { texto: p < 55 ? "Dentro da tolerância, um pouco duro para o jogador." : "Dentro da tolerância, um pouco fácil para o jogador.", nivel: "tolera" };
  return { texto: p < 45 ? "Duro demais: tire cerca de 10% dos PV do NPC." : "Fácil demais: some cerca de 10% aos PV do NPC.", nivel: "fora" };
}

/* ---------- NPC pareado (Capítulo 14) ---------- */
export const FATOR_K = [2.5, 1.9, 1.65, 1.45, 1.5, 1.375, 1.25, 1.1, 1.15, 1.3, 1.35, 1.1, 1.2, 1.07, 1.08, 1.0, 1.07, 1.0, 1.0, 1.0];

export function fatorSuporte(n: number) {
  if (n === 1) return 1.1;
  if (n === 2) return 1.0;
  if (n === 3) return 0.75;
  if (n === 4) return 0.7;
  if (n <= 6) return 0.65;
  if (n <= 8) return 0.6;
  if (n === 9) return 0.65;
  if (n === 10) return 0.38;
  if (n === 11) return 0.35;
  if (n <= 15) return 0.32;
  if (n === 16) return 0.28;
  if (n === 17) return 0.3;
  if (n === 18) return 0.28;
  if (n === 19) return 0.21;
  return 0.13;
}

/** Multiplica o número de dados por k, arredondando para baixo (mínimo 1 dado em cada termo). */
export function escalarDados(expr: string, k: number) {
  return expr.replace(/(\d+)d(\d+)/gi, (_, n: string, f: string) => `${Math.max(1, Math.floor(Number(n) * k + 1e-9))}d${f}`);
}

export interface OpcoesPareado { nivel: number; suporte: boolean; hollow: boolean; pvExtra: number }

/** Aplica as regras do NPC pareado sobre uma ficha de ameaça comum. */
export function pareado(base: Combatente, o: OpcoesPareado): Combatente {
  const n = Math.min(20, Math.max(1, o.nivel));
  const k = FATOR_K[n - 1];
  let pv = Math.floor(base.pv * k);
  let acoes = base.acoes.map((a) => ({ ...a, dano: escalarDados(a.dano, k) }));
  if (o.suporte) {
    const fs = fatorSuporte(n);
    pv = Math.floor(pv * (n === 2 ? 1.1 : fs));
    if (n !== 2) acoes = acoes.map((a) => ({ ...a, dano: escalarDados(a.dano, fs) }));
  }
  pv = Math.floor(pv * (1 + o.pvExtra / 100));
  return { ...base, pv, acoes, hierro: o.hollow || base.hierro };
}

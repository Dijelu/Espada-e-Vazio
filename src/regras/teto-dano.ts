/* Teto de dano das habilidades criadas pelo jogador e custo em PR calculado a partir do dano.
   Referência: o golpe mais forte dos modelos do livro (Golpe em área, 20 PR): (nível/2 + 4) dados de d10 + o maior atributo. */
import { resolverDano } from "./liberacoes";
import type { CtxForma } from "./efeitos-forma";

export type TipoAcao = "acao" | "bonus" | "reacao";

export function tipoDeAcao(acao: string): TipoAcao {
  const t = acao.toLowerCase();
  if (/b[oô]nus/.test(t)) return "bonus";
  if (/rea[cç][aã]o/.test(t)) return "reacao";
  return "acao";
}

/** Quanto do dano de referência cada tipo de ação pode causar. */
const FATOR: Record<TipoAcao, number> = { acao: 1.15, bonus: 0.6, reacao: 0.85 };
/** As transformações são o ponto alto da história do personagem, então o teto de dano delas é mais folgado que o de uma habilidade comum. */
const FORMA: Record<string, { fator: number; dados: number }> = {
  shikai: { fator: 1.15, dados: 0 },
  bankai: { fator: 1.3, dados: 2 },
  resurreccion: { fator: 1.3, dados: 2 },
  vollstandig: { fator: 1.3, dados: 2 },
  bankai2: { fator: 1.45, dados: 3 },
  segunda: { fator: 1.45, dados: 3 },
};
const FORMA_PADRAO = FORMA.bankai;
/** Custo em PR no teto de cada tipo de ação (como nos modelos do livro). */
const CUSTO_MAX: Record<TipoAcao, number> = { acao: 20, bonus: 8, reacao: 10 };
/** Todo ataque com dano custa pelo menos esta parte do custo máximo. */
const PISO = 0.25;

const maiorAtr = (ctx: CtxForma) => Math.max(...Object.values(ctx.atr));

export function referenciaDano(ctx: CtxForma): number {
  return (Math.floor(ctx.n / 2) + 4) * 5.5 + maiorAtr(ctx);
}

export interface AnaliseDano {
  media: number;
  /** maior média que a ação aguenta */
  teto: number;
  /** custo em PR, calculado a partir do dano */
  custoPr: number;
  qtdMax: number;
  facesMax: number;
  bonusMax: number;
  /** bloqueiam o salvamento */
  erros: string[];
  /** só informam (não bloqueiam): o dano base digitado passa do teto */
  avisos: string[];
}

/** Lê o dano já resolvido ("10d12+5") e soma dados, maior dado e bônus fixo. */
function lerResolvido(txt: string) {
  let qtd = 0, media = 0, faces = 0;
  for (const m of txt.matchAll(/(\d+)d(\d+)/g)) {
    const n = Number(m[1]), d = Number(m[2]);
    qtd += n; faces = Math.max(faces, d); media += (n * (d + 1)) / 2;
  }
  const resto = txt.replace(/\d+d\d+/g, "0");
  let fixo = 0;
  if (/^[0-9+\-*/(). ]+$/.test(resto)) {
    for (const t of resto.replace(/\s+/g, "").matchAll(/([+-]?)(\d+)/g)) fixo += (t[1] === "-" ? -1 : 1) * Number(t[2]);
  }
  return { qtd, faces, media: media + fixo, fixo };
}

/** Técnica especial (1 uso por cena + condição para quem usa): quanto o teto sobe depende de quão ruim é a condição e de quanto tempo dura. */
export const BONUS_ESPECIAL = 1.4;
/** Aumento do teto (em %) para cada condição, quando dura até o fim da cena. */
export const PCT_CONDICAO: Record<string, number> = {
  Surdo: 30, Caído: 30, Agarrado: 35, Amedrontado: 40, Distorcido: 40, Queimado: 50,
  Sangramento: 60, Cego: 60, Preso: 60, Congelado: 65, Esgotado: 70, Atordoado: 90,
};
/** Multiplicador da duração sobre a porcentagem da condição. */
export const MULT_DURACAO: Record<string, number> = {
  "até o fim do próximo turno": 0.5, "até o fim da cena": 1, "até um descanso curto": 1.4, "até um descanso longo": 1.8,
};
export type Especial = { condicao: string; duracao: string };

/** Quanto a técnica especial aumenta o teto (em %), de 10 a 120. Sem dados da condição, vale os 40% de antes. */
export function pctEspecial(esp: Especial | boolean | undefined | null): number {
  if (!esp) return 0;
  if (esp === true) return 40;
  const base = PCT_CONDICAO[esp.condicao] ?? 40;
  const mult = MULT_DURACAO[esp.duracao] ?? 1;
  return Math.max(10, Math.min(120, Math.round(base * mult)));
}
/** Máximo de dados: base do nível e da forma, mais a mesma porcentagem que a técnica especial soma ao teto. */
const qtdMaxDe = (ctx: CtxForma, formaDados: number, pct: number) => Math.ceil((Math.floor(ctx.n / 2) + 5 + formaDados) * (1 + pct / 100));

export function analisarDano(expr: string | undefined, acao: string, ctx: CtxForma, comAval = false, especialEnt: Especial | boolean | undefined | null = false): AnaliseDano | null {
  const pct = pctEspecial(especialEnt);
  const especial = pct > 0;
  const txt = (expr ?? "").replace(/\s+/g, "");
  if (!txt || !/\d+d\d+/.test(txt) && !/\[.*\]d\d+/.test(txt)) return null;
  const resolvido = resolverDano(txt, { nivel: ctx.n } as never, { prof: ctx.prof, atr: ctx.atr } as never);
  if (!/\d+d\d+/.test(resolvido)) return null;
  const { qtd, faces, media, fixo } = lerResolvido(resolvido);
  const tipo = tipoDeAcao(acao);
  const forma = FORMA[ctx.tipo ?? ""] ?? FORMA_PADRAO;
  const ref = referenciaDano(ctx) * FATOR[tipo] * forma.fator * (1 + pct / 100);
  const custoMax = CUSTO_MAX[tipo];
  const teto = ref * (comAval ? 1.25 : 1);
  const bruto = Math.max(PISO, (media / ref - 0.5) / 0.5);
  const custoPr = Math.max(1, Math.min(custoMax, Math.ceil(custoMax * bruto)));
  const qtdMax = qtdMaxDe(ctx, forma.dados, pct);
  const facesMax = especial || forma.dados > 0 || custoPr <= custoMax / 2 ? 12 : 10;
  const bonusMax = maiorAtr(ctx) + ctx.prof;
  const erros: string[] = [];
  if (qtd > qtdMax) erros.push(`Dados demais para o seu nível: use até ${qtdMax}.`);
  if (faces > facesMax) erros.push(`O d${faces} só vale em ataques baratos (até ${Math.floor(custoMax / 2)} PR). Use d${facesMax} ou menor.`);
  if (fixo > bonusMax) erros.push(`Bônus fixo alto demais: use até ${bonusMax}.`);
  // O teto vale só para o dano BASE da ação. Dados extras de cartões e peças de aumento de dano podem passar dele.
  const avisos: string[] = [];
  if (media > teto + 0.01) avisos.push(`O dano base (${Math.round(media)}) está acima do teto de referência (${Math.round(teto)}) para esta ação no nível ${ctx.n}.`);
  return { media, teto, custoPr, qtdMax, facesMax, bonusMax, erros, avisos };
}

/** Texto curto para mostrar ao jogador sob o editor de dano. */
export function resumoAnalise(a: AnaliseDano): string {
  return `Dano médio ${Math.round(a.media)} · custo calculado: ${a.custoPr} PR`;
}

/** Atributos que o ataque automático pode usar. */
export const ATR_AUTO: { id: string; chave: "for" | "des" | "con" | "men" | "esp"; nome: string }[] = [
  { id: "FOR", chave: "for", nome: "Força" }, { id: "DES", chave: "des", nome: "Destreza" }, { id: "CON", chave: "con", nome: "Constituição" },
  { id: "MEN", chave: "men", nome: "Mente" }, { id: "ESP", chave: "esp", nome: "Espírito" },
];

/**
 * Dano mais forte que a ação aguenta: dados por nível, o maior dado permitido e o atributo escolhido como bônus.
 * `fator` baixa o dano para ações que atingem vários alvos ou que também movem (Área 85%, Investida 80%).
 * Devolve a fórmula como a ficha guarda ("[NIV/2+3]d12+[ESP]"), ou null se nem 1 dado cabe.
 */
export function danoNoTeto(acao: string, ctx: CtxForma, atr: string, comAval = false, especial: Especial | boolean | undefined | null = false, fator = 1): string | null {
  const a0 = ATR_AUTO.find((x) => x.id === atr) ?? ATR_AUTO[4];
  const forma = FORMA[ctx.tipo ?? ""] ?? FORMA_PADRAO;
  const pct = pctEspecial(especial);
  const faces = pct > 0 || forma.dados > 0 ? 12 : 10;
  const bonus = Math.min(ctx.atr[a0.chave], maiorAtr(ctx) + ctx.prof);
  const metade = Math.floor(ctx.n / 2);
  // ações que valem menos que um ataque único: a parte do dano que o ataque único teria, não só do teto
  const cheio = fator < 1 ? danoNoTeto(acao, ctx, atr, comAval, especial, 1) : null;
  const mediaCheio = cheio ? (analisarDano(cheio, acao, ctx, comAval, especial)?.media ?? Infinity) : Infinity;
  for (let n = qtdMaxDe(ctx, forma.dados, pct); n >= 1; n--) {
    const k = n - metade;
    const expr = `[NIV/2${k > 0 ? `+${k}` : k < 0 ? String(k) : ""}]d${faces}+[${a0.id}]`;
    const an = analisarDano(expr, acao, ctx, comAval, especial);
    if (an && an.erros.length === 0 && an.media <= Math.min(an.teto, mediaCheio) * fator + 0.01 && bonus >= 0) return expr;
  }
  return null;
}

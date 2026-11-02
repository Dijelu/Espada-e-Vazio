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
const FATOR: Record<TipoAcao, number> = { acao: 1, bonus: 0.5, reacao: 0.75 };
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
  erros: string[];
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

export function analisarDano(expr: string | undefined, acao: string, ctx: CtxForma, comAval = false): AnaliseDano | null {
  const txt = (expr ?? "").replace(/\s+/g, "");
  if (!txt || !/\d+d\d+/.test(txt) && !/\[.*\]d\d+/.test(txt)) return null;
  const resolvido = resolverDano(txt, { nivel: ctx.n } as never, { prof: ctx.prof, atr: ctx.atr } as never);
  if (!/\d+d\d+/.test(resolvido)) return null;
  const { qtd, faces, media, fixo } = lerResolvido(resolvido);
  const tipo = tipoDeAcao(acao);
  const ref = referenciaDano(ctx) * FATOR[tipo];
  const custoMax = CUSTO_MAX[tipo];
  const teto = ref * (comAval ? 1.25 : 1);
  const bruto = Math.max(PISO, (media / ref - 0.5) / 0.5);
  const custoPr = Math.max(1, Math.min(custoMax, Math.ceil(custoMax * bruto)));
  const qtdMax = Math.floor(ctx.n / 2) + 4;
  const facesMax = custoPr <= custoMax / 2 ? 12 : 10;
  const bonusMax = maiorAtr(ctx) + ctx.prof;
  const erros: string[] = [];
  if (qtd > qtdMax) erros.push(`Dados demais: o máximo no seu nível é ${qtdMax} (metade do nível mais 4).`);
  if (faces > facesMax) erros.push(`O d${faces} só vale em ataques baratos (até ${Math.floor(custoMax / 2)} PR). Use d${facesMax} ou menor.`);
  if (fixo > bonusMax) erros.push(`Bônus fixo alto demais: o máximo é ${bonusMax} (maior atributo mais proficiência).`);
  if (media > teto + 0.01) erros.push(`Dano médio ${Math.round(media)} passa do teto de ${Math.round(teto)} para esta ação no nível ${ctx.n}.`);
  return { media, teto, custoPr, qtdMax, facesMax, bonusMax, erros };
}

/** Texto curto para mostrar ao jogador sob o editor de dano. */
export function resumoAnalise(a: AnaliseDano): string {
  return `Dano médio ${Math.round(a.media)} · teto ${Math.round(a.teto)} · custo calculado: ${a.custoPr} PR`;
}

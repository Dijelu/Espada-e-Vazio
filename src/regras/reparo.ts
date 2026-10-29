/* Conserta fichas antigas ou com dados fora do padrão. Só mexe no que é seguro e diz o que mudou. */
import kidosJson from "./kidos.json";
import tecnicasJson from "./tecnicas-reishi.json";
import { ATRIBUTOS, PERICIAS, calcular, classePorId, normalizar, origemPorId, type Atr, type Ficha } from "./ficha";
import { SCHRIFTS } from "./schrifts";

const LIBERACOES = ["", "shikai", "bankai", "resurreccion", "terror", "vollstandig", "mascara"];
const ATR_IDS = ATRIBUTOS.map((a) => a.id);
const kidosValidos = new Set((kidosJson as { tipo: string; n: number }[]).map((k) => `${k.tipo}:${k.n}`));
const tecnicasValidas = new Set((tecnicasJson as { nome: string }[]).map((t) => t.nome));

const inteiro = (v: unknown, min: number, max: number, padrao: number) => {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : padrao;
  return Math.min(max, Math.max(min, n));
};
const unicos = <T,>(l: T[], chave: (x: T) => string = (x) => String(x)) => {
  const vistos = new Set<string>();
  return l.filter((x) => (vistos.has(chave(x)) ? false : (vistos.add(chave(x)), true)));
};

export interface Reparo { ficha: Ficha; mudancas: string[] }

export function repararFicha(bruta: Ficha): Reparo {
  const f = normalizar(structuredClone(bruta));
  const m: string[] = [];
  const nota = (t: string) => m.push(t);

  const nivel = inteiro(f.nivel, 1, 20, 1);
  if (nivel !== f.nivel) { nota(`Nível ajustado para ${nivel}.`); f.nivel = nivel; }
  f.xp = inteiro(f.xp, 0, 100000, 0);
  if (typeof f.nome !== "string") f.nome = "";

  for (const campo of ["base", "livre", "nivelAtr"] as const) {
    for (const a of ATR_IDS) {
      const v = f[campo][a as Atr];
      if (typeof v !== "number" || !Number.isFinite(v)) { f[campo][a as Atr] = 0; nota(`Valor inválido em ${campo} (${a}) zerado.`); }
    }
  }

  if (f.classe && !classePorId(f.classe)) nota("A classe salva não existe mais. Escolha a classe de novo na ficha.");
  if (f.origem && !origemPorId(f.origem)) nota("A origem salva não existe mais. Escolha a origem de novo na ficha.");

  const pericias = unicos(f.pericias.filter((p) => PERICIAS.some((x) => x.id === p)));
  if (pericias.length !== f.pericias.length) { nota("Perícias repetidas ou que não existem foram retiradas."); f.pericias = pericias; }

  const saves = unicos(f.saveExtra.filter((a) => ATR_IDS.includes(a)));
  if (saves.length !== f.saveExtra.length) { f.saveExtra = saves; nota("Salvaguarda extra inválida retirada."); }

  const tal = unicos(f.talentos);
  if (tal.length !== f.talentos.length) { f.talentos = tal; nota("Talentos repetidos foram retirados."); }

  const kidos = unicos(f.kidos.filter((k) => kidosValidos.has(`${k.tipo}:${k.n}`)), (k) => `${k.tipo}:${k.n}`);
  if (kidos.length !== f.kidos.length) { f.kidos = kidos; nota("Kidō repetidos ou que não existem foram retirados."); }

  const tec = unicos(f.tecnicasReishi.filter((t) => tecnicasValidas.has(t)));
  if (tec.length !== f.tecnicasReishi.length) { f.tecnicasReishi = tec; nota("Técnicas de Reishi repetidas ou que não existem foram retiradas."); }

  const ess = unicos(f.essencias, (e) => e.id);
  if (ess.length !== f.essencias.length) { f.essencias = ess; nota("Essências repetidas foram retiradas."); }

  if (f.schrift && (!SCHRIFTS.some((s) => s.id === f.schrift) || !["schutze", "ritter"].includes(f.classe))) {
    f.schrift = "";
    nota("A Schrift salva não é válida para esta ficha e foi limpa. Escolha de novo na aba de poderes.");
  }

  if (!["", "plena", "verdadeira"].includes(f.treinos.caminhoBankai)) { f.treinos.caminhoBankai = ""; nota("O caminho da Bankai estava inválido e foi limpo."); }
  if (!Array.isArray(f.treinos.feitos)) f.treinos.feitos = [];
  f.treinos.pf = inteiro(f.treinos.pf, 0, 999, 0);
  f.treinos.geralDias = inteiro(f.treinos.geralDias, 0, 9999, 0);

  if (!LIBERACOES.includes(f.estado.liberado)) { f.estado.liberado = ""; nota("A liberação ativa era inválida e foi desligada."); }
  const cond = unicos(f.estado.condicoes);
  if (cond.length !== f.estado.condicoes.length) f.estado.condicoes = cond;
  f.estado.ativas = unicos(f.estado.ativas);
  f.estado.pvTemp = inteiro(f.estado.pvTemp, 0, 9999, 0);
  f.estado.curtosUsados = inteiro(f.estado.curtosUsados, 0, 2, 0);

  // PV e PR atuais dentro dos limites
  const c = calcular(f);
  const pv = inteiro(f.pvAtual, 0, c.pv, c.pv);
  const pr = inteiro(f.prAtual, 0, c.pr, c.pr);
  if (pv !== f.pvAtual) { nota(`PV atual ajustado para ${pv} (máximo ${c.pv}).`); f.pvAtual = pv; }
  if (pr !== f.prAtual) { nota(`PR atual ajustado para ${pr} (máximo ${c.pr}).`); f.prAtual = pr; }

  return { ficha: f, mudancas: m };
}

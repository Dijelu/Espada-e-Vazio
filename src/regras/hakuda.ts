/* Técnicas de Hakuda (cap. 11): lista, quantas a ficha conhece e o dano calculado de cada uma. */
import type { Calculo, Ficha } from "./ficha";
import progressao from "./progressao.json";

export type RequisitoHakuda = "Ação" | "Ação Bônus" | "Combo" | "Reação";

export interface TecnicaHakuda {
  nome: string;
  req: RequisitoHakuda;
  /** a técnica usa jogada de acerto (senão, só salvaguarda ou efeito automático) */
  acerto: boolean;
  alcance: string;
  pr: number;
  /** PR a mais para a versão reforçada, quando o texto prevê */
  prExtra?: { pr: number; texto: string };
  /** resumo do efeito, sem o dano */
  efeito: string;
  /** salvaguarda do alvo, quando houver */
  salva?: string;
  tipo: string;
  /** como o dano é montado (veja danoDaTecnica) */
  dano: { fixo?: string; prof?: number; faces?: number; soma?: "des" | "arma" | "mod" | "nenhuma"; forca?: boolean; vezes?: "prof" | 3 };
}

const U = "arma" as const;

export const TECNICAS_HAKUDA: TecnicaHakuda[] = [
  { nome: "Bukkomi Dogeza", req: "Ação Bônus", acerto: false, alcance: "Pessoal", pr: 5, tipo: "Concussão", efeito: "Se estiver se deslocando, desliza e ganha 6 m de deslocamento. Se atacar logo depois, o próximo ataque desarmado causa +1d8.", dano: { fixo: "1d8", soma: "nenhuma" } },
  { nome: "Chikangoroshi Savate", req: "Combo", acerto: true, alcance: "Corpo a corpo", pr: 10, tipo: "Concussão", efeito: "Gira o corpo e chuta o alvo.", dano: { fixo: "1d12", soma: U } },
  { nome: "DROP KICK", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 12, tipo: "Concussão", salva: "Constituição", efeito: "Se o alvo falhar na salvaguarda, o próximo ataque dele é com desvantagem.", dano: { prof: 1, faces: 10, soma: U } },
  { nome: "Force punch", req: "Combo", acerto: true, alcance: "Corpo a corpo", pr: 10, tipo: "Concussão", efeito: "Alvo Grande ou menor é empurrado 1,5 m.", dano: { fixo: "1d10", soma: U } },
  { nome: "Force Kick", req: "Ação", acerto: false, alcance: "Linha de 6 m", pr: 8, tipo: "Concussão", salva: "Destreza", efeito: "Você avança 6 m em linha reta; o alvo mais próximo que falhar sofre o dano.", dano: { fixo: "4d6", soma: U } },
  { nome: "Gatling Mad-Stomping", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 10, tipo: "Concussão", efeito: "Três ataques de 1d4. Se acertar os três, o alvo é empurrado 6 m (+2d4 se bater em superfície sólida).", dano: { fixo: "1d4", soma: U, vezes: 3 } },
  { nome: "IKKOTSU", req: "Reação", acerto: true, alcance: "Corpo a corpo", pr: 15, prExtra: { pr: 25, texto: "versão segura: se errar, não fica indefeso" }, tipo: "Concussão", efeito: "Sem a Zanpakutō em punho, ataca quem avança contra você: o ataque dele falha e ele é empurrado 6 m. Se você errar, fica indefeso e ele ataca com vantagem.", dano: { fixo: "1d10", soma: U } },
  { nome: "Kagamibiraki", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 20, tipo: "Perfurante", salva: "Constituição (teste de Força resistido)", efeito: "Teste de Força contra Constituição: se o alvo falhar, arranca o membro; dano não pode ser reduzido.", dano: { forca: true, faces: 12, soma: "nenhuma" } },
  { nome: "Kazaguruma", req: "Combo", acerto: true, alcance: "Corpo a corpo", pr: 8, tipo: "Concussão", salva: "Força", efeito: "Sem dano: empurra o alvo 12 m. Se bater em estrutura maior que ele, sofre 2d8.", dano: { fixo: "2d8", soma: "nenhuma" } },
  { nome: "Oni Dekopin", req: "Ação", acerto: true, alcance: "Linha de 12 m", pr: 7, prExtra: { pr: 12, texto: "+5 PR: o alvo é arremessado 4,5 m se falhar em Força" }, tipo: "Concussão", efeito: "Projétil de ar comprimido com reiatsu.", dano: { prof: 1, faces: 10, soma: "nenhuma" } },
  { nome: "Panty-Flash Tornado", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 12, tipo: "Concussão", efeito: "Um chute por ponto de proficiência, cada um com seu acerto; se errar um, a sequência para.", dano: { fixo: "2d12", soma: U, vezes: "prof" } },
  { nome: "Raioken", req: "Ação", acerto: true, alcance: "Cone de 3 m", pr: 12, prExtra: { pr: 18, texto: "+6 PR e ação bônus: +metade da proficiência em d8" }, tipo: "Concussão", efeito: "Um acerto só para todas as criaturas do cone.", dano: { prof: 1, faces: 8, soma: U } },
  { nome: "Sandbag Beat", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 8, tipo: "Concussão", salva: "Constituição", efeito: "Se falhar, o alvo perde 6 m de deslocamento por dois turnos.", dano: { prof: 1, faces: 10, soma: "nenhuma" } },
  { nome: "Sokotsu", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 12, tipo: "Concussão", salva: "Constituição", efeito: "Se falhar, a CD de resistência do alvo cai 5 até o início do próximo turno dele.", dano: { prof: 1, faces: 12, soma: U } },
  { nome: "Super Kick", req: "Combo", acerto: true, alcance: "Corpo a corpo", pr: 12, tipo: "Concussão", efeito: "Alvo Grande ou menor sobe 1,5 m; seu próximo ataque no turno contra ele tem vantagem no acerto e no dano.", dano: { fixo: "1d10", soma: U } },
  { nome: "Taketonbo", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 15, tipo: "Concussão", salva: "Espírito", efeito: "O alvo cai. Se for de nível menor que o seu, a falha o deixa Distorcido e Esgotado até o fim do próximo turno dele.", dano: { prof: 1, faces: 6, soma: U } },
  { nome: "Takigoi", req: "Reação", acerto: false, alcance: "Corpo a corpo", pr: 20, tipo: "Concussão", efeito: "Quando for atacado desarmado: Preparo Físico contra o acerto dele. Se passar, o ataque é cancelado e você faz um ataque desarmado.", dano: { fixo: "", soma: U } },
  { nome: "TESSHO", req: "Combo", acerto: true, alcance: "Corpo a corpo", pr: 10, tipo: "Concussão", efeito: "Golpe forte com a mão aberta.", dano: { fixo: "1d12", soma: U } },
  { nome: "Tsukiyubi", req: "Ação", acerto: true, alcance: "Corpo a corpo", pr: 15, tipo: "Energia", efeito: "Disparo de energia: o alvo é arremessado 6 m.", dano: { prof: 1, faces: 6, soma: "mod" } },
  { nome: "Tsurigaki", req: "Reação", acerto: false, alcance: "Corpo a corpo", pr: 15, tipo: "Concussão", efeito: "Quando uma criatura errar um ataque desarmado contra você, faça um ataque desarmado.", dano: { fixo: "", soma: U } },
];

export const nomesHakuda = new Set(TECNICAS_HAKUDA.map((t) => t.nome));

const tem = (f: Ficha, id: string) => f.talentos.some((t) => t === id || t.endsWith("/" + id));
const qtd = (f: Ficha, id: string) => f.talentos.filter((t) => t === id || t.endsWith("/" + id)).length;

/** Quantas Técnicas de Hakuda a ficha conhece: 3 no 3º nível do Hakuda, +3 no 12º, +2 por Versatilidade Marcial e +2 por Marcial. */
export function limiteTecnicasHakuda(f: Ficha): number {
  const hk = f.classe === "hakuda";
  return (hk && f.nivel >= 3 ? 3 : 0) + (hk && f.nivel >= 12 ? 3 : 0) + (tem(f, "versatilidade-marcial") ? 2 : 0) + 2 * qtd(f, "marcial");
}

export const mestreDoPunho = (f: Ficha) => f.essencias.filter((e) => e.nome === "Mestre do Punho").length;

const PASSOS = ["1d6", "1d8", "1d10", "1d12", "2d6", "2d8", "2d10", "3d10", "4d10", "4d12", "5d10"];

/** Dado do dano desarmado: tabela do Hakuda, ou 1d6 do Perito em Hakuda, mais os passos da essência Mestre do Punho. */
export function dadoDesarmado(f: Ficha): string {
  let base = "";
  let passos = mestreDoPunho(f);
  if (f.classe === "hakuda") {
    const linha = (progressao as Record<string, Record<string, { caract: string }>>).hakuda[String(Math.min(20, Math.max(1, f.nivel)))];
    base = linha?.caract.match(/^\d+d\d+/)?.[0] ?? "1d6";
  } else if (tem(f, "perito-em-hakuda")) {
    base = "1d6";
    passos += Math.max(0, qtd(f, "perito-em-hakuda") - 1);
  } else if (passos > 0) { base = "1d6"; passos -= 1; }
  if (!base) return "";
  const i = Math.max(0, PASSOS.indexOf(base));
  return PASSOS[Math.min(PASSOS.length - 1, i + passos)];
}

/** Atributo do dano desarmado: Destreza ou Força, o maior, para quem treina Hakuda; Força para os demais. */
export function modDesarmado(f: Ficha, c: Calculo): number {
  const marcial = f.classe === "hakuda" || tem(f, "perito-em-hakuda") || mestreDoPunho(f) > 0;
  return marcial ? Math.max(c.atr.for, c.atr.des) : c.atr.for;
}

export const acertoHakuda = (f: Ficha, c: Calculo) => c.prof + modDesarmado(f, c);
export const cdHakuda = (f: Ficha, c: Calculo) => 8 + c.prof + modDesarmado(f, c);

const sinal = (n: number) => (n < 0 ? `${n}` : `+${n}`);

const ligada = (f: Ficha, id: string) => (f.estado.ativas ?? []).includes(`sit:${id}`);
const bankaiAtiva = (f: Ficha) => f.estado.liberado === "bankai" || f.estado.liberado === "bankai2";

/** Intercalar (Caminho do Guerreiro, 6º): a técnica Combo sai por metade do PR e com +1 dado. */
export const intercalarAtivo = (f: Ficha, t: TecnicaHakuda) => f.classe === "hakuda" && t.req === "Combo" && ligada(f, "intercalar");
/** Lâmina e Punho (Caminho do Guerreiro, 20º): com a Bankai ativa, as Técnicas de Hakuda custam metade. */
export const laminaEPunhoAtivo = (f: Ficha) => f.classe === "hakuda" && ligada(f, "lamina-e-punho") && bankaiAtiva(f);
/** Impacto Ininterrupto (Caminho do Guerreiro, 15º): ao acertar corpo a corpo, uma técnica de Ação sai como reação. */
export const impactoAtivo = (f: Ficha, t: TecnicaHakuda) => f.classe === "hakuda" && t.req === "Ação" && ligada(f, "impacto-ininterrupto");

/** PR da técnica. Metade com Intercalar (Combo) ou Lâmina e Punho (as duas não se somam); depois, o Combo custa 1 a menos com Mestre do Punho. Nunca menos de 1. */
export function custoHakuda(t: TecnicaHakuda, f: Ficha): number {
  let pr = t.pr;
  if (intercalarAtivo(f, t) || laminaEPunhoAtivo(f)) pr = Math.ceil(pr / 2);
  if (t.req === "Combo" && mestreDoPunho(f) > 0) pr -= 1;
  return Math.max(1, pr);
}

/** Dano de uma técnica já com tudo somado. */
export function danoHakuda(t: TecnicaHakuda, f: Ficha, c: Calculo): string {
  const d = t.dano;
  const mod = modDesarmado(f, c);
  const dado = dadoDesarmado(f);
  const mais = intercalarAtivo(f, t) ? 1 : 0; // Intercalar: +1 dado de dano
  let base = d.fixo ?? "";
  if (d.prof) base = `${c.prof * d.prof + mais}d${d.faces}`;
  else if (d.forca) base = `${Math.max(1, c.atr.for) + mais}d${d.faces}`;
  else if (mais && base) base = base.replace(/^(\d+)d(\d+)/, (_m, n, s) => `${Number(n) + 1}d${s}`);
  const partes = [base];
  if (d.soma === "arma") partes.push(dado ? `${dado}${mod ? sinal(mod) : ""}` : mod ? `${mod}` : "");
  else if (d.soma === "mod" && mod) partes.push(`${mod}`);
  return partes.filter(Boolean).join("+").replace(/\+-/g, "-");
}

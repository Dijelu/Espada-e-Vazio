/* Hōgyoku: artefato opcional do Mestre (livro, cap. 15, "O Hōgyoku"). Aqui ficam só as contas e os limites. */
import { classePorId, type Ficha, type TipoForma } from "./ficha";

export type EstagioHogyoku = 0 | 1 | 2 | 3;

export interface Hogyoku {
  /** 0 = sem Hōgyoku; 1 Desperto, 2 Responsivo, 3 Fundido (decidido pelo Mestre) */
  estagio: EstagioHogyoku;
  /** pontos de Desequilíbrio (0 a 10) */
  desequilibrio: number;
  /** Crisálidas já vividas (0 a 3); cada uma soma 3 PP na forma */
  crisalidas: number;
  /** a Crisálida do arco atual já foi gasta (só um botão manual "novo arco" libera) */
  crisalidaUsada: boolean;
}

export const HOGYOKU_PADRAO: Hogyoku = { estagio: 0, desequilibrio: 0, crisalidas: 0, crisalidaUsada: false };
export const HOGYOKU_NIVEL_MIN = 10;
export const HOGYOKU_DESEQ_MAX = 10;
/** Mesmo limite de forma lendária (cap. 5) */
export const HOGYOKU_PP_MAX = 12;

/** Nível mínimo do portador para cada estágio (tabela de Estágios do livro) */
export const NIVEL_ESTAGIO: Record<1 | 2 | 3, number> = { 1: 10, 2: 13, 3: 17 };
export const NOME_ESTAGIO: Record<1 | 2 | 3, string> = { 1: "Desperto", 2: "Responsivo", 3: "Fundido" };

/** Chaves de `estado.usos` (voltam no descanso longo, que zera os usos) */
export const USO_DESEJO_MENOR = "hogyoku-desejo-menor";
export const USO_DESEJO_MAIOR = "hogyoku-desejo-maior";
export const USO_FRONTEIRA = "hogyoku-fronteira";

const inteiro = (v: unknown, min: number, max: number, padrao: number) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  return Math.min(max, Math.max(min, Number.isFinite(n) ? Math.round(n) : padrao));
};

/** Lê o que veio salvo (ficha antiga sem o campo, ou com valores fora do padrão) e devolve algo válido. */
export function normalizarHogyoku(v: unknown): Hogyoku {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  return {
    estagio: inteiro(o.estagio, 0, 3, 0) as EstagioHogyoku,
    desequilibrio: inteiro(o.desequilibrio, 0, HOGYOKU_DESEQ_MAX, 0),
    crisalidas: inteiro(o.crisalidas, 0, 3, 0),
    crisalidaUsada: o.crisalidaUsada === true,
  };
}

/** Estágio que vale de verdade: abaixo do nível 10 o Hōgyoku é uma pedra muda, e cada estágio tem o seu nível mínimo. */
export function estagioEfetivo(f: Pick<Ficha, "nivel"> & { hogyoku?: Hogyoku }): EstagioHogyoku {
  const e = f.hogyoku?.estagio ?? 0;
  if (e < 1 || f.nivel < HOGYOKU_NIVEL_MIN) return 0;
  const porNivel: EstagioHogyoku = f.nivel >= NIVEL_ESTAGIO[3] ? 3 : f.nivel >= NIVEL_ESTAGIO[2] ? 2 : 1;
  return Math.min(e, porNivel) as EstagioHogyoku;
}

export const cdHogyoku = (estagio: number, prof: number, esp: number) => (estagio >= 1 ? 8 + prof + esp + 2 * estagio : 0);
export const regeneracaoHogyoku = (estagio: number, prof: number) => (estagio >= 3 ? 3 * prof : estagio >= 2 ? 2 * prof : 0);
/** PP extras da forma mais forte: 6 ao fundir (estágio 3) + 3 por Crisálida, no máximo 12 */
export const ppExtraHogyoku = (estagio: number, crisalidas: number) => (estagio >= 3 ? Math.min(HOGYOKU_PP_MAX, 6 + 3 * Math.max(0, Math.min(3, Math.floor(crisalidas)))) : 0);

export interface CalculoHogyoku {
  /** o Hōgyoku está valendo (estágio 1 ou mais e nível 10 ou mais) */
  ativo: boolean;
  /** estágio efetivo (limitado pelo nível) */
  estagio: EstagioHogyoku;
  cd: number;
  /** PV por início de turno */
  regen: number;
  /** PP extras na forma mais forte */
  ppExtra: number;
  /** Visored com Hōgyoku: máscara dura +2 turnos e não deixa Esgotado */
  estabiliza: boolean;
}

export function calcularHogyoku(f: Ficha, prof: number, esp: number): CalculoHogyoku {
  const h = f.hogyoku ?? HOGYOKU_PADRAO;
  const est = estagioEfetivo(f);
  return {
    ativo: est >= 1,
    estagio: est,
    cd: cdHogyoku(est, prof, esp),
    regen: regeneracaoHogyoku(est, prof),
    ppExtra: ppExtraHogyoku(est, h.crisalidas),
    estabiliza: est >= 1 && f.origem === "visored",
  };
}

/** Qual é a forma mais forte do portador (a que recebe o Poder da Forma). */
export function formaMaisForte(f: Ficha): TipoForma | null {
  const tipo = classePorId(f.classe)?.tipo;
  const tem = (t: TipoForma) => { const x = f.formas?.[t]; return !!x && (!!x.nome?.trim() || (x.efeitos?.length ?? 0) > 0); };
  if (tipo === "shinigami") return f.treinos?.caminhoBankai === "verdadeira" && tem("bankai2") ? "bankai2" : "bankai";
  if (tipo === "hollow") return tem("segunda") ? "segunda" : "resurreccion";
  if (tipo === "quincy") return "vollstandig";
  return null;
}

/** PP extras do Hōgyoku para a forma pedida (0 se não for a mais forte ou se o estágio 3 não vale). */
export function ppExtraDaForma(f: Ficha, tipo: TipoForma): number {
  const est = estagioEfetivo(f);
  if (est < 3) return 0;
  return formaMaisForte(f) === tipo ? ppExtraHogyoku(est, f.hogyoku?.crisalidas ?? 0) : 0;
}

/** Duração da máscara com o Hōgyoku estabilizando o Hollow (+2 turnos). */
export const mascaraMaxEfetivo = (f: Ficha, base: number) => base + (calcularHogyoku(f, 0, 0).estabiliza ? 2 : 0);
/** Quando o tempo da máscara acaba: com o Hōgyoku só entra em recarga; sem ele a pessoa fica Esgotada. */
export const fimDaMascaraEsgota = (f: Ficha) => !calcularHogyoku(f, 0, 0).estabiliza;

/** Soma Desequilíbrio dentro de 0 a 10. */
export const somarDesequilibrio = (h: Hogyoku, n: number): Hogyoku => ({ ...h, desequilibrio: Math.min(HOGYOKU_DESEQ_MAX, Math.max(0, h.desequilibrio + n)) });

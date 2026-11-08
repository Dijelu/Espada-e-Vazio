/* Versão do sistema da ficha.
   Cada ficha guarda `versaoSistema` (número inteiro) dentro dos próprios dados. Ficha sem esse campo é a versão 0 (as antigas).
   Ficha antiga abre funcionando como antes e só muda quando o dono toca em "Atualizar ficha".
   Para lançar uma versão nova: some 1 em VERSAO_SISTEMA_ATUAL e ponha a entrada nova no fim do HISTORICO_VERSOES (em português simples). */

import type { Ficha } from "./ficha";

export interface VersaoDoSistema {
  versao: number;
  /** dia em que a versão entrou (AAAA-MM-DD) */
  data: string;
  titulo: string;
  /** o que mudou, uma frase curta por item */
  itens: string[];
}

export const HISTORICO_VERSOES: VersaoDoSistema[] = [
  {
    versao: 1,
    data: "2026-11-08",
    titulo: "Cartões, vagas e forma da arma",
    itens: [
      "A montagem da forma agora tem quatro tipos de cartão: ação, característica, técnica especial e interação especial, com vagas por forma.",
      "Os efeitos leve, médio e forte ficam na aba Características.",
      "O PR das ações novas é fixo por ritmo: ação 12, ação bônus 5 e reação 6.",
      "Cada forma tem uma arma (golpe básico) e características da arma, que liberam ou travam cartões.",
      "A técnica final virou uma seção própria na montagem.",
      "Técnicas especiais e interações especiais não custam PP: só ocupam vagas.",
      "O golpe de dano maior agora se chama “Golpe reforçado”.",
      "O teto de dano não aparece mais na tela.",
    ],
  },
];

export const VERSAO_SISTEMA_ATUAL = HISTORICO_VERSOES[HISTORICO_VERSOES.length - 1].versao;

/** Versão da ficha: sem o campo, ou com valor que não é inteiro, é a 0. */
export function versaoDaFicha(f: { versaoSistema?: unknown } | null | undefined): number {
  const v = f?.versaoSistema;
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : 0;
}

export const fichaDesatualizada = (f: { versaoSistema?: unknown } | null | undefined) => versaoDaFicha(f) < VERSAO_SISTEMA_ATUAL;

/** As versões que a ficha ainda não tem, da mais antiga para a mais nova. */
export const versoesDesde = (versao: number): VersaoDoSistema[] => HISTORICO_VERSOES.filter((h) => h.versao > versao);

/** Lista corrida do que mudou desde a versão da ficha. */
export const mudancasDesde = (versao: number): string[] => versoesDesde(versao).flatMap((h) => h.itens);

/** Texto do selo do Mestre. */
export const textoSelo = (f: { versaoSistema?: unknown }) => `desatualizada · v${versaoDaFicha(f)}`;

export const contarDesatualizadas = (lista: { ficha: { versaoSistema?: unknown } }[]) => lista.filter((x) => fichaDesatualizada(x.ficha)).length;

/* ---------- desfazer a atualização ---------- */

/** Por quantos dias o "Desfazer atualização" fica à disposição. */
export const DIAS_PARA_DESFAZER = 7;

/** Texto com as chaves em ordem: o banco (jsonb) reordena as chaves, então a assinatura não pode depender da ordem. */
function textoOrdenado(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(textoOrdenado).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v as object).sort().filter((k) => (v as Record<string, unknown>)[k] !== undefined).map((k) => `${JSON.stringify(k)}:${textoOrdenado((v as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

/** Assinatura curta das formas (para saber se houve edição grande depois da atualização). */
export function marcaDasFormas(formas: Ficha["formas"] | undefined): string {
  const t = textoOrdenado(formas ?? {});
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return `${t.length.toString(36)}-${(h >>> 0).toString(36)}`;
}

/** Dá para desfazer? Só com a cópia guardada, dentro do prazo e enquanto as formas estão como logo depois de atualizar. */
export function podeDesfazer(f: Pick<Ficha, "atualizacao" | "anteriorAtualizacao" | "formas">, agora: number = Date.now()): boolean {
  const a = f.atualizacao;
  const b = f.anteriorAtualizacao;
  if (!a || !b) return false;
  const em = Date.parse(a.em);
  if (!Number.isFinite(em) || agora - em > DIAS_PARA_DESFAZER * 86400000 || agora < em - 86400000) return false;
  return marcaDasFormas(f.formas) === a.marca;
}

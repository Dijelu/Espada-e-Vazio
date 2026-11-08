import { SHIKAIS_MONTADAS } from "./modelos-shikai";

/** Deixa o id comparável: o livro e os modelos montados escrevem alguns nomes de jeitos diferentes (ryuujin/ryujin, benehime/benihime). */
const norm = (id: string) => id.toLowerCase().replace(/[^a-z]/g, "").replace(/uu/g, "u").replace(/benehime/g, "benihime");

export interface ExigeShikai { id: string; nome: string }

/**
 * Qual Shikai o personagem precisa ter para usar um modelo de Bankai.
 * Para os modelos montados, vale a Shikai montada que aponta para essa Bankai.
 * Para as Bankais do livro, vale a Shikai montada de mesmo id (se não existir, a Bankai fica livre).
 * Devolve null quando o modelo não tem Shikai correspondente definida (fica livre).
 */
export function shikaiExigida(idBankai: string, nomeLivro?: string): ExigeShikai | null {
  const m = SHIKAIS_MONTADAS.find((s) => s.bankaiRelacionada === idBankai);
  if (m) return { id: m.id, nome: m.nome };
  if (!nomeLivro) return null;
  const par = SHIKAIS_MONTADAS.find((s) => norm(s.id) === norm(idBankai));
  return par ? { id: par.id, nome: par.nome } : null;
}

/** A Shikai escolhida pelo personagem é a que o modelo exige? */
export function temAShikai(modeloShikaiDoPersonagem: string | undefined, exigida: ExigeShikai | null): boolean {
  if (!exigida) return true;
  return !!modeloShikaiDoPersonagem && norm(modeloShikaiDoPersonagem) === norm(exigida.id);
}

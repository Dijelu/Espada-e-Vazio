import dados from "./essencias.json";

export type GrupoEssencia = "todas" | "shinigami" | "quincy" | "hollow" | "proibida";

export interface EssenciaLivro {
  nome: string;
  grupo: GrupoEssencia;
  repetivel: boolean;
  texto: string;
  etapas: string[];
  nota: string;
}

export const ESSENCIAS: EssenciaLivro[] = dados as EssenciaLivro[];

export const ROTULO_GRUPO: Record<GrupoEssencia, string> = {
  todas: "Todas as classes",
  shinigami: "Shinigami",
  quincy: "Quincy",
  hollow: "Hollow",
  proibida: "Proibidas",
};

/** Grupos que a classe pode escolher livremente (Proibidas só por decisão do Mestre, mas ficam visíveis). */
export function gruposDaClasse(tipo?: string): GrupoEssencia[] {
  if (tipo === "shinigami") return ["todas", "shinigami", "proibida"];
  if (tipo === "quincy") return ["todas", "quincy", "proibida"];
  if (tipo === "hollow") return ["hollow", "proibida"];
  return ["todas", "shinigami", "quincy", "hollow", "proibida"];
}

export function essenciaPorNome(nome: string): EssenciaLivro | undefined {
  const n = nome.trim().toLowerCase();
  return ESSENCIAS.find((e) => e.nome.toLowerCase() === n);
}

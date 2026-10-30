/* Ataques próprios de cada classe, com dano calculado pela ficha: Técnicas de Reishi dos Quincys e o Cero do Hueco. */
import { TECNICAS_REISHI } from "./catalogo";
import { danoSchrift, schriftDaFicha, estagioSchrift, CUSTO_SCHRIFT } from "./schrifts";
import type { Calculo, Ficha } from "./ficha";

/** Bônus de acerto do ataque da classe. */
export function acertoClasse(f: Ficha, c: Calculo): number {
  if (f.classe === "schutze") return Math.floor(c.prof * 1.5);
  return c.prof + c.atr.esp;
}

export interface DanoClasse {
  nome: string;
  /** de onde vem: "Técnica de Reishi", "Classe"… */
  fonte: string;
  dano: string;
  tipo: string;
  custo?: string;
  nota?: string;
  /** o ataque usa jogada de acerto (senão, o alvo faz salvaguarda) */
  acerto?: boolean;
}

/** Atributo-chave das Técnicas de Reishi: Mente para o Schütze, Espírito para o Ritter. */
export const atrChaveTecnica = (classe: string) => (classe === "schutze" ? "men" : "esp");

/** Dados do Cero do Hueco: começa mais baixo nos três primeiros níveis, depois segue nível + 8. */
export const dadosCero = (n: number) => (n <= 3 ? [5, 7, 9][Math.max(0, n - 1)] : n + 8);

/** Dados extras do Cero do Caminho Estallido: +4 no 3º nível, +proficiência no 10º e +3 no 20º. */
export function dadosCaminhoCero(f: Ficha, prof: number): number {
  if (f.classe !== "hueco") return 0;
  // Vasto Lorde na Resurrección ou na Segunda Etapa: o Cero ganha +proficiência dados
  const vasto = f.origem === "vasto-lorde" && (f.estado.liberado === "resurreccion" || f.estado.liberado === "terror") ? prof : 0;
  if (f.subclasse !== "Estallido") return vasto;
  return vasto + (f.nivel >= 3 ? 4 : 0) + (f.nivel >= 10 ? prof : 0) + (f.nivel >= 20 ? 3 : 0);
}

const TIPOS = /dano\s+(?:de\s+)?(Energia|Fogo|Frio|Elétrico|Perfurante|Cortante|Concussão|Psíquico)/i;

function lerTecnica(nome: string, texto: string, bonus: number, rotuloChave: string): DanoClasse | null {
  const m = texto.match(/(\d+d\d+)(\s*\+\s*seu atributo-chave[^.;,]*)?/i);
  if (!m) return null;
  const custo = texto.match(/Custo:\s*([^·.]*?PR(?:\s+para cada Gintou)?)/i)?.[1]?.trim();
  const tipo = texto.match(TIPOS)?.[1] ?? "Energia";
  const soma = m[2] ? `+${bonus}` : "";
  const salva = /teste de resist/i.test(texto);
  return { nome, fonte: "Técnica de Reishi", dano: `${m[1]}${soma}`, tipo, custo, acerto: !salva, nota: m[2] ? `inclui ${rotuloChave}` : salva ? "o alvo faz salvaguarda; metade em caso de sucesso, quando o texto disser" : undefined };
}

/** Lista os ataques da classe que a ficha pode rolar. */
export function danosDaClasse(f: Ficha, c: Calculo): DanoClasse[] {
  const out: DanoClasse[] = [];
  const quincy = f.classe === "schutze" || f.classe === "ritter";
  if (quincy) {
    const chave = atrChaveTecnica(f.classe);
    const bonus = c.atr[chave];
    const rotulo = chave === "men" ? "Mente" : "Espírito";
    if (f.classe === "schutze") out.push({ nome: "Técnica de Reishi base", fonte: "Classe", dano: `${2 + Math.floor(f.nivel / 5) + Math.floor((f.nivel * f.nivel) / 150)}d10+${c.atr.esp}`, tipo: "Energia", nota: `${2 + Math.floor(f.nivel / 5) + Math.floor((f.nivel * f.nivel) / 150)}d10 + Espírito (um dado a mais a cada 5 níveis). Acerto: ${Math.floor(c.prof * 1.5)} (1,5 × proficiência).`, acerto: true });
    for (const nome of f.tecnicasReishi) {
      const t = TECNICAS_REISHI.find((x) => x.nome === nome);
      const l = t?.texto ? lerTecnica(t.nome, t.texto, bonus, rotulo) : null;
      if (l) out.push(l);
    }
  }
  // Schrift de dano: poder de tema que cresce com o nível e fica completo com a Vollständig
  const sch = quincy ? schriftDaFicha(f) : undefined;
  if (sch?.dano) {
    const voll = f.estado.liberado === "vollstandig";
    const est = estagioSchrift(f.nivel, voll);
    out.push({ nome: `Schrift: ${sch.nome}`, fonte: "Schrift", dano: danoSchrift(c.prof, voll, f.nivel), tipo: sch.dano, custo: `${CUSTO_SCHRIFT} PR`, nota: `Schrift ${est.nome.toLowerCase()}, alcance ${est.alcance} m, ${est.usos} uso(s) por cena. ${sch.base}`, acerto: ["deathdealing", "compulsory", "glutton"].includes(sch.id) });
  }
  // Vollständig ativa: as Técnicas de Reishi ganham +proficiência d10 de dano de Energia
  if (quincy && f.estado.liberado === "vollstandig" && f.nivel >= (f.classe === "ritter" ? 12 : 13)) {
    for (const d of out) d.dano = `${d.dano}+${c.prof}d10`;
  }
  if (f.classe === "hueco") {
    const n = f.nivel;
    out.push({ nome: "Cero", fonte: "Classe", dano: `${dadosCero(n) + dadosCaminhoCero(f, c.prof)}d8+${c.atr.esp}`, tipo: "Energia", custo: "15 PR", nota: "Ação, à distância. Ignora o Hierro.", acerto: true });
  }
  return out;
}

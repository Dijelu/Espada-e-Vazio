/* Biblioteca de peças prontas para montar transformações. Cada peça gera efeitos automáticos na ficha. Os preços são de mesa (PP). */
import { ARMADOS, type Alvo, type Efeito } from "./efeitos-forma";
import type { Atr, TipoForma } from "./ficha";

export type Categoria = "Atributos" | "Ofensivo" | "Kidō" | "Defesa" | "Mobilidade" | "Recursos" | "Gatilhos" | "Pontos fracos";
export const CATEGORIAS: Categoria[] = ["Atributos", "Ofensivo", "Kidō", "Defesa", "Mobilidade", "Recursos", "Gatilhos", "Pontos fracos"];

export interface ParamPreset {
  atr?: Atr;
  tipo?: string;
  n?: number;
}

export interface Preset {
  id: string;
  nome: string;
  familias: TipoForma[];
  categoria: Categoria;
  texto: string;
  /** o que o jogador escolhe ao adicionar */
  param?: "atr" | "tipo" | "n";
  rotuloParam?: string;
  /** valor inicial do número (dados ou pontos) */
  nPadrao?: number;
  monta: (p: ParamPreset) => Efeito[];
  /** preço fixo; sem ele, a soma dos efeitos */
  pp?: number;
  /** só o Mestre libera: texto livre ou efeito fora da conta */
  aprovacao?: boolean;
  /** só pode entrar uma vez */
  unico?: boolean;
  /** Caminho do Hollow a que pertence */
  caminho?: string;
  /** só para a Bankai potencializadora */
  soPotencializadora?: boolean;
}

const SHIK: TipoForma[] = ["shikai"];
const BANK: TipoForma[] = ["bankai", "bankai2"];
const RES: TipoForma[] = ["resurreccion"];
const SEG: TipoForma[] = ["segunda"];

const A = (v: number, atr: Atr = "for"): Efeito => ({ k: "atr", atr, v });
const todos = (v: number): Efeito[] => (["for", "des", "con", "men", "esp"] as Atr[]).map((a) => A(v, a));

export const PRESETS: Preset[] = [
  /* ---------------- Shinigami: Shikai ---------------- */
  { id: "sk-fio", nome: "Lâmina Afiada", familias: SHIK, categoria: "Ofensivo", texto: "A margem de crítico dos seus golpes cai em 1 (anote no ataque: crítico 19).", monta: () => [{ k: "texto", t: "Seus golpes com a Zanpakutou acertam crítico com 19 ou 20." }], pp: 2, aprovacao: true },
  { id: "sk-elem", nome: "Fio Elemental", familias: SHIK, categoria: "Ofensivo", texto: "+1d6 de dano elemental nos golpes.", param: "tipo", rotuloParam: "Elemento", monta: (p) => [{ k: "dados", em: ["golpe"], n: 1, d: 6, tipo: p.tipo || "Elemental" }] },
  { id: "sk-kido", nome: "Kidō Canalizado", familias: SHIK, categoria: "Kidō", texto: "+1d8 nos Hadō e +1 na CD dos Kidōs.", monta: () => [{ k: "dados", em: ["hado"], n: 1, d: 8 }, { k: "cd", v: 1 }] },
  { id: "sk-alcance", nome: "Lâmina Estendida", familias: SHIK, categoria: "Ofensivo", texto: "+6 m de alcance nos golpes.", monta: () => [{ k: "alcance", em: ["golpe"], m: 6 }] },
  { id: "sk-peso", nome: "Lâmina Pesada", familias: SHIK, categoria: "Atributos", texto: "+1 em Força e +2 de dano nos golpes.", monta: () => [A(1, "for"), { k: "dano", em: ["golpe"], v: 2 }] },
  { id: "sk-leve", nome: "Corpo Leve", familias: SHIK, categoria: "Mobilidade", texto: "+1 em Destreza e +3 m de deslocamento.", monta: () => [A(1, "des"), { k: "desloc", modo: "chao", v: 3 }] },
  { id: "sk-gelo", nome: "Guarda Elemental", familias: SHIK, categoria: "Defesa", texto: "Redução de dano física 2 e resistência a um elemento.", param: "tipo", rotuloParam: "Elemento", monta: (p) => [{ k: "rd", tipo: "fis", v: 2 }, { k: "resist", dano: p.tipo || "Frio", grau: "resist" }], pp: 3 },
  { id: "sk-carmesim", nome: "Reiatsu Perfurante", familias: SHIK, categoria: "Ofensivo", texto: "Suas técnicas ignoram 5 de redução de dano.", monta: () => [{ k: "ignoraRd", em: ["tecnica"], v: 5 }] },
  { id: "sk-cura", nome: "Fluxo Restaurador", familias: SHIK, categoria: "Recursos", texto: "No início do seu turno recupera PV iguais à proficiência.", monta: () => [{ k: "gatilho", quando: "inicioTurno", faz: { curaPv: "[PROF]" }, rotulo: "Fluxo Restaurador" }], pp: 2 },
  { id: "sk-mente", nome: "Mente Afiada", familias: SHIK, categoria: "Defesa", texto: "Vantagem em salvaguardas de Mente.", monta: () => [{ k: "vant", em: "Salvaguardas de Mente" }] },
  { id: "sk-pf-inst", nome: "Liberação Instável", familias: SHIK, categoria: "Pontos fracos", texto: "Manter a Shikai custa 2 PR por turno (devolve pontos).", monta: () => [{ k: "custo", pr: 2 }] },

  /* ---------------- Shinigami: Bankai e Bankai Verdadeira ---------------- */
  { id: "bk-forca", nome: "Força Desperta", familias: BANK, categoria: "Atributos", texto: "Aumenta um atributo da sua escolha enquanto a forma estiver ativa. Vale para acerto, dano, CR e testes; não muda PV nem PR máximos.", param: "atr", rotuloParam: "Atributo", nPadrao: 2, monta: (p) => [A(p.n ?? 2, p.atr ?? "for")] },
  { id: "bk-fio", nome: "Fio da Bankai", familias: BANK, categoria: "Ofensivo", texto: "Dados extras de dano nos ataques armados: golpes, disparos e Hadō (kidōs entram sem custo extra).", param: "n", rotuloParam: "Dados (d8)", nPadrao: 1, monta: (p) => [{ k: "dados", em: ARMADOS, n: p.n ?? 1, d: 8 }] },
  { id: "bk-fio-golpe", nome: "Fio da Bankai (só golpes)", familias: BANK, categoria: "Ofensivo", texto: "Dados extras de dano só nos golpes corpo a corpo.", param: "n", rotuloParam: "Dados (d10)", nPadrao: 1, monta: (p) => [{ k: "dados", em: ["golpe"], n: p.n ?? 1, d: 10 }] },
  { id: "bk-negra", nome: "Reiatsu Negra", familias: BANK, categoria: "Ofensivo", texto: "+1d10 de dano de Energia nos golpes e nas técnicas da forma.", monta: () => [{ k: "dados", em: ["golpe", "tecnica"], n: 1, d: 10, tipo: "Energia" }], pp: 4 },
  { id: "bk-precisao", nome: "Precisão Letal", familias: BANK, categoria: "Ofensivo", texto: "+3 no acerto dos ataques armados.", monta: () => [{ k: "acerto", em: ARMADOS, v: 3 }] },
  { id: "bk-ferro", nome: "Corpo de Ferro", familias: BANK, categoria: "Defesa", texto: "Redução de dano 5 contra tudo.", monta: () => [{ k: "rd", tipo: "ambos", v: 5 }] },
  { id: "bk-elemento", nome: "Armadura Elemental", familias: BANK, categoria: "Defesa", texto: "Resistência a um elemento e redução de dano física 3.", param: "tipo", rotuloParam: "Elemento", monta: (p) => [{ k: "resist", dano: p.tipo || "Fogo", grau: "resist" }, { k: "rd", tipo: "fis", v: 3 }], pp: 3 },
  { id: "bk-veloz", nome: "Velocidade Divina", familias: BANK, categoria: "Mobilidade", texto: "+6 m de deslocamento e vantagem em iniciativa.", monta: () => [{ k: "desloc", modo: "chao", v: 6 }, { k: "vant", em: "Iniciativa" }], pp: 3 },
  { id: "bk-asas", nome: "Asas", familias: BANK, categoria: "Mobilidade", texto: "Voo de 9 m.", monta: () => [{ k: "desloc", modo: "voo", v: 9 }] },
  { id: "bk-gigante", nome: "Corpo Colossal", familias: BANK, categoria: "Atributos", texto: "+2 em Força, mas a CR contra ataques à distância cai (anote).", monta: () => [A(2, "for"), { k: "texto", t: "CR -2 contra ataques à distância." }], pp: 2, aprovacao: true },
  { id: "bk-mil", nome: "Mil Lâminas", familias: BANK, categoria: "Ofensivo", texto: "+2d8 nas técnicas da forma e +18 m de alcance nelas.", monta: () => [{ k: "dados", em: ["tecnica"], n: 2, d: 8 }, { k: "alcance", em: ["tecnica"], m: 18 }] },
  { id: "bk-kido", nome: "Kidō Supremo", familias: BANK, categoria: "Kidō", texto: "+2d8 nos Hadō e +2 na CD dos Kidōs.", monta: () => [{ k: "dados", em: ["hado"], n: 2, d: 8 }, { k: "cd", v: 2 }] },
  { id: "bk-duplo", nome: "Golpe Duplo", familias: BANK, categoria: "Ofensivo", texto: "+1 ataque na ação Atacar.", monta: () => [{ k: "acoes", tipo: "ataque" }] },
  { id: "bk-reacao", nome: "Reflexos Ampliados", familias: BANK, categoria: "Defesa", texto: "+1 reação por rodada.", monta: () => [{ k: "acoes", tipo: "reacao" }] },
  { id: "bk-explosao", nome: "Explosão da Liberação", familias: BANK, categoria: "Gatilhos", texto: "Ao liberar, quem estiver a 6 m sofre dano de Energia (salvaguarda de Destreza para metade).", monta: () => [{ k: "gatilho", quando: "liberar", faz: { dano: { expr: "[PROF]d10", tipo: "Energia", area: "6 m, salvaguarda de Destreza: metade" } }, rotulo: "Explosão da liberação" }], pp: 2 },
  { id: "bk-recompor", nome: "Recomposição", familias: BANK, categoria: "Recursos", texto: "Ao liberar, ganha PV temporários iguais a 5 × proficiência.", monta: () => [{ k: "gatilho", quando: "liberar", faz: { pvTemp: "[PROF]*5" }, rotulo: "Recomposição" }], pp: 3 },
  { id: "bk-chama", nome: "Aura Flamejante", familias: BANK, categoria: "Gatilhos", texto: "No início do seu turno, quem estiver a 3 m sofre dano de Fogo. Custa 4 PR por turno.", monta: () => [{ k: "gatilho", quando: "inicioTurno", faz: { dano: { expr: "[PROF]d6", tipo: "Fogo", area: "3 m" } }, rotulo: "Aura Flamejante" }, { k: "custo", pr: 4 }] },
  { id: "bk-pf-tempo", nome: "Fôlego Curto", familias: BANK, categoria: "Pontos fracos", texto: "A forma dura só a proficiência em turnos.", monta: () => [{ k: "duracao", turnos: "[PROF]" }] },
  { id: "bk-pf-corpo", nome: "Corpo no Limite", familias: BANK, categoria: "Pontos fracos", texto: "Ao terminar, você fica Esgotado até um descanso curto.", monta: () => [{ k: "fim", esgotado: "curto" }] },
  { id: "bv-final", nome: "Forma Final", familias: ["bankai2"], categoria: "Atributos", texto: "+1 em todos os atributos.", monta: () => todos(1), pp: 5 },
  { id: "bv-absoluta", nome: "Reiatsu Absoluta", familias: ["bankai2"], categoria: "Ofensivo", texto: "Seus golpes e técnicas ignoram 10 de redução de dano.", monta: () => [{ k: "ignoraRd", em: ["golpe", "tecnica"], v: 10 }] },

  /* ---------------- Hollow: Resurrección ---------------- */
  { id: "rs-hierro", nome: "Hierro Endurecido", familias: RES, categoria: "Defesa", texto: "Redução de dano física 5.", monta: () => [{ k: "rd", tipo: "fis", v: 5 }] },
  { id: "rs-regen", nome: "Regeneração Veloz", familias: RES, categoria: "Recursos", texto: "No início do seu turno recupera PV iguais à proficiência.", monta: () => [{ k: "gatilho", quando: "inicioTurno", faz: { curaPv: "[PROF]" }, rotulo: "Regeneração" }], pp: 2 },
  { id: "rs-garra", nome: "Garras Longas", familias: RES, categoria: "Ofensivo", texto: "+3 m de alcance nos golpes.", monta: () => [{ k: "alcance", em: ["golpe"], m: 3 }] },
  { id: "rs-forca", nome: "Corpo Bestial", familias: RES, categoria: "Atributos", texto: "Aumenta um atributo da sua escolha.", param: "atr", rotuloParam: "Atributo", nPadrao: 2, monta: (p) => [A(p.n ?? 2, p.atr ?? "for")] },
  { id: "rs-presa", nome: "Presa Dilacerante", familias: RES, categoria: "Ofensivo", texto: "Dados extras de dano nos golpes.", param: "n", rotuloParam: "Dados (d8)", nPadrao: 1, monta: (p) => [{ k: "dados", em: ["golpe"], n: p.n ?? 1, d: 8 }] },
  { id: "rs-pantera", nome: "Salto de Pantera", familias: RES, categoria: "Mobilidade", caminho: "Sonido", texto: "+6 m de deslocamento; Desengajar como ação livre uma vez por turno (livro).", monta: () => [{ k: "desloc", modo: "chao", v: 6 }, { k: "texto", t: "Uma vez por turno, Desengajar como ação livre." }], pp: 4, aprovacao: true },
  { id: "rs-gemelos", nome: "Sonido Gemelo", familias: RES, categoria: "Mobilidade", caminho: "Sonido", texto: "Reação: teleporta 9 m ao ser atacado.", monta: () => [{ k: "texto", t: "Reação: Sonido de 9 m ao ser alvo de ataque." }], pp: 2, aprovacao: true },
  { id: "rs-primeiro", nome: "Primeiro Sangue", familias: RES, categoria: "Ofensivo", caminho: "Sonido", texto: "Vantagem no primeiro ataque do combate.", monta: () => [{ k: "vant", em: "Primeiro ataque de cada combate" }] },
  { id: "rs-cero-denso", nome: "Cero Denso", familias: RES, categoria: "Ofensivo", caminho: "Estallido", texto: "+2d8 no Cero.", monta: () => [{ k: "dados", em: ["cero"], n: 2, d: 8, tipo: "Energia" }], pp: 4 },
  { id: "rs-mira", nome: "Olhos do Atirador", familias: RES, categoria: "Ofensivo", caminho: "Estallido", texto: "+12 m de alcance no Cero.", monta: () => [{ k: "alcance", em: ["cero"], m: 12 }] },
  { id: "rs-matilha", nome: "Cero em Matilha", familias: RES, categoria: "Ofensivo", caminho: "Estallido", texto: "O Cero pode ser dividido entre 2 alvos (livro).", monta: () => [{ k: "texto", t: "O Cero pode ser dividido entre até 2 alvos a até 6 m um do outro; cada um sofre metade do dano." }], pp: 1, aprovacao: true },
  { id: "rs-bracos", nome: "Braços Múltiplos", familias: RES, categoria: "Ofensivo", caminho: "Glotonería", texto: "+3 m de alcance corpo a corpo; agarra quem for atingido duas vezes.", monta: () => [{ k: "alcance", em: ["golpe"], m: 3 }, { k: "texto", t: "Acertar a mesma criatura duas vezes na ação a deixa agarrada (salvaguarda de Força)." }], pp: 3, aprovacao: true },
  { id: "rs-fome", nome: "Fome Insaciável", familias: RES, categoria: "Gatilhos", caminho: "Glotonería", texto: "Ao derrubar um inimigo, recupera PV.", monta: () => [{ k: "gatilho", quando: "abate", faz: { curaPv: "[PROF]*5" }, rotulo: "Fome Insaciável" }], pp: 2 },
  { id: "rs-carne", nome: "Carne Regenerante", familias: RES, categoria: "Recursos", caminho: "Glotonería", texto: "Ao liberar, ganha PV temporários.", monta: () => [{ k: "gatilho", quando: "liberar", faz: { pvTemp: "[PROF]*4" }, rotulo: "Carne Regenerante" }], pp: 2 },
  { id: "rs-asas", nome: "Asas Negras", familias: RES, categoria: "Mobilidade", caminho: "Ilusión", texto: "Voo de 9 m.", monta: () => [{ k: "desloc", modo: "voo", v: 9 }], pp: 3 },
  { id: "rs-escuro", nome: "Céu Escuro", familias: RES, categoria: "Defesa", caminho: "Ilusión", texto: "+1 na CD das técnicas e vantagem em salvaguardas de Mente.", monta: () => [{ k: "cd", v: 1 }, { k: "vant", em: "Salvaguardas de Mente" }] },
  { id: "rs-casulo", nome: "Casulo Venenoso", familias: RES, categoria: "Gatilhos", caminho: "Ponzoña", texto: "Quando um corpo a corpo acerta você, o atacante recebe 1 carga de Ponzoña (livro).", monta: () => [{ k: "gatilho", quando: "atingido", limite: "rodada", faz: { texto: "O atacante recebe 1 carga de Ponzoña." }, rotulo: "Casulo Venenoso" }], pp: 2 },
  { id: "rs-veneno", nome: "Veneno Concentrado", familias: RES, categoria: "Ofensivo", caminho: "Ponzoña", texto: "+1d10 de dano de veneno no Poder Inato.", monta: () => [{ k: "dados", em: ["inato"], n: 1, d: 10, tipo: "Veneno" }], pp: 3 },
  { id: "rs-veu", nome: "Véu de Reflexo", familias: RES, categoria: "Gatilhos", caminho: "Reflejo", texto: "Quando um ataque erra você, ganha PV temporários iguais à proficiência (1 por rodada).", monta: () => [{ k: "gatilho", quando: "errou", limite: "rodada", faz: { pvTemp: "[PROF]" }, rotulo: "Véu de Reflexo" }], pp: 2 },
  { id: "rs-estilhaco", nome: "Estilhaço", familias: RES, categoria: "Gatilhos", caminho: "Reflejo", texto: "Quando um ataque erra você, o atacante sofre dano de cristal (1 por rodada).", monta: () => [{ k: "gatilho", quando: "errou", limite: "rodada", faz: { dano: { expr: "1d8+[ESP]", tipo: "Cortante" } }, rotulo: "Estilhaço" }], pp: 2 },
  { id: "rs-pf-pelagem", nome: "Pelagem Rasgada", familias: RES, categoria: "Pontos fracos", texto: "CR -2 contra ataques à distância (anote).", monta: () => [{ k: "texto", t: "CR -2 contra ataques à distância." }], pp: -1, aprovacao: true },
  { id: "rs-pf-pesado", nome: "Corpo Pesado", familias: RES, categoria: "Pontos fracos", texto: "-3 m de deslocamento.", monta: () => [{ k: "desloc", modo: "chao", v: -3 }], pp: -1 },
  { id: "rs-pf-fome", nome: "Fome Crescente", familias: RES, categoria: "Pontos fracos", texto: "Manter a Resurrección custa 2 PR por turno.", monta: () => [{ k: "custo", pr: 2 }] },

  /* ---------------- Hollow: Segunda Etapa ---------------- */
  { id: "se-asas", nome: "Asas do Vasto Lorde", familias: SEG, categoria: "Mobilidade", texto: "Voo de 12 m.", monta: () => [{ k: "desloc", modo: "voo", v: 12 }] },
  { id: "se-oscuras", nome: "Cero Oscuras", familias: SEG, categoria: "Ofensivo", texto: "+2d8 no Cero e ignora 5 de redução de dano.", monta: () => [{ k: "dados", em: ["cero"], n: 2, d: 8, tipo: "Energia" }, { k: "ignoraRd", em: ["cero"], v: 5 }] },
  { id: "se-hierro", nome: "Hierro Supremo", familias: SEG, categoria: "Defesa", texto: "Redução de dano 5 contra tudo.", monta: () => [{ k: "rd", tipo: "ambos", v: 5 }] },
  { id: "se-instinto", nome: "Instinto Assassino", familias: SEG, categoria: "Defesa", texto: "+2 na CR.", monta: () => [{ k: "cr", v: 2 }] },
  { id: "se-regen", nome: "Regeneração Total", familias: SEG, categoria: "Recursos", texto: "No início do turno recupera 2 × proficiência em PV.", monta: () => [{ k: "gatilho", quando: "inicioTurno", faz: { curaPv: "[PROF]*2" }, rotulo: "Regeneração Total" }], pp: 4 },
  { id: "se-fome", nome: "Fome Total", familias: SEG, categoria: "Gatilhos", texto: "Ao derrubar um inimigo, recupera 10 × proficiência em PV.", monta: () => [{ k: "gatilho", quando: "abate", faz: { curaPv: "[PROF]*10" }, rotulo: "Fome Total" }], pp: 3 },
  { id: "se-terror", nome: "Presença do Terror", familias: SEG, categoria: "Gatilhos", texto: "Ao liberar, quem estiver a 9 m faz salvaguarda de Espírito ou fica Amedrontado.", monta: () => [{ k: "gatilho", quando: "liberar", faz: { texto: "Inimigos a 9 m: salvaguarda de Espírito ou ficam Amedrontados." }, rotulo: "Presença do Terror" }], pp: 2 },
  { id: "se-lanza", nome: "Lanza do Relâmpago", familias: SEG, categoria: "Ofensivo", texto: "+1d10 de dano elétrico nas técnicas e +18 m de alcance nelas.", monta: () => [{ k: "dados", em: ["tecnica"], n: 1, d: 10, tipo: "Elétrico" }, { k: "alcance", em: ["tecnica"], m: 18 }], pp: 5 },
  { id: "se-forca", nome: "Corpo Verdadeiro", familias: SEG, categoria: "Atributos", texto: "Aumenta um atributo da sua escolha.", param: "atr", rotuloParam: "Atributo", nPadrao: 2, monta: (p) => [A(p.n ?? 2, p.atr ?? "for")] },
];

export const presetPorId = (id: string) => PRESETS.find((p) => p.id === id);

export function presetsDaFamilia(tipo: TipoForma, opts: { potencializadora?: boolean } = {}): Preset[] {
  return PRESETS.filter((p) => p.familias.includes(tipo) && (!p.soPotencializadora || opts.potencializadora));
}

export const ALVOS_LIVRES: Alvo[] = ["golpe", "disparo", "hado", "bakudo", "tecnica", "reishi", "cero", "inato", "schrift"];

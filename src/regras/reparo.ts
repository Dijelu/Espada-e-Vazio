/* Conserta fichas antigas ou com dados fora do padrão. Só mexe no que é seguro e diz o que mudou. */
import kidosJson from "./kidos.json";
import tecnicasJson from "./tecnicas-reishi.json";
import { ATRIBUTOS, PERICIAS, calcular, classePorId, liberacaoValida, normalizar, origemPorId, type Atr, type Ficha } from "./ficha";
import { MASCARA_TETO, mascaraAtiva, podeMascara, tempMascara } from "./mascara";
import { calcularLiberacao } from "./liberacao-forma";
import { SCHRIFTS } from "./schrifts";
import { normalizarEfeitos } from "./efeitos-forma";
import { cartaoValido, marcaDoCartaoAntigo } from "./cartoes";

const LIBERACOES = ["", "shikai", "bankai", "bankai2", "resurreccion", "terror", "vollstandig", "mascara"];
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

  // "Atenção" do Vazio virou regra de mesa (introdução dos Talentos de Vazio, cap. 03): deixa de ocupar escolha
  if (f.talentos.includes("atencao") && f.classe === "vazio") { f.talentos = f.talentos.filter((t) => t !== "atencao"); nota("“Atenção” deixou de ser talento (agora é regra de mesa); a escolha ficou livre."); }
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

  // efeitos montados nas formas: tira o que não for válido
  for (const forma of Object.values(f.formas ?? {})) {
    if (!forma || forma.efeitos === undefined) continue;
    const antes = JSON.stringify(forma.efeitos);
    forma.efeitos = normalizarEfeitos(forma.efeitos);
    if (JSON.stringify(forma.efeitos) !== antes) nota(`Alguns efeitos da forma ${forma.nome || forma.tipo} estavam inválidos e foram ajustados.`);
  }
  // cartões de ação: os cartões automáticos de antes só ganham uma marca (dano, custo e texto ficam exatamente como estavam)
  for (const forma of Object.values(f.formas ?? {})) {
    if (!forma || !Array.isArray(forma.habilidades)) continue;
    let marcados = 0;
    forma.habilidades = forma.habilidades.map((h) => {
      let x = h;
      if (x.cartao !== undefined && !cartaoValido(x.cartao)) { const { cartao: _descartado, ...resto } = x; x = resto; }
      if (x.caracs !== undefined && !(Array.isArray(x.caracs) && x.caracs.every((c) => typeof c === "string"))) { const { caracs: _descartado, ...resto } = x; x = resto; }
      const marca = marcaDoCartaoAntigo(x);
      if (!marca) return x;
      marcados++;
      return { ...x, cartao: marca };
    });
    if (marcados > 0) nota(`Os cartões da forma ${forma.nome || forma.tipo} foram reorganizados nos novos tipos de ação; nada mudou nos números.`);
  }
  if (!["", "plena", "verdadeira"].includes(f.treinos.caminhoBankai)) { f.treinos.caminhoBankai = ""; nota("O caminho da Bankai estava inválido e foi limpo."); }
  // Bankai Plena: versões antigas gravavam o custo já pela metade e a liberação cobrava a metade de novo (1/4).
  // Agora a ficha guarda o custo cheio; se o custo salvo é exatamente a metade da conta das peças, volta ao cheio.
  const bk = f.formas.bankai;
  if (f.treinos.caminhoBankai === "plena" && bk && !bk.custoManual && (bk.efeitos?.length ?? 0) > 0) {
    try {
      const k = calcular({ ...f, estado: { ...f.estado, liberado: "" } });
      const base = { n: f.nivel, prof: k.prof, atr: k.atr };
      const ctx = { ...base, tipo: "bankai" as const };
      const cheio = calcularLiberacao("bankai", bk.efeitos ?? [], ctx).custoPr;
      const metade = calcularLiberacao("bankai", bk.efeitos ?? [], ctx, { metadeAntiga: true }).custoPr;
      if (cheio !== null && metade !== null && cheio !== metade && bk.custo === metade) {
        bk.custo = cheio;
        nota(`Custo da Bankai Plena corrigido para ${cheio} PR (você paga a metade, ${Math.ceil(cheio / 2)} PR, ao liberar).`);
      }
    } catch { /* conta impossível: deixa como está */ }
  }
  if (!Array.isArray(f.treinos.feitos)) f.treinos.feitos = [];
  if (f.treinos.mascara && !["conquistador", "predador", "equilibrio"].includes(f.treinos.mascara)) f.treinos.mascara = "";
  if (f.treinos.mascaraAparencia !== undefined && typeof f.treinos.mascaraAparencia !== "string") f.treinos.mascaraAparencia = "";
  if (f.treinos.mascaraFoto !== undefined && (typeof f.treinos.mascaraFoto !== "string" || !f.treinos.mascaraFoto.startsWith("data:image/") || f.treinos.mascaraFoto.length > 400000)) f.treinos.mascaraFoto = "";
  if (typeof f.treinos.mascaraMax === "number" && f.treinos.mascaraMax > MASCARA_TETO) nota(`A duração da Máscara Hollow (${f.treinos.mascaraMax} turnos) passava do máximo e foi ajustada para ${MASCARA_TETO}.`);
  if (f.treinos.mascaraMax !== undefined) f.treinos.mascaraMax = inteiro(f.treinos.mascaraMax, 0, MASCARA_TETO, 0);
  f.treinos.pf = inteiro(f.treinos.pf, 0, 999, 0);
  f.treinos.geralDias = inteiro(f.treinos.geralDias, 0, 9999, 0);

  if (!LIBERACOES.includes(f.estado.liberado)) { f.estado.liberado = ""; nota("A liberação ativa era inválida e foi desligada."); }
  else if (!liberacaoValida(f)) { f.estado.liberado = ""; nota("A liberação ativa não vale para a classe ou o nível desta ficha e foi desligada."); }
  // a Máscara Hollow é independente da forma (normalizar já migrou `liberado: "mascara"`), mas só vale para o Visored com o treino e a máscara escolhida
  if (f.estado.mascaraAtiva && (!podeMascara(f) || !mascaraAtiva(f))) { f.estado.mascaraAtiva = false; nota("A Máscara Hollow estava posta sem o treino ou sem a máscara escolhida e foi retirada."); }
  const cond = unicos(f.estado.condicoes);
  if (cond.length !== f.estado.condicoes.length) f.estado.condicoes = cond;
  f.estado.ativas = unicos(f.estado.ativas);
  f.estado.pvTemp = inteiro(f.estado.pvTemp, 0, 9999, 0);
  f.estado.curtosUsados = inteiro(f.estado.curtosUsados, 0, 2, 0);

  // Hōgyoku: estágio 0 a 3, Desequilíbrio 0 a 10, Crisálidas 0 a 3 (normalizar já limitou; aqui só avisa do que mudou)
  const hb = (bruta.hogyoku ?? {}) as unknown as Record<string, unknown>;
  if (bruta.hogyoku !== undefined && (Object.keys(f.hogyoku) as (keyof typeof f.hogyoku)[]).some((k) => hb[k] !== f.hogyoku[k])) nota("Os dados do Hōgyoku estavam fora do padrão e foram ajustados (estágio 0 a 3, Desequilíbrio 0 a 10, Crisálidas 0 a 3).");

  // PV e PR atuais dentro dos limites
  const c = calcular(f);
  const pvMax = Math.max(0, c.pv);
  // com a Máscara Hollow ativa, os PR temporários dela (guardados em prAtual) continuam valendo até ela sair
  const prMax = Math.max(0, c.pr) + Math.floor(Math.max(0, c.pr) * tempMascara(mascaraAtiva(f)).pr);
  const pv = inteiro(f.pvAtual, 0, pvMax, pvMax);
  const pr = inteiro(f.prAtual, 0, prMax, Math.max(0, c.pr));
  if (pv !== f.pvAtual) { nota(`PV atual ajustado para ${pv} (máximo ${pvMax}).`); f.pvAtual = pv; }
  if (pr !== f.prAtual) { nota(`PR atual ajustado para ${pr} (máximo ${prMax}${prMax > c.pr ? ", com os PR temporários da Máscara" : ""}).`); f.prAtual = pr; }

  return { ficha: f, mudancas: m };
}

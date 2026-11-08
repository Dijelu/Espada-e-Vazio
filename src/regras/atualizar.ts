/* "Atualizar ficha": planeja, aplica e desfaz a passagem de uma ficha antiga para a versão atual do sistema.
   Regras de ouro: nenhum número do jogador muda (a atualização confere antes de aplicar e se recusa se algum mudar);
   o que não puder ser decidido sozinho vira uma lista "a revisar"; a ficha de antes fica guardada para desfazer. */
import { calcular, type Ficha, type TipoForma } from "./ficha";
import { repararFicha } from "./reparo";
import { migrarFormas, type DetalheMigracao } from "./migracao";
import { VERSAO_SISTEMA_ATUAL, fichaDesatualizada, marcaDasFormas, podeDesfazer, versaoDaFicha } from "./versao";
import { ehCartaoNovo, habilidadesLidas, infoRitmo, limiteCaracsArma, ritmoDeAcao } from "./cartoes";
import { custoPeca, orcamentoDaForma, somarForma } from "./efeitos-forma";
import { calcularLiberacao } from "./liberacao-forma";
import { TIPO_FORMA_NOME, liberacaoDaForma } from "./liberacoes";
import { ehInteracao } from "./especiais";
import { caracsValidas } from "./arma-forma";
import { presetPorId } from "./efeitos-presets";

/* ---------- a foto dos números ---------- */

/** Todos os números que a ficha mostra e usa nas formas (PV, PR, CR, custos, PP, dano e PR de cada ação). Antes e depois da atualização têm de ser iguais.
 *  Fica de fora só o que não é número: os botões e as linhas de texto que a interação automática (0 PP) acrescenta para a técnica antiga continuar funcionando. */
export function fotoNumeros(original: Ficha, custoRecalculado: readonly string[] = []): string {
  // o PP da Schrift sai de propósito: nas duas fotos ele é zerado, para o resto da conta ser comparado por inteiro
  const f: Ficha = { ...original, formas: Object.fromEntries(Object.entries(original.formas ?? {}).map(([k, fo]) => [k, fo && fo.efeitos ? { ...fo, efeitos: fo.efeitos.map((e) => (e.preset && presetPorId(e.preset)?.schrift ? { ...e, pp: 0 } : e)) } : fo])) };
  const saida: unknown[] = [];
  const pega = (g: Ficha) => {
    const k = calcular(g);
    return [k.pv, k.pr, k.cr, k.prof, k.atr, k.iniciativa, k.desloc, k.rdFis, k.rdEso];
  };
  const semForma = { ...f, estado: { ...f.estado, liberado: "" } } as Ficha;
  try { saida.push(pega(semForma)); } catch { saida.push("sem conta"); }
  for (const [chave, forma] of Object.entries(f.formas ?? {})) {
    if (!forma) continue;
    const tipo = chave as TipoForma;
    const linha: unknown[] = [tipo, custoRecalculado.includes(tipo) ? "custo recalculado" : forma.custo, forma.ppExtra ?? 0, (forma.efeitos ?? []).filter((e) => !(e.familia === "interacao" && e.espec?.auto)).map((e) => e.pp ?? 0)];
    try {
      const ativa = { ...f, estado: { ...f.estado, liberado: liberacaoDaForma(tipo) } } as Ficha;
      const kA = calcular(ativa);
      const k0 = calcular(semForma);
      const ctx = { n: f.nivel, prof: k0.prof, atr: k0.atr, tipo };
      const pecas = forma.efeitos ?? [];
      // da soma da forma só entram os números: botões, invocações e linhas de texto podem ganhar a interação automática (0 PP) e isso não é número
      const { botoes: _b, invocacoes: _i, linhas: _l, textos: _t, ...numeros } = (somarForma(ativa, { ...ctx, atr: kA.atr }) ?? {}) as unknown as Record<string, unknown>;
      linha.push(pega(ativa), numeros, orcamentoDaForma(f, tipo, forma, ctx), pecas.filter((p) => !(p.familia === "interacao" && p.espec?.auto)).map((p) => custoPeca(p, ctx)), calcularLiberacao(tipo, pecas, ctx, {}));
    } catch { linha.push("sem conta"); }
    linha.push(habilidadesLidas(forma, f).map((h) => [h.id, h.nome, h.acao, h.pr, h.custo, h.dano, h.limite, h.requisito]));
    saida.push(linha);
  }
  return JSON.stringify(saida);
}

/* ---------- o que fica a revisar ---------- */

export interface ItemRevisar { id: string; texto: string; forma: TipoForma }

/** O que a ficha ainda deixa para o jogador decidir. É calculado na hora: o item some sozinho quando a pessoa resolve. */
export function itensARevisar(f: Ficha): ItemRevisar[] {
  const lista: ItemRevisar[] = [];
  for (const [chave, forma] of Object.entries(f.formas ?? {})) {
    if (!forma) continue;
    const tipo = chave as TipoForma;
    if (!forma.nome && !(forma.habilidades?.length) && !(forma.efeitos?.length)) continue;
    const nome = forma.nome || TIPO_FORMA_NOME[tipo];
    if (!forma.arma) {
      if (tipo !== "vollstandig") lista.push({ id: `arma-${tipo}`, texto: `Escolher a arma da forma ${nome} (passo “Forma da arma”). Sem arma, tudo continua liberado como hoje.`, forma: tipo });
    } else if (!forma.arma.informativa && limiteCaracsArma(tipo) > 0 && caracsValidas(forma.armaCaracs).length === 0) {
      lista.push({ id: `caracs-${tipo}`, texto: `Marcar as características da arma da forma ${nome}.`, forma: tipo });
    }
    const autos = (forma.efeitos ?? []).filter((e) => ehInteracao(e) && e.espec?.auto).length;
    if (autos > 0) lista.push({ id: `auto-${tipo}`, texto: `Conferir ${autos === 1 ? "a interação automática" : `as ${autos} interações automáticas`} da forma ${nome} (aba Técnicas especiais). Elas foram postas para a técnica funcionar como antes; você pode trocar ou tirar.`, forma: tipo });
  }
  return lista;
}

/* ---------- o plano “antes e depois” ---------- */

export interface ItemPlano {
  id: string;
  titulo: string;
  antes: string;
  depois: string;
  /** onde acontece (nomes das formas) */
  formas: string[];
}

export interface PlanoAtualizacao {
  de: number;
  para: number;
  itens: ItemPlano[];
  revisar: ItemRevisar[];
  /** os números de antes e de depois são idênticos? */
  numerosIguais: boolean;
  /** a ficha como vai ficar (já migrada; a cópia de segurança entra só ao aplicar) */
  ficha: Ficha;
  /** os mesmos avisos que o reparo dá */
  mudancas: string[];
}

const soma = (d: DetalheMigracao[], k: "paraEspecial" | "interacoesAuto" | "cartoesMarcados" | "textosGolpe" | "schriftSemPp") => d.reduce((n, x) => n + x[k], 0);
const onde = (d: DetalheMigracao[], k: "paraEspecial" | "interacoesAuto" | "cartoesMarcados" | "textosGolpe" | "schriftSemPp") => d.filter((x) => x[k] > 0).map((x) => x.nome);
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Mostra exatamente o que a atualização vai fazer nesta ficha, sem mudar nada nela. */
export function planejarAtualizacao(f: Ficha): PlanoAtualizacao {
  const vista = repararFicha(f, { migrar: false }).ficha; // como a pessoa vê hoje (modo legado)
  const nova = structuredClone(vista);
  const mig = migrarFormas(nova);
  const rep = repararFicha(nova, { migrar: false }); // revalida as peças novas
  const depois = rep.ficha;
  const de = versaoDaFicha(f);
  depois.versaoSistema = VERSAO_SISTEMA_ATUAL;

  const d = mig.detalhes;
  const itens: ItemPlano[] = [];
  const nEsp = soma(d, "paraEspecial");
  if (nEsp > 0) itens.push({ id: "especiais", titulo: "Cartões de característica antigos", antes: `${plural(nEsp, "cartão", "cartões")} na aba Características (clones, invocação, marcar alvo ou sinergias).`, depois: "Viram técnica especial ou interação especial, marcados “de ficha antiga”. O PP deles continua o mesmo e eles não ocupam vaga.", formas: onde(d, "paraEspecial") });
  const nAuto = soma(d, "interacoesAuto");
  if (nAuto > 0) itens.push({ id: "interacoes-auto", titulo: "Interações automáticas ligadas", antes: `${plural(nAuto, "técnica", "técnicas")} sem interação.`, depois: `${plural(nAuto, "interação automática", "interações automáticas")}, 0 PP, para a técnica continuar funcionando igual em jogo. Você pode trocar ou tirar depois.`, formas: onde(d, "interacoesAuto") });
  const nMarcados = soma(d, "cartoesMarcados");
  if (nMarcados > 0) itens.push({ id: "cartoes-legado", titulo: "Cartões de ação antigos", antes: `${plural(nMarcados, "ação automática", "ações automáticas")} sem tipo de cartão.`, depois: "Ganham a marca “de ficha antiga” e entram nos tipos novos de ação. Dano, texto e PR continuam como estavam.", formas: onde(d, "cartoesMarcados") });
  // PR das ações antigas: ficam com o PR de antes (calculado pelo dano); só as ações novas usam o fixo por ritmo
  const antigas: { nome: string; pr: number }[] = [];
  const formasComAntigas = new Set<string>();
  for (const forma of Object.values(depois.formas)) {
    if (!forma) continue;
    for (const h of forma.habilidades ?? []) {
      if (h.fixa || ehCartaoNovo(h) || typeof h.pr !== "number") continue;
      if (h.pr !== infoRitmo(ritmoDeAcao(h.acao)).pr) { antigas.push({ nome: h.nome, pr: h.pr }); formasComAntigas.add(forma.nome || TIPO_FORMA_NOME[forma.tipo]); }
    }
  }
  if (antigas.length > 0) {
    const ex = antigas.slice(0, 3).map((a) => `${a.nome}: ${a.pr} PR`).join("; ");
    itens.push({ id: "pr-antigas", titulo: "PR das ações antigas", antes: `${plural(antigas.length, "ação com", "ações com")} PR calculado pelo dano (${ex}${antigas.length > 3 ? "…" : ""}).`, depois: "Continuam com o mesmo PR. Só as ações novas que você criar usam o PR fixo por ritmo: ação 12, ação bônus 5, reação 6.", formas: [...formasComAntigas] });
  }
  const nTexto = soma(d, "textosGolpe");
  if (nTexto > 0) itens.push({ id: "golpe-reforcado", titulo: "Golpe reforçado", antes: "O texto dizia “Técnica especial: 1 uso por cena”.", depois: "Passa a dizer “Golpe reforçado: 1 uso por cena”. Só a palavra muda; a regra é a mesma.", formas: onde(d, "textosGolpe") });
  const nSch = soma(d, "schriftSemPp");
  if (nSch > 0) itens.push({ id: "schrift-sem-pp", titulo: "Schrift deixa de usar PP", antes: `${plural(nSch, "peça da Schrift gasta", "peças da Schrift gastam")} ${d.reduce((n, x) => n + x.schriftPp, 0)} PP da forma.`, depois: "O PP da Schrift sai da conta e esses pontos ficam livres na forma. O poder da Schrift não muda e nenhum outro número muda.", formas: onde(d, "schriftSemPp") });
  const comCusto = d.filter((x) => x.custoDepois !== undefined);
  if (comCusto.length > 0) itens.push({ id: "custo-liberacao", titulo: "Custo de liberação recalculado", antes: comCusto.map((x) => `${x.nome}: ${x.custoAntes} PR`).join("; ") + ".", depois: comCusto.map((x) => `${x.nome}: ${x.custoDepois} PR`).join("; ") + ". Sem o PP da Schrift, o custo de liberar a forma é recalculado pelas peças que sobram.", formas: comCusto.map((x) => x.nome) });
  const custoMao = d.filter((x) => x.schriftSemPp > 0 && x.custoManual);
  if (custoMao.length > 0) itens.push({ id: "custo-manual", titulo: "Custo de liberação escrito por você", antes: custoMao.map((x) => x.nome).join(", ") + ": custo digitado à mão.", depois: "Continua do jeito que você escreveu; o sistema não mexe. Se quiser, use “Usar a sugestão” na forma.", formas: custoMao.map((x) => x.nome) });
  const comArma = d.filter((x) => x.armaSugerida);
  if (comArma.length > 0) itens.push({ id: "arma-modelo", titulo: "Arma da forma (modelo oficial)", antes: `${plural(comArma.length, "forma de modelo oficial", "formas de modelo oficial")} sem arma.`, depois: `Recebem a arma do modelo (${comArma.map((x) => x.armaSugerida).join(", ")}) só como informação. Nenhum cartão é travado e nenhum número muda.`, formas: comArma.map((x) => x.nome) });
  const revisar = itensARevisar(depois);
  const semArma = revisar.filter((x) => x.id.startsWith("arma-"));
  if (semArma.length > 0) itens.push({ id: "sem-arma", titulo: "Formas sem arma definida", antes: `${plural(semArma.length, "forma", "formas")} sem arma.`, depois: "Continuam sem arma e com tudo liberado, como hoje. Ficam na lista “a revisar” para você escolher a arma quando quiser.", formas: semArma.map((x) => depois.formas[x.forma]?.nome || TIPO_FORMA_NOME[x.forma]) });
  itens.push({ id: "versao", titulo: "Versão da ficha", antes: de === 0 ? "Sem versão (ficha antiga)." : `Versão ${de}.`, depois: `Versão ${VERSAO_SISTEMA_ATUAL}. A ficha de antes fica guardada para você poder desfazer.`, formas: [] });

  const recalc = d.filter((x) => x.custoDepois !== undefined).map((x) => x.tipo as string);
  const numerosIguais = fotoNumeros(vista, recalc) === fotoNumeros(depois, recalc);
  return { de, para: VERSAO_SISTEMA_ATUAL, itens, revisar, numerosIguais, ficha: depois, mudancas: [...mig.mudancas, ...rep.mudancas] };
}

/* ---------- aplicar e desfazer ---------- */

export type ResultadoAtualizacao = { ok: true; ficha: Ficha; plano: PlanoAtualizacao } | { ok: false; erro: string };

/** Atualiza a ficha. Recusa (sem mudar nada) se a ficha já está na versão atual ou se algum número mudaria. */
export function atualizarFicha(f: Ficha, agora: Date = new Date()): ResultadoAtualizacao {
  if (!fichaDesatualizada(f)) return { ok: false, erro: "A ficha já está na versão atual." };
  const plano = planejarAtualizacao(f);
  if (!plano.numerosIguais) return { ok: false, erro: "Não deu para atualizar sem mudar algum dos seus números. Nada foi alterado; fale com o Mestre." };
  const nova = structuredClone(plano.ficha);
  const em = agora.toISOString();
  // guarda como estava tudo o que a atualização mexeu (formas e habilidades junto, mais qualquer outro campo da ficha que o reparo tenha tocado)
  const antes = repararFicha(f, { migrar: false }).ficha as unknown as Record<string, unknown>;
  const depoisR = plano.ficha as unknown as Record<string, unknown>;
  const campos: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(antes), ...Object.keys(depoisR)])) {
    if (["formas", "versaoSistema", "atualizacao", "anteriorAtualizacao"].includes(k)) continue;
    if (JSON.stringify(antes[k] ?? null) !== JSON.stringify(depoisR[k] ?? null)) campos[k] = antes[k] === undefined ? null : structuredClone(antes[k]);
  }
  nova.anteriorAtualizacao = { em, versao: plano.de, formas: structuredClone(f.formas ?? {}), ...(Object.keys(campos).length ? { campos } : {}) };
  nova.atualizacao = { em, de: plano.de, marca: marcaDasFormas(nova.formas) };
  nova.versaoSistema = VERSAO_SISTEMA_ATUAL;
  return { ok: true, ficha: nova, plano };
}

/** Volta as formas e a versão para antes da atualização (o resto da ficha, como PV e anotações, fica como está). */
export function desfazerAtualizacao(f: Ficha, agora: number = Date.now()): Ficha | null {
  const ant = f.anteriorAtualizacao;
  if (!ant || !podeDesfazer(f, agora)) return null;
  const { anteriorAtualizacao: _a, atualizacao: _b, versaoSistema: _v, ...resto } = f;
  const volta = { ...resto, formas: structuredClone(ant.formas) } as Ficha & Record<string, unknown>;
  // os outros campos que a atualização mexeu voltam como estavam (null = o campo não existia)
  for (const [k, v] of Object.entries(ant.campos ?? {})) { if (v === null) delete volta[k]; else volta[k] = structuredClone(v); }
  if (ant.versao > 0) volta.versaoSistema = ant.versao;
  return volta;
}

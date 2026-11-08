/* Migração agrupada das formas: tudo o que a "Atualizar ficha" faz de uma vez, sem mudar nenhum número.
   1) cartões de característica antigos (clones, invocação, marcar alvo e as 4 sinergias) viram técnica ou interação especial (etiqueta e ligação; efeitos e PP ficam);
   2) técnica antiga sem interação ganha a interação padrão, automática e com 0 PP, para continuar funcionando em jogo;
   3) cartões de ação automáticos de antes ganham a marca de "ficha antiga" (dano, PR e texto ficam como estavam);
   4) o texto "Técnica especial: 1 uso por cena" do golpe de dano maior vira "Golpe reforçado" (só a palavra);
   5) forma de modelo oficial que ainda não tinha arma ganha a arma do modelo, só como informação (não trava cartão nenhum).
   Idempotente: o que já migrou não é tocado. Muda o objeto recebido (use uma cópia). */
import type { Ficha, TipoForma } from "./ficha";
import { migrarEspeciais } from "./especiais";
import { marcaDoCartaoAntigo } from "./cartoes";
import { armaDoModelo } from "./modelos-arma";
import { presetPorId } from "./efeitos-presets";
import { calcular } from "./ficha";
import { calcularLiberacao } from "./liberacao-forma";

export interface DetalheMigracao {
  tipo: TipoForma;
  nome: string;
  /** cartões de característica que viraram técnica ou interação especial */
  paraEspecial: number;
  /** interações automáticas (0 PP) postas para a técnica continuar funcionando */
  interacoesAuto: number;
  /** cartões de ação automáticos que ganharam a marca de ficha antiga */
  cartoesMarcados: number;
  /** golpes com o texto trocado para "Golpe reforçado" */
  textosGolpe: number;
  /** nome da arma do modelo oficial posta como informação */
  armaSugerida?: string;
  /** peças da Schrift que deixaram de usar PP */
  schriftSemPp: number;
  /** PP que essas peças gastavam */
  schriftPp: number;
  /** custo de liberação (PR) salvo na forma antes e depois de tirar o PP da Schrift; só quando o custo mudou */
  custoAntes?: number;
  custoDepois?: number;
  /** custo escrito à mão pelo jogador: não é recalculado */
  custoManual?: boolean;
}

export interface ResultadoMigracao { detalhes: DetalheMigracao[]; mudancas: string[] }

const TEXTO_ANTIGO = "Técnica especial: 1 uso por cena.";
const TEXTO_NOVO = "Golpe reforçado: 1 uso por cena.";
const TIPOS_COM_ARMA_DE_MODELO = ["shikai", "bankai", "bankai2", "resurreccion", "segunda"] as const;

export function migrarFormas(f: Ficha): ResultadoMigracao {
  const detalhes: DetalheMigracao[] = [];
  const mudancas: string[] = [];
  for (const forma of Object.values(f.formas ?? {})) {
    if (!forma) continue;
    const nome = forma.nome || forma.tipo;
    const d: DetalheMigracao = { tipo: forma.tipo, nome, paraEspecial: 0, interacoesAuto: 0, cartoesMarcados: 0, textosGolpe: 0, schriftSemPp: 0, schriftPp: 0 };
    if (Array.isArray(forma.efeitos)) {
      const mig = migrarEspeciais(forma.efeitos);
      if (mig.mudou > 0) {
        forma.efeitos = mig.lista;
        d.paraEspecial = mig.mudou;
        d.interacoesAuto = mig.auto;
        mudancas.push(`Na forma ${nome}, ${mig.mudou} cartão(ões) viraram técnica ou interação especial${mig.auto > 0 ? `; ${mig.auto} interação(ões) automática(s) foram postas (0 PP) para a técnica continuar funcionando` : ""}; nada mudou nos números.`);
      }
    }
    // a Schrift não usa PP: o poder e o texto ficam, só o preço some
    if (Array.isArray(forma.efeitos)) {
      forma.efeitos = forma.efeitos.map((e) => {
        if (!e.preset || !presetPorId(e.preset)?.schrift || !(typeof e.pp === "number" ? e.pp !== 0 : (presetPorId(e.preset)?.pp ?? 0) !== 0)) return e;
        d.schriftSemPp++; d.schriftPp += typeof e.pp === "number" ? e.pp : presetPorId(e.preset)?.pp ?? 0;
        return { ...e, pp: 0 };
      });
      if (d.schriftSemPp > 0) {
        mudancas.push(`Na forma ${nome}, a Schrift deixou de usar PP (${d.schriftPp} PP); o poder dela continua igual.`);
        // o custo de liberação sai da conta das peças: sem o PP da Schrift, ele é recalculado (a não ser que o jogador tenha escrito o custo à mão)
        if (forma.custoManual) d.custoManual = true;
        else {
          try {
            const k = calcular({ ...f, estado: { ...f.estado, liberado: "" } });
            const novo = calcularLiberacao(forma.tipo, forma.efeitos, { n: f.nivel, prof: k.prof, atr: k.atr, tipo: forma.tipo }, {}).custoPr;
            if (novo !== null && novo !== forma.custo) {
              d.custoAntes = forma.custo; d.custoDepois = novo; forma.custo = novo;
              mudancas.push(`O custo de liberação da forma ${nome} foi recalculado: de ${d.custoAntes} para ${novo} PR.`);
            }
          } catch { /* conta impossível: deixa o custo como está */ }
        }
      }
    }
    if (Array.isArray(forma.habilidades)) {
      forma.habilidades = forma.habilidades.map((h) => {
        let x = h;
        if (typeof x.texto === "string" && x.texto.includes(TEXTO_ANTIGO)) { x = { ...x, texto: x.texto.replace(TEXTO_ANTIGO, TEXTO_NOVO) }; d.textosGolpe++; }
        const marca = marcaDoCartaoAntigo(x);
        if (!marca) return x;
        d.cartoesMarcados++;
        return { ...x, cartao: marca };
      });
      if (d.cartoesMarcados > 0) mudancas.push(`Os cartões da forma ${nome} foram reorganizados nos novos tipos de ação; nada mudou nos números.`);
    }
    if (!forma.arma && forma.modelo && (TIPOS_COM_ARMA_DE_MODELO as readonly string[]).includes(forma.tipo)) {
      const a = armaDoModelo(forma.tipo as (typeof TIPOS_COM_ARMA_DE_MODELO)[number], forma.modelo);
      if (a.arma) {
        forma.arma = a.arma;
        if (a.armaCaracs && !(forma.armaCaracs && forma.armaCaracs.length > 0)) forma.armaCaracs = a.armaCaracs;
        d.armaSugerida = a.arma.nome;
        mudancas.push(`A forma ${nome} ganhou a arma do modelo oficial (${a.arma.nome}), só como informação; nada mudou nos números.`);
      }
    }
    if (d.paraEspecial || d.cartoesMarcados || d.textosGolpe || d.armaSugerida || d.schriftSemPp) detalhes.push(d);
  }
  return { detalhes, mudancas };
}

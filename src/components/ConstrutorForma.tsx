import { analisarDano } from "../regras/teto-dano";
import { aplicarMudanca, danoDoCartao, vagasUsadas } from "../regras/cartoes";
import { TextoCarta } from "./TextoCarta";
import { ArtePainel } from "./ArtePainel";
import { PainelSchrift } from "./PainelSchrift";
import { ROTULO_ORIGEM, origemDaForma } from "../lib/origem";
import { CartaoHabilidade } from "./CartoesHabilidade";
import { MontagemCartoes } from "./MontagemCartoes";
import { faltasEspeciais } from "../regras/especiais";
import { EfeitosNeutros } from "./EfeitosNeutros";
import { ModelosBankai } from "./ModelosBankai";
import { shikaiExigida, temAShikai } from "../regras/bankai-exige-shikai";
import { ModelosHollow } from "./ModelosHollow";
import { ModelosShikai } from "./ModelosShikai";
import { calcularLiberacao } from "../regras/liberacao-forma";
import { EfeitosForma, EscolhaAtributos } from "./EfeitosForma";
import { SeletorDano } from "./SeletorFormula";
import { Icone } from "./Icone";
import { useEffect, useMemo, useRef, useState } from "react";
import { calcular, classePorId, type Ficha, type FormaLib, type HabForma, type TipoForma } from "../regras/ficha";
import {
  BANKAIS,
  HAB_UNICAS,
  RESURRECCIONES,
  TIPO_FORMA_NOME,
  VOLL_PASSIVAS,
  VOLL_PRONTAS,
  picksVoll,
  totalPicks,
} from "../regras/liberacoes";
import { QUANDO_NOME, type Faz, type InstEfeito } from "../regras/efeitos-forma";
import { Dica } from "./Dica";
import { aplicarFaz } from "../regras/aplicar-faz";
import { novoId } from "./FichaPecas";
import { AssistenteForma, LIMITE_HAB } from "./AssistenteForma";
import { EscolhaArmaForma } from "./EscolhaArmaForma";
import { SeletorSchrift } from "./SeletorSchrift";
import { schriftDaFicha } from "../regras/schrifts";
import { acoesDaForma, formaDaLiberacao, liberacaoDaForma, modeloResurreccionPadrao, comoHabilidades, habilidadesDaForma, maiorCustoPR, resolverDano, danoDaAcao, sugerirCusto } from "../regras/liberacoes";
import type { Calculo } from "../regras/ficha";
import type { Rolagens } from "./Rolador";
import { classificarHab } from "../regras/classificar-hab";
import { AbaInvocacoes } from "./Invocacoes";
import { acertoClasse } from "../regras/danos-classe";
import { ATR_NOME } from "../regras/efeitos-forma";
const mod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export const vazia = (tipo: TipoForma): FormaLib => ({
  tipo,
  modelo: "",
  nome: "",
  comando: "",
  aparencia: "",
  estilo: "",
  custo: tipo === "bankai" || tipo === "bankai2" ? 40 : tipo === "vollstandig" ? 60 : tipo === "shikai" ? 5 : 0,
  duracao: tipo === "bankai" || tipo === "bankai2" ? "1 minuto" : tipo === "resurreccion" || tipo === "segunda" ? "até o fim da cena" : "até você encerrar",
  categoria: "",
  espirito: "",
  habilidades: [],
  traco: "",
  pontoFraco: "",
  canalizador: "",
  schrift: "",
  picks: {},
  texto: "",
});

interface Props {
  f: Ficha;
  tipo: TipoForma;
  onSalvar: (forma: FormaLib) => void;
  /** grava sem fechar (confirmar escolhas de efeitos) */
  onGravar?: (forma: FormaLib) => void;
  onFechar: () => void;
}

const DICAS: Record<TipoForma, string> = {
  bankai2:
    "A Bankai Verdadeira é a forma final da sua Bankai. Mude a aparência, dê um nome novo e crie, com o Mestre, uma técnica de assinatura nova. Dura no máximo 1 minuto e deixa você Esgotado até um descanso curto.",
  shikai:
    "A Shikai é o primeiro estágio da sua Zanpakutou. Escolha uma Zanpakutou pronta do livro, siga o passo a passo ou edite tudo de uma vez. O custo de liberação vai de 3 a 10 PR.",
  bankai:
    "Escolha uma Bankai pronta do livro ou monte a sua. A Bankai Potencializadora intensifica os poderes da Shikai; a Transformadora cria um poder novo. O custo de liberação vai de 40 a 80 PR e dura 1 minuto. Toda Bankai tem um ponto fraco.",
  resurreccion:
    "Custo, duração, bônus de CR e a técnica de assinatura já vêm da sua classe e do seu Caminho. Aqui você define a forma: nome, aparência, um traço pequeno e um ponto fraco.",
  segunda:
    "A Segunda Etapa é a evolução da sua Resurrección: o corpo muda de novo, mais forte e mais cruel. Pense no que a Resurrección escondia e no que sobra do Hollow quando ele deixa de se segurar. Aqui você define a nova forma: nome, aparência, um traço novo, um ponto fraco e as técnicas. O custo e os bônus numéricos vêm da sua classe.",
  vollstandig:
    "As habilidades passivas são iguais para todos os Quincy. Você escolhe as habilidades únicas (uma vez definidas, não mudam), o canalizador e, se tiver, a Schrift.",
};

export function ConstrutorForma({ f, tipo, onSalvar, onGravar, onFechar }: Props) {
  const classe = classePorId(f.classe);
  const ehBankai = tipo === "bankai" || tipo === "bankai2";
  const caminhoFinal = tipo === "bankai" ? f.treinos.caminhoBankai : tipo === "bankai2" ? "verdadeira" : "";
  const [aba, setAba] = useState<"modelos" | "passo" | "efeitos" | "meu">(f.formas[tipo]?.nome ? "meu" : tipo !== "vollstandig" ? "modelos" : "passo");
  const [r, setR] = useState<FormaLib>(() => {
    if (f.formas[tipo]) return { ...vazia(tipo), ...f.formas[tipo]! };
    // a Verdadeira parte da Bankai que você já tem: muda o nome e a aparência e ganha uma técnica nova
    if (tipo === "bankai2" && f.formas.bankai) return { ...vazia(tipo), ...f.formas.bankai, tipo, nome: "", comando: "", aparencia: "", habilidades: f.formas.bankai.habilidades.map((h) => ({ ...h, id: `${h.id}-v` })) };
    return vazia(tipo);
  });
  const ctxAtual = useMemo(() => {
    const k = calcular({ ...f, estado: { ...f.estado, liberado: "" } });
    const base = { n: f.nivel, prof: k.prof, atr: k.atr };
    return { ...base, tipo };
  }, [f, tipo, r.efeitos]);
  const [aberto, setAberto] = useState("");
  const [busca, setBusca] = useState("");
  const mud = (p: Partial<FormaLib>) =>
    setR((x) => {
      const n = { ...x, ...p };
      if (p.habilidades && !n.custoManual && (tipo === "shikai" || ehBankai)) n.custo = sugerirCusto(tipo, n.habilidades);
      // com peças de efeito, o custo e a duração vêm da conta das peças
      if ((p.efeitos || p.habilidades) && !n.custoManual && (n.efeitos?.length ?? 0) > 0) {
        const l = calcularLiberacao(tipo, n.efeitos ?? [], ctxAtual, { plena: tipo === "bankai" && f.treinos.caminhoBankai === "plena" });
        if (l.custoPr !== null) n.custo = l.custoPr;
        if (ehBankai || l.turnos !== null) n.duracao = l.duracaoTexto;
      }
      return n;
    });
  const sugestao = tipo === "shikai" || ehBankai ? sugerirCusto(tipo, r.habilidades) : 0;
  const dicaCusto = sugestao > 0 && (
    <small className="ajuda">
      Sugestão: {sugestao} PR (maior custo entre as habilidades: {maiorCustoPR(r.habilidades)} PR).{" "}
      {r.custo === sugestao && !r.custoManual ? "Em uso; muda sozinho conforme você adiciona habilidades." : (
        <button type="button" className="link" onClick={() => mud({ custo: sugestao, custoManual: false })}>Usar a sugestão</button>
      )}
    </small>
  );

  useEffect(() => {
    const t = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", t);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", t);
      document.body.style.overflow = "";
    };
  }, [onFechar]);

  const limite = picksVoll(f.classe, f.nivel);
  const usados = totalPicks(r.picks);
  const nomeTipo = TIPO_FORMA_NOME[tipo];

  const usarBankai = (id: string) => {
    const m = BANKAIS.find((b) => b.id === id)!;
    setR({
      ...vazia(tipo),
      modelo: m.id,
      nome: m.nome,
      comando: `Bankai, ${m.nome}`,
      custo: m.custo || 40,
      texto: m.texto,
      aparencia: m.resumo,
      habilidades: comoHabilidades(m.acoes),
    });
    setAba("meu");
  };
  const usarRes = (id: string) => {
    const m = RESURRECCIONES.find((x) => x.id === id)!;
    setR({
      ...vazia("resurreccion"),
      modelo: m.id,
      nome: m.nome,
      comando: m.comando,
      aparencia: m.aparencia,
      traco: m.traco,
      pontoFraco: m.pontoFraco,
      habilidades: comoHabilidades(acoesDaForma({ tipo: "resurreccion", modelo: m.id } as FormaLib)),
      custo: classe?.id === "vazio" ? 40 : 45,
    });
    setAba("meu");
  };
  const usarVoll = (id: string) => {
    const m = VOLL_PRONTAS.find((x) => x.id === id)!;
    setR((x) => ({ ...x, modelo: m.id, nome: m.nome, aparencia: m.aparencia, canalizador: m.canalizador, picks: { ...m.picks }, texto: m.resumo, habilidades: comoHabilidades(acoesDaForma({ tipo: "vollstandig", modelo: m.id } as FormaLib)) }));
    setAba("meu");
  };

  const habil = (id: string, p: Partial<HabForma>) =>
    mud({
      habilidades: r.habilidades.map((h) => (h.id === id ? aplicarMudanca(h, p, ctxAtual, (r.ppExtra ?? 0) > 0) : h)),
    });

  const mudarPick = (id: string, delta: number, unica?: boolean) => {
    const atual = r.picks[id] ?? 0;
    const novo = Math.max(0, atual + delta);
    if (delta > 0 && (usados >= limite || (unica && atual >= 1))) return;
    const picks = { ...r.picks };
    if (novo === 0) delete picks[id];
    else picks[id] = novo;
    mud({ picks });
  };

  const modelosRes = [...RESURRECCIONES].sort((a, b) => Number(b.classe === classe?.id) - Number(a.classe === classe?.id));
  const q = busca.trim().toLowerCase();
  const bankais = BANKAIS.filter((b) => !q || b.nome.toLowerCase().includes(q));

  const errosDano = r.habilidades.filter((h) => !h.fixa).flatMap((h) => (analisarDano(danoDoCartao(h, ctxAtual, (r.ppExtra ?? 0) > 0), h.acao, ctxAtual, (r.ppExtra ?? 0) > 0, h.especial ?? false)?.erros ?? []).map((e) => `${h.nome || "Habilidade"}: ${e}`));
  const faltasEsp = faltasEspeciais(r.efeitos ?? [], tipo);
  const podeSalvar = r.nome.trim().length > 0 && errosDano.length === 0 && faltasEsp.length === 0;

  return (
    <div className="construtor" role="dialog" aria-modal="true" aria-label={`Montar ${nomeTipo}`}>
      <div className="construtor-topo">
        <div>
          <small className="ajuda">Nível {f.nivel}</small>
          <h2 className="title-font">Sua {nomeTipo}</h2>
        </div>
        <button type="button" className="fechar" onClick={onFechar} aria-label="Fechar">×</button>
      </div>
      <p className="ajuda construtor-dica">{DICAS[tipo]}{tipo === "bankai" && f.treinos.caminhoBankai === "plena" ? " Você escolheu a Bankai Plena: o custo cai pela metade, a CR sobe +2 e o dano das técnicas sobe 25%. Adicione uma ação nova para a Bankai, aprovada pelo Mestre." : ""}{tipo === "bankai" && f.treinos.caminhoBankai === "verdadeira" ? " Você escolheu a Bankai Verdadeira: mude a aparência da Bankai e crie, com o Mestre, uma técnica de assinatura nova. Dura no máximo 1 minuto e deixa você Esgotado até um descanso curto." : ""}</p>
      {r.preRequisito && <p className="regra-cartao construtor-dica"><b>Pré-requisito:</b> {r.preRequisito}</p>}
      <div className="modos" role="tablist" aria-label="Como montar">
        {(!caminhoFinal || ehBankai) && <button type="button" role="tab" aria-selected={aba === "modelos"} className={aba === "modelos" ? "on" : ""} onClick={() => setAba("modelos")}>Modelos prontos</button>}
        <button type="button" role="tab" aria-selected={aba === "passo"} className={aba === "passo" ? "on" : ""} onClick={() => setAba("passo")}>Passo a passo</button>
        <button type="button" role="tab" aria-selected={aba === "meu"} className={aba === "meu" ? "on" : ""} onClick={() => setAba("meu")}>Editar tudo</button>
      </div>

      <div className="construtor-corpo">
        {aba === "modelos" && tipo === "shikai" && (
          <ModelosShikai ctx={ctxAtual} onUsar={(x) => { setR({ ...vazia("shikai"), ...x } as FormaLib); setAba("meu"); }} />
        )}

        {aba === "modelos" && ehBankai && (
          <>
            <ModelosBankai f={f} tipo={tipo as "bankai" | "bankai2"} ctx={ctxAtual} onUsar={(x) => { setR({ ...vazia(tipo), ...x } as FormaLib); setAba("meu"); }} />
            {tipo === "bankai" && <h3 className="sub-passivas">Bankais do livro</h3>}
            {tipo === "bankai" && (
              <>
            <input className="seletor-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar Bankai" aria-label="Buscar Bankai" />
            <ul className="seletor-lista">
              {bankais.map((b) => (
                <li key={b.id} className={aberto === b.id ? "aberta" : ""}>
                  <button type="button" className="seletor-item" aria-expanded={aberto === b.id} onClick={() => setAberto(aberto === b.id ? "" : b.id)}>
                    <b>{b.nome}</b>
                    <small>{b.custo ? `${b.custo} PR para liberar` : "Veja o custo no texto"}</small>
                  </button>
                  {aberto === b.id && (
                    <div className="seletor-detalhe">
                      {b.texto.split("\n\n").slice(0, 6).map((p, i) => <p key={i}>{p}</p>)}
                      <p className="ajuda">O texto completo está no Capítulo 5.</p>
                      {(() => {
                        const exige = shikaiExigida(b.id, b.nome);
                        const ok = temAShikai(f.formas.shikai?.modelo, exige);
                        return (
                          <>
                            {!ok && exige && <p className="regra-cartao"><b>Precisa da Shikai {exige.nome}:</b> escolha essa Shikai antes para usar esta Bankai.</p>}
                            <button type="button" className="btn" disabled={!ok} onClick={() => usarBankai(b.id)}>{ok ? `Usar a Bankai ${b.nome}` : `Precisa da Shikai ${exige?.nome}`}</button>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
              </>
            )}
          </>
        )}

        {aba === "modelos" && tipo === "segunda" && (
          <ModelosHollow f={f} tipo="segunda" ctx={ctxAtual} onUsar={(x) => { setR({ ...vazia(tipo), ...x } as FormaLib); setAba("meu"); }} />
        )}
        {aba === "modelos" && tipo === "resurreccion" && (
          <>
          <ModelosHollow f={f} tipo="resurreccion" ctx={ctxAtual} onUsar={(x) => { setR({ ...vazia(tipo), ...x } as FormaLib); setAba("meu"); }} />
          <h3 className="sub-passivas">Resurrecciones do livro</h3>
          <ul className="seletor-lista">
            {modelosRes.map((m) => (
              <li key={m.id} className={aberto === m.id ? "aberta" : ""}>
                <button type="button" className="seletor-item" aria-expanded={aberto === m.id} onClick={() => setAberto(aberto === m.id ? "" : m.id)}>
                  <b>{m.nome}</b>
                  <small>{m.classe === "hueco" ? "Hueco" : "Vazio"} · Caminho {m.caminho}{m.classe === classe?.id ? " · da sua classe" : ""}</small>
                </button>
                {aberto === m.id && (
                  <div className="seletor-detalhe">
                    <p><b>Comando:</b> {m.comando}</p>
                    <p><b>Aparência:</b> {m.aparencia}</p>
                    <p><b>Técnica:</b> {m.tecnica}</p>
                    <p><b>Traço:</b> {m.traco}</p>
                    <p><b>Ponto fraco:</b> {m.pontoFraco}</p>
                    <button type="button" className="btn" onClick={() => usarRes(m.id)}>Usar {m.nome}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          </>
        )}

        {aba === "modelos" && tipo === "vollstandig" && (
          <ul className="seletor-lista">
            {VOLL_PRONTAS.map((m) => (
              <li key={m.id} className={aberto === m.id ? "aberta" : ""}>
                <button type="button" className="seletor-item" aria-expanded={aberto === m.id} onClick={() => setAberto(aberto === m.id ? "" : m.id)}>
                  <b>{m.nome}</b>
                  <small>{m.personagem} · reishi {m.cor} · {m.resumo}</small>
                </button>
                {aberto === m.id && (
                  <div className="seletor-detalhe">
                    <p><b>Aparência:</b> {m.aparencia}</p>
                    <p><b>Canalizador:</b> {m.canalizador}</p>
                    <ul>
                      {Object.entries(m.picks).map(([id, n]) => {
                        const h = HAB_UNICAS.find((x) => x.id === id);
                        return <li key={id}>{h?.nome} ({n}x): {h?.texto}</li>;
                      })}
                    </ul>
                    <button type="button" className="btn" onClick={() => usarVoll(m.id)}>Usar {m.nome}</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {aba === "passo" && (
          <AssistenteForma f={f} tipo={tipo} r={r} mud={mud} onSalvar={() => onSalvar(r)} onEditarTudo={() => setAba("meu")} onGravar={onGravar} />
        )}

        {aba === "meu" && (
          <div className="construtor-form">
            {r.modelo && <p className="ajuda">Base: modelo pronto do livro. Você pode ajustar tudo abaixo.</p>}
            <label className="campo">Nome<input value={r.nome} onChange={(e) => mud({ nome: e.target.value })} placeholder={tipo === "vollstandig" ? "Ex.: Vollständig do Atirador" : "Nome da forma"} /></label>
            <label className="campo">{tipo === "vollstandig" ? "Frase de liberação" : "Comando / frase de liberação"}<input value={r.comando} onChange={(e) => mud({ comando: e.target.value })} placeholder={tipo === "vollstandig" ? "Ex.: Quincy Vollständig" : "Frase dita ao liberar"} /></label>
            <label className="campo">Aparência<textarea rows={3} value={r.aparencia} onChange={(e) => mud({ aparencia: e.target.value })} placeholder="Como o corpo, a arma, as asas ou o cenário mudam" /></label>
            <div className="caixa">
              <h3>Forma da arma{tipo === "vollstandig" ? " (opcional)" : ""}</h3>
              <EscolhaArmaForma f={f} tipo={tipo} r={r} mud={mud} />
            </div>

            {tipo === "shikai" && (
              <>
                <label className="campo">Categoria
                  <select value={r.categoria ?? ""} onChange={(e) => mud({ categoria: e.target.value })}>
                    <option value="">Escolha</option>
                    {["Combate", "Elemental", "Kido", "Especial"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="campo">Espírito (aparência e personalidade)<textarea rows={2} value={r.espirito ?? ""} onChange={(e) => mud({ espirito: e.target.value })} /></label>
                <label className="campo">Custo de liberação (3 a 10 PR)<input type="number" min={3} max={10} value={r.custo} onChange={(e) => mud({ custo: Number(e.target.value), custoManual: true })} />{dicaCusto}</label>
              </>
            )}
            {ehBankai && (
              <>
                {caminhoFinal === "plena" && (
                  <div className="caixa painel-caminho">
                    <h3>Bankai Plena</h3>
                    <ul>
                      <li>Custo de liberação pela metade: você paga <b>{Math.ceil(r.custo / 2)} PR</b> (base {r.custo} PR).</li>
                      <li>+2 na CR enquanto a Bankai estiver ativa (já aplicado na ficha).</li>
                      <li>Dano das técnicas +25%, arredondado para baixo (já aplicado nos botões de dano).</li>
                      <li>Uma ação nova, aprovada pelo Mestre.</li>
                    </ul>
                    <button type="button" className="btn btn-paper" disabled={vagasUsadas(r.habilidades) >= LIMITE_HAB.bankai} onClick={() => mud({ habilidades: [...r.habilidades, { id: novoId(), nome: "Ação da Bankai Plena", texto: "", custo: "", acao: "Ação" }] })}>+ Adicionar a ação nova da Plena</button>
                  </div>
                )}
                {caminhoFinal === "verdadeira" && (
                  <div className="caixa painel-caminho">
                    <h3>Bankai Verdadeira</h3>
                    <ul>
                      <li>A Bankai muda de aparência: descreva a nova forma no campo Aparência.</li>
                      <li>Duração: no máximo <b>1 minuto</b> por vez.</li>
                      <li>Ao terminar, você fica com 1 nível de <b>Esgotado</b> até um descanso curto.</li>
                      <li>Os demais números da Bankai não mudam. Crie com o Mestre uma técnica de assinatura nova.</li>
                    </ul>
                    <button type="button" className="btn btn-paper" disabled={vagasUsadas(r.habilidades) >= LIMITE_HAB.bankai} onClick={() => mud({ habilidades: [...r.habilidades, { id: novoId(), nome: "Técnica de assinatura (Bankai Verdadeira)", texto: "", custo: "", acao: "Ação" }] })}>+ Adicionar a técnica de assinatura</button>
                  </div>
                )}
                <label className="campo">Tipo
                  <select value={r.estilo} onChange={(e) => mud({ estilo: e.target.value as FormaLib["estilo"] })}>
                    <option value="">Escolha</option>
                    <option value="potencializadora">Potencializadora (intensifica a Shikai)</option>
                    <option value="transformadora">Transformadora (poder novo)</option>
                  </select>
                </label>
                <div className="duas">
                  <label className="campo">{caminhoFinal === "plena" ? "Custo base (você paga a metade)" : "Custo de liberação (40 a 80 PR)"}<input type="number" min={20} max={80} value={r.custo} onChange={(e) => mud({ custo: Number(e.target.value), custoManual: true })} />{dicaCusto}</label>
                  <label className="campo">Duração<input value={caminhoFinal === "verdadeira" ? "1 minuto (máximo)" : r.duracao} readOnly={caminhoFinal === "verdadeira"} onChange={(e) => mud({ duracao: e.target.value })} /></label>
                </div>
              </>
            )}

            {(tipo === "resurreccion" || tipo === "segunda") && (
              <>
                <p className="ajuda">{tipo === "segunda" ? "Inclua abaixo as técnicas da nova forma. Você pode trazer as da sua Resurrección e deixá-las mais fortes, e criar uma técnica final." : "Inclua abaixo a técnica de assinatura do seu Caminho (12 PR, só durante a Resurrección, Capítulo 3) e as suas outras técnicas."}</p>
                <label className="campo">Traços da forma (até 3, um por linha)<textarea rows={4} value={r.traco} onChange={(e) => mud({ traco: e.target.value.split("\n").slice(0, 3).join("\n") })} placeholder="Ex.: +3 m de alcance, voo, PV temporários por rodada" /></label>
              </>
            )}

            <MontagemCartoes f={f} tipo={tipo} r={r} mud={mud} acoes={
              <div className="caixa">
                <h3>{ehBankai ? "Habilidades e técnicas" : "Habilidades e técnicas da forma"}</h3>
                <p className="ajuda">Cada habilidade com PR ou dano vira uma carta nova no Resumo, com botões de usar e rolar.</p>
                <div className="cartas-hab cartoes-montados">
                  {r.habilidades.map((h) => (
                    <CartaoHabilidade key={h.id} h={h} tipo={tipo} ctx={ctxAtual} ppExtra={(r.ppExtra ?? 0) > 0} nomeForma={r.nome} efeitos={r.efeitos} onChange={(p) => habil(h.id, p)} onRemover={() => mud({ habilidades: r.habilidades.filter((x) => x.id !== h.id) })} />
                  ))}
                </div>
                <button type="button" className="btn btn-paper" disabled={vagasUsadas(r.habilidades) >= LIMITE_HAB[tipo]} onClick={() => mud({ habilidades: [...r.habilidades, { id: novoId(), nome: "", texto: "", custo: "", acao: "Ação" }] })}>Adicionar habilidade</button>
              </div>
            } />

            {tipo === "vollstandig" && (
              <>
                <label className="campo">Canalizador (objeto que ativa a Vollständig)<input value={r.canalizador} onChange={(e) => mud({ canalizador: e.target.value })} placeholder="Colar, luva, máscara, símbolo de sangue..." /></label>
                <SeletorSchrift valor={r.schrift} onChange={(nome) => mud({ schrift: nome })} sugerida={schriftDaFicha(f)?.nome} />
                <div className="caixa">
                  <h3>Passivas (todo Quincy)</h3>
                  <ul>{VOLL_PASSIVAS.map((t) => <li key={t}>{t}</li>)}</ul>
                </div>
                <div className="caixa">
                  <h3>Habilidades únicas: {usados} de {limite}</h3>
                  <p className="ajuda">Depois de definidas, não mudam. Força Espiritual e Precisão Espiritual só podem ser escolhidas uma vez cada.</p>
                  {HAB_UNICAS.map((h) => {
                    const n = r.picks[h.id] ?? 0;
                    return (
                      <div className="pick" key={h.id}>
                        <div>
                          <b>{h.nome}</b>
                          <small>{h.texto}</small>
                        </div>
                        <div className="pick-passo">
                          <button type="button" className="btn-mini" onClick={() => mudarPick(h.id, -1)} disabled={n === 0} aria-label={`Tirar ${h.nome}`}>−</button>
                          <span aria-live="polite">{n}</span>
                          <button type="button" className="btn-mini" onClick={() => mudarPick(h.id, 1, h.unica)} disabled={usados >= limite || (h.unica && n >= 1)} aria-label={`Escolher ${h.nome}`}>+</button>
                        </div>
                        {h.id === "atributo" && <EscolhaAtributos n={n} valor={r.atrPicks} onChange={(v) => mud({ atrPicks: v })} />}

                      </div>
                    );
                  })}
                  <p className="ajuda">Custo para liberar: 60 PR, com uma ação. Os bônus de CR, PV, PR, redução de dano e deslocamento entram sozinhos na ficha enquanto a Vollständig estiver ativa.</p>
                </div>
              </>
            )}

            {tipo !== "vollstandig" && (
              <label className="campo">Ponto fraco<textarea rows={2} value={r.pontoFraco} onChange={(e) => mud({ pontoFraco: e.target.value })} placeholder="Um preço ou vulnerabilidade da forma" /></label>
            )}

            <EfeitosNeutros f={f} tipo={tipo} r={r} mud={mud} />
            <EfeitosForma f={f} tipo={tipo} r={r} mud={mud} onGravar={onGravar} />
          </div>
        )}
      </div>

      {(errosDano.length > 0 || faltasEsp.length > 0) && <ul className="avisos" role="alert">{[...errosDano, ...(faltasEsp.length > 0 ? [`Técnicas e interações especiais: ${faltasEsp.length === 1 ? "falta 1 coisa" : `faltam ${faltasEsp.length} coisas`}. Veja o aviso amarelo na tela de cartões.`] : [])].map((e) => <li key={e}>{e}</li>)}</ul>}
      <div className="construtor-rodape">
        <button type="button" className="btn btn-paper" onClick={onFechar}>Decidir depois</button>
        <button type="button" className="btn" disabled={!podeSalvar} onClick={() => onSalvar(r)}>
          Salvar {nomeTipo}
        </button>
      </div>
    </div>
  );
}

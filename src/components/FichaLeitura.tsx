/* Ficha completa em modo somente leitura: o Mestre vê tudo o que o jogador montou, sem poder alterar nada. */
import { useMemo, type ReactNode } from "react";
import { somarDadosGolpe } from "../regras/mascara";
import { acertoClasse, danosDaClasse } from "../regras/danos-classe";
import { CONDICAO_TEXTO, KIDOS, TALENTOS, talentosDe, type Talento } from "../regras/catalogo";
import { HAB_UNICAS, TIPO_FORMA_NOME, danoDaAcao, liberacaoDaForma, resolverDano } from "../regras/liberacoes";
import { habilidadesLidas } from "../regras/cartoes";
import { ataqueMelhorado } from "../regras/melhorias";
import { mascaraAtiva } from "../regras/mascara";
import {
  ATRIBUTOS, PERICIAS, ataqueBonus, ataquesPorAcao, calcular, classePorId, danoAtributo, mod, partesOrigem,
  type Ataque, type Calculo, type Ficha, type FormaLib, type HabForma, type TipoForma,
} from "../regras/ficha";

const ORDEM_FORMAS: TipoForma[] = ["shikai", "bankai", "bankai2", "resurreccion", "vollstandig", "segunda"];
const NOME_LIBERACAO: Record<string, string> = { terror: "Segunda Etapa", mascara: "Máscara Hollow" };
const LIMITE_NOME = { cena: "1 por cena", curto: "1 por descanso curto", longo: "1 por descanso longo" } as const;

/** Dano final de um ataque cadastrado (mesma conta da página da ficha). */
function danoFinal(f: Ficha, a: Ataque, c: Calculo) {
  const dano = a.distancia ? ataqueMelhorado(f, a).dano : somarDadosGolpe(ataqueMelhorado(f, a).dano, c.dadosGolpeMascara);
  if (!dano.trim()) return dano;
  const atr = danoAtributo(c, a);
  const geral = c.danoGeral > 0 ? `+${c.danoGeral}` : "";
  if (a.distancia) return dano + atr + geral + (c.danoDisparo > 0 ? `+${c.danoDisparo}` : "") + c.danoDadosDisparo.map((d) => `+${d}`).join("");
  return dano + atr + geral + (c.danoCorpo > 0 ? `+${c.danoCorpo}` : "") + c.danoDados.map((d) => `+${d}`).join("");
}

/** Acha o talento pelo id (o Tokubetsu guarda "classe/id" dos talentos emprestados). */
function acharTalento(classe: string, id: string): Talento | undefined {
  const curto = id.includes("/") ? id.split("/").pop()! : id;
  const daClasse = id.includes("/") ? TALENTOS[id.split("/")[0]] : talentosDe(classe);
  return daClasse?.find((t) => t.id === curto) ?? Object.values(TALENTOS).flat().find((t) => t.id === curto);
}

/** Bloco da ficha. Com `n`, fica recolhido e o cabeçalho mostra só a contagem. */
function Bloco({ titulo, n, children }: { titulo: string; n?: number; children: ReactNode }) {
  if (n) {
    return (
      <details className="ficha-leitura-bloco recolhe">
        <summary><h4>{titulo} <small>{n}</small></h4></summary>
        {children}
      </details>
    );
  }
  return (
    <section className="ficha-leitura-bloco">
      <h4>{titulo}</h4>
      {children}
    </section>
  );
}

function Habilidade({ f, c, forma, h }: { f: Ficha; c: Calculo; forma: FormaLib; h: HabForma }) {
  const ativa = f.estado.liberado === liberacaoDaForma(forma.tipo);
  const dano = h.dano ? (ativa ? danoDaAcao(h.dano, f, c, forma, h) : resolverDano(h.dano, f, c)) : "";
  const pr = h.prExpr ? Number(resolverDano(h.prExpr, f, c)) || (h.pr ?? 0) : h.pr ?? 0;
  const custo = pr ? `${pr} PR` : h.custo;
  const texto = h.texto || [h.desc, h.regra].filter(Boolean).join("\n");
  return (
    <li className="ficha-leitura-hab">
      <div className="ficha-leitura-hab-topo">
        <b>{h.nome}</b>
        {h.acao && <small>{h.acao}</small>}
      </div>
      <div className="ficha-leitura-tags">
        {custo && <span>Custo <b>{custo}</b></span>}
        {dano && <span>Dano <b>{dano}</b></span>}
        {h.especial && <span className="fraco">Especial: fica {h.especial.condicao} {h.especial.duracao}</span>}
        {h.limite && <span className="fraco">{LIMITE_NOME[h.limite]}</span>}
        {h.requisito && <span className="fraco">Requisito: {h.requisito}</span>}
        {h.auto && <span>Automático ({h.auto})</span>}
      </div>
      {texto && (
        <details className="poder-livro">
          <summary>Descrição</summary>
          <p className="quebra">{texto}</p>
        </details>
      )}
    </li>
  );
}

function Forma({ f, c, forma }: { f: Ficha; c: Calculo; forma: FormaLib }) {
  const ativa = f.estado.liberado === liberacaoDaForma(forma.tipo);
  const habs = habilidadesLidas(forma, f);
  return (
    <article className={`ficha-leitura-forma ${ativa ? "ativa" : ""}`}>
      <small>
        {TIPO_FORMA_NOME[forma.tipo]}
        {forma.estilo ? ` · ${forma.estilo}` : forma.categoria ? ` · ${forma.categoria}` : ""}
        {ativa ? " · ATIVA" : ""}
      </small>
      <h5 className="title-font">{forma.nome}</h5>
      {forma.comando && <p><i>“{forma.comando}”</i></p>}
      <div className="ficha-leitura-tags">
        {forma.custo > 0 && <span>Liberação <b>{forma.custo} PR</b></span>}
        {forma.duracao && <span>Duração <b>{forma.duracao}</b></span>}
        {forma.preRequisito && <span>Pré-requisito: {forma.preRequisito}</span>}
      </div>
      {forma.aparencia && <p>{forma.aparencia}</p>}
      {forma.espirito && <p><b>Espírito:</b> {forma.espirito}</p>}
      {forma.traco && <p className="quebra"><b>{forma.traco.includes("\n") ? "Traços" : "Traço"}:</b>{forma.traco.includes("\n") ? "\n" : " "}{forma.traco}</p>}
      {forma.canalizador && <p><b>Canalizador:</b> {forma.canalizador}</p>}
      {forma.schrift && <p><b>Schrift:</b> {forma.schrift}</p>}
      {forma.pontoFraco && <p className="ficha-leitura-fraco"><b>Ponto fraco:</b> {forma.pontoFraco}</p>}
      {(forma.efeitos?.length ?? 0) > 0 && (
        <details className="poder-livro">
          <summary>Cartões de característica e de efeito ({forma.efeitos!.length})</summary>
          <ul>{forma.efeitos!.map((e) => <li key={e.id}><b>{e.nome}</b>{e.texto ? `: ${e.texto}` : ""}</li>)}</ul>
        </details>
      )}
      {forma.tipo === "vollstandig" && Object.keys(forma.picks ?? {}).length > 0 && (
        <ul>
          {Object.entries(forma.picks).map(([id, n]) => {
            const h = HAB_UNICAS.find((u) => u.id === id);
            return <li key={id}><b>{h?.nome ?? id}</b> ({n}x){h?.texto ? `: ${h.texto}` : ""}</li>;
          })}
        </ul>
      )}
      {habs.length > 0 ? (
        <ul className="ficha-leitura-habs">{habs.map((h) => <Habilidade key={h.id} f={f} c={c} forma={forma} h={h} />)}</ul>
      ) : (
        <p className="ajuda">Nenhuma habilidade cadastrada.</p>
      )}
    </article>
  );
}

export function FichaLeitura({ f, nome }: { f: Ficha; nome?: string }) {
  const titulo = nome || f.nome || "Sem nome";
  const c = useMemo(() => calcular(f), [f]);
  const classe = classePorId(f.classe);
  const parte = partesOrigem(f)[0];
  const periciasTreinadas = PERICIAS.filter((p) => c.pericias[p.id].prof);
  const saves = ATRIBUTOS.filter((a) => c.saves[a.id].prof);
  const danosClasse = danosDaClasse(f, c);
  const acertoCl = acertoClasse(f, c);
  const talentos = f.talentos.map((id) => ({ id, t: acharTalento(f.classe, id) }));
  const formas = ORDEM_FORMAS.map((t) => f.formas[t]).filter((x): x is FormaLib => !!x && !!x.nome);
  const liberado = f.estado.liberado;
  const formaNome = liberado && liberado !== "mascara" ? (NOME_LIBERACAO[liberado] ?? TIPO_FORMA_NOME[liberado as TipoForma] ?? liberado) : "";
  const nomeLiberado = [formaNome, mascaraAtiva(f) ? NOME_LIBERACAO.mascara : ""].filter(Boolean).join(" + ");
  const formaAtiva = formas.find((x) => liberacaoDaForma(x.tipo) === liberado);
  const invocacoes = f.estado.invocacoes ?? [];
  const notas: [string, string][] = ([
    ["Tendência", f.tendencia],
    ["Equipamento", f.equipamento],
    ["Aparência", f.aparencia],
    ["História", f.historia],
    ["Anotações da campanha", f.notas],
  ] as [string, string][]).filter(([, v]) => v && v.trim());

  return (
    <div className="ficha-leitura" aria-label={`Ficha completa de ${titulo} (somente leitura)`}>
      <header className="ficha-leitura-topo">
        <small>{parte?.origem.nome ?? "Sem origem"}{parte?.variacao ? ` (${parte.variacao.nome})` : ""}</small>
        <h4 className="title-font">{titulo}</h4>
        <p>
          {classe?.nome ?? "Sem classe"}{f.subclasse ? ` · ${f.subclasse}` : ""} · nível {f.nivel}
          {f.zanpakutou.nome ? ` · Zanpakutou ${f.zanpakutou.nome}` : ""}
        </p>
      </header>

      <div className="selos ficha-leitura-selos">
        <div><small>PV</small><b>{f.pvAtual}/{c.pv}</b>{f.estado.pvTemp > 0 && <span className="ajuda">+{f.estado.pvTemp} temp.</span>}</div>
        <div><small>PR</small><b>{f.prAtual}/{c.pr}</b></div>
        <div><small>CR</small><b>{c.cr}</b></div>
        <div><small>Proficiência</small><b>{mod(c.prof)}</b></div>
        <div><small>Iniciativa</small><b>{mod(c.iniciativa)}</b></div>
        <div><small>Desloc.</small><b>{c.desloc} m</b></div>
        <div><small>Perc. passiva</small><b>{c.percPassiva}</b></div>
        <div><small>CD / Kidō</small><b>{c.cd} / {c.cdKido}</b></div>
        <div className="txt"><small>Ataques</small><b>{ataquesPorAcao(f, c.forma?.ataques ?? 0)} por ação</b></div>
        <div className="txt"><small>RD</small><b>{c.rdFis} fís. · {c.rdEso} eso.</b></div>
      </div>

      <div className="atrs ficha-leitura-atrs">
        {ATRIBUTOS.map((a) => (
          <div className="atr" key={a.id}>
            <small>{a.sigla}</small>
            <b>{c.atr[a.id]}</b>
            <span>{a.nome}</span>
          </div>
        ))}
      </div>

      <div className="ficha-leitura-grade">
        <Bloco titulo="Estado atual">
          <p title="Forma liberada"><b>{nomeLiberado ? `${nomeLiberado}${formaAtiva ? ` · ${formaAtiva.nome}` : ""}` : "Sem forma liberada"}</b></p>
          {(f.hogyoku?.estagio ?? 0) > 0 && <p title="Artefato do Mestre"><b>Hōgyoku</b> · {c.hogyoku.ativo ? `estágio ${c.hogyoku.estagio} · CD ${c.hogyoku.cd}` : "pedra muda (nível 10+)"} · Desequilíbrio {f.hogyoku.desequilibrio}/10</p>}
          {f.estado.condicoes.length > 0 ? (
            <ul className="ficha-leitura-lista">
              {f.estado.condicoes.map((nome) => (
                <li key={nome}>
                  <details className="poder-livro">
                    <summary><b>{nome}</b></summary>
                    {(CONDICAO_TEXTO[nome] ?? []).map((t, i) => <p key={i}>{t}</p>)}
                  </details>
                </li>
              ))}
            </ul>
          ) : <p className="ajuda">Sem condições</p>}
        </Bloco>

        <Bloco titulo="Salvaguardas">
          {saves.length ? (
            <div className="chips">{saves.map((a) => <span className="chip" key={a.id} title={a.nome}>{a.sigla} {mod(c.saves[a.id].total)}</span>)}</div>
          ) : <p className="ajuda">Nenhuma.</p>}
          <p className="ajuda" title="Demais salvaguardas">{ATRIBUTOS.filter((a) => !c.saves[a.id].prof).map((a) => `${a.sigla} ${mod(c.saves[a.id].total)}`).join(" · ") || "—"}</p>
        </Bloco>

        <Bloco titulo={`Perícias (${periciasTreinadas.length})`}>
          {periciasTreinadas.length ? (
            <div className="chips">{periciasTreinadas.map((p) => <span className="chip" key={p.id}>{p.nome} {mod(c.pericias[p.id].total)}</span>)}</div>
          ) : <p className="ajuda">Nenhuma.</p>}
        </Bloco>
      </div>

      <Bloco titulo="Ataques">
        {f.ataques.length === 0 && danosClasse.length === 0 && <p className="ajuda">Nenhum ataque cadastrado.</p>}
        <div className="ficha-leitura-ataques">
          {f.ataques.map((a) => {
            const m = ataqueMelhorado(f, a);
            return (
              <div className="carta-mini carta-ataque" key={a.id}>
                <b>{a.nome}{a.distancia && <em className="ca-tag">distância</em>}</b>
                <div className="ca-stats">
                  <span>Acerto <b>{mod(ataqueBonus(f, c, a))}</b></span>
                  <span>Base <b>{a.dano || "—"}</b></span>
                  <span>Dano <b>{danoFinal(f, a, c) || "—"}</b></span>
                  {m.crit ? <span>Crítico <b>{m.crit}–20 ×{m.mult ?? 2}</b></span> : null}
                </div>
                {a.nota && <small className="ajuda">{a.nota}</small>}
              </div>
            );
          })}
          {danosClasse.map((d) => (
            <div className="carta-mini carta-ataque" key={d.nome}>
              <b>{d.nome} <em className="ca-tag">{d.fonte === "Classe" ? "da classe" : "técnica"}</em></b>
              <div className="ca-stats">
                {d.acerto && <span>Acerto <b>{mod(acertoCl)}</b></span>}
                <span>Dano <b>{d.dano}</b> de {d.tipo}</span>
                {d.acao && <span>Ação <b>{d.acao}</b></span>}
                {d.custo && <span>Custo <b>{d.custo}</b></span>}
              </div>
              {d.nota && <small className="ajuda">{d.nota}</small>}
            </div>
          ))}
        </div>
      </Bloco>

      <div className="ficha-leitura-grade">
        <Bloco titulo="Talentos" n={talentos.length}>
          {talentos.length ? (
            <ul className="ficha-leitura-lista">
              {talentos.map(({ id, t }) => (
                <li key={id}>
                  {t ? (
                    <details className="poder-livro">
                      <summary><b>{t.nome}</b></summary>
                      <p>{t.texto}</p>
                    </details>
                  ) : <b>{id}</b>}
                </li>
              ))}
            </ul>
          ) : <p className="ajuda">Nenhum talento escolhido.</p>}
        </Bloco>

        <Bloco titulo="Essências">
          {f.essencias.length ? (
            <div className="chips">{f.essencias.map((e) => <span key={e.id} className="chip">{e.nome} · etapa {e.etapa}{e.gratis ? " (grátis)" : ""}</span>)}</div>
          ) : <p className="ajuda">Nenhuma.</p>}
        </Bloco>

        <Bloco titulo="Kidōs" n={f.kidos.length + f.tecnicasReishi.length}>
          {f.kidos.length ? (
            <ul className="ficha-leitura-lista">
              {f.kidos.map((k) => (
                <li key={k.tipo + k.n}>
                  {k.tipo === "hadou" ? "Hadō" : "Bakudō"} {k.n}: <b>{k.nome}</b>{" "}
                  <small className="ajuda">rank {KIDOS.find((x) => x.tipo === k.tipo && x.n === k.n)?.rank ?? "?"}</small>
                </li>
              ))}
            </ul>
          ) : <p className="ajuda">Nenhum.</p>}
          {f.tecnicasReishi.length > 0 && (
            <>
              <p><b>Técnicas de Reishi:</b></p>
              <div className="chips">{f.tecnicasReishi.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            </>
          )}
        </Bloco>
      </div>

      {f.poderes.length > 0 && (
        <Bloco titulo="Poderes anotados" n={f.poderes.length}>
          <ul className="ficha-leitura-lista">
            {f.poderes.map((p) => (
              <li key={p.id}>
                <details className="poder-livro">
                  <summary><b>{p.nome || "Sem nome"}</b> <small>{[p.tipo, p.custo].filter(Boolean).join(" · ")}</small></summary>
                  {p.texto && <p className="quebra">{p.texto}</p>}
                </details>
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      <Bloco titulo="Formas de liberação" n={formas.length}>
        {formas.length ? (
          <div className="ficha-leitura-formas">{formas.map((x) => <Forma key={x.tipo} f={f} c={c} forma={x} />)}</div>
        ) : <p className="ajuda">Nenhuma forma montada.</p>}
      </Bloco>

      {invocacoes.length > 0 && (
        <Bloco titulo="Invocações em campo">
          <ul className="ficha-leitura-lista">
            {invocacoes.map((v) => (
              <li key={v.id}>
                <b>{v.nome}</b> <small className="ajuda">{v.tipo === "clone" ? "clone" : "invocação"}</small>
                <div className="ficha-leitura-tags">
                  <span>PV <b>{v.pv}/{v.pvMax}</b></span>
                  <span>CR <b>{v.cr}</b></span>
                  <span>Acerto <b>{mod(v.acerto)}</b></span>
                  {v.dano && <span>Dano <b>{v.dano}</b></span>}
                </div>
                {v.texto && <p className="ajuda">{v.texto}</p>}
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      {notas.length > 0 && (
        <Bloco titulo="Anotações do jogador" n={notas.length}>
          {notas.map(([rotulo, texto]) => (
            <details className="poder-livro" key={rotulo} open={rotulo === "Anotações da campanha"}>
              <summary><b>{rotulo}</b></summary>
              <p className="quebra">{texto}</p>
            </details>
          ))}
        </Bloco>
      )}
    </div>
  );
}

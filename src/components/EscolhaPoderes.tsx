import { Icone } from "./Icone";
import { useMemo, useState } from "react";
import {
  KIDOS,
  RANKS,
  TECNICAS_REISHI,
  kidoLiberado,
  kidosConhecidos,
  nivelTecnicaMax,
  rankPermitido,
  slotsTalento,
  talentoLiberado,
  talentosDe,
  tecnicasConhecidas,
} from "../regras/catalogo";
import { classePorId, type Ficha } from "../regras/ficha";
import { Dica } from "./Dica";
import { formaPendente } from "../regras/liberacoes";
import { SCHRIFTS, NIVEL_SCHRIFT, schriftPendente } from "../regras/schrifts";
import { melhoriasDoNivel, melhoriasPendentes, podeMelhorar, TIPOS_MELHORIA, type TipoMelhoria } from "../regras/melhorias";
import { novoId } from "./FichaPecas";

export interface Pendencias {
  talentos: number;
  kidos: number;
  tecnicas: number;
  /** forma de liberação (Bankai, Resurrección ou Vollständig) por montar */
  forma: number;
  /** subclasse do nível 3 ainda sem escolha */
  subclasse: number;
  /** melhoria de equipamento Quincy (níveis 5, 10, 15 e 20) por escolher */
  melhorias: number;
  /** Schrift do Quincy (10º nível) por escolher */
  schrift: number;
}

/** A subclasse chega no nível 3 e ainda não foi escolhida. */
export const subclassePendente = (f: Ficha) => !!classePorId(f.classe) && f.nivel >= 3 && !f.subclasse.trim();

/** Quantas escolhas de poderes ainda faltam para o nível atual. */
export function pendencias(f: Ficha): Pendencias {
  const ids = new Set(talentosDe(f.classe).map((t) => t.id));
  const tals = f.talentos.filter((t) => ids.has(t)).length;
  return {
    talentos: Math.max(0, slotsTalento(f.nivel) - tals),
    kidos: Math.max(0, kidosConhecidos(f.classe, f.nivel) - f.kidos.length),
    tecnicas: Math.max(0, tecnicasConhecidas(f.classe, f.nivel) - f.tecnicasReishi.length),
    forma: formaPendente(f, classePorId(f.classe)?.tipo) ? 1 : 0,
    subclasse: subclassePendente(f) ? 1 : 0,
    melhorias: melhoriasPendentes(f),
    schrift: schriftPendente(f) ? 1 : 0,
  };
}

export const totalPendencias = (p: Pendencias) => p.talentos + p.kidos + p.tecnicas + p.forma + p.subclasse + p.melhorias + p.schrift;

export function EscolhaPoderes({ f, mudar }: { f: Ficha; mudar: (p: Partial<Ficha>) => void }) {
  const classe = classePorId(f.classe);
  const todos = talentosDe(f.classe);
  const slots = slotsTalento(f.nivel);
  const ids = new Set(todos.map((t) => t.id));
  const escolhidos = f.talentos.filter((t) => ids.has(t));
  const pend = pendencias(f);

  const maxKidos = kidosConhecidos(f.classe, f.nivel);
  const rank = rankPermitido(f.classe, f.nivel);
  const maxTec = tecnicasConhecidas(f.classe, f.nivel);
  const nivTec = nivelTecnicaMax(f.classe, f.nivel);

  const [tipoKido, setTipoKido] = useState<"hadou" | "bakudou">("hadou");
  const [busca, setBusca] = useState("");

  const grupos = useMemo(() => {
    const m = new Map<string, typeof todos>();
    for (const t of todos) {
      const g = t.grupo || "Talentos";
      m.set(g, [...(m.get(g) ?? []), t]);
    }
    return [...m.entries()];
  }, [todos]);

  const alternarTalento = (id: string) => {
    if (f.talentos.includes(id)) {
      // tirar um talento tira também os que dependem dele
      const sai = new Set([id]);
      let mudou = true;
      while (mudou) {
        mudou = false;
        for (const t of todos) if (!sai.has(t.id) && f.talentos.includes(t.id) && t.pre.some((p) => sai.has(p))) (sai.add(t.id), (mudou = true));
      }
      mudar({ talentos: f.talentos.filter((x) => !sai.has(x)) });
    } else if (escolhidos.length < slots) {
      mudar({ talentos: [...f.talentos, id] });
    }
  };

  const kidosFiltrados = KIDOS.filter(
    (k) => k.tipo === tipoKido && kidoLiberado(k, f.classe, f.nivel) && (!busca || (k.nome + " " + k.n).toLowerCase().includes(busca.toLowerCase()))
  );
  const temKido = (k: { tipo: string; n: number }) => f.kidos.some((x) => x.tipo === k.tipo && x.n === k.n);
  const alternarKido = (k: (typeof KIDOS)[number]) => {
    if (temKido(k)) mudar({ kidos: f.kidos.filter((x) => !(x.tipo === k.tipo && x.n === k.n)) });
    else if (f.kidos.length < maxKidos) mudar({ kidos: [...f.kidos, { tipo: k.tipo, n: k.n, nome: k.nome }] });
  };

  const tecnicas = TECNICAS_REISHI.filter((t) => t.nivel <= nivTec);
  const alternarTecnica = (nome: string) => {
    if (f.tecnicasReishi.includes(nome)) mudar({ tecnicasReishi: f.tecnicasReishi.filter((x) => x !== nome) });
    else if (f.tecnicasReishi.length < maxTec) mudar({ tecnicasReishi: [...f.tecnicasReishi, nome] });
  };

  if (!classe) return <p className="ajuda">Escolha uma classe antes.</p>;

  return (
    <div className="poderes-escolha">
      {slots > 0 && (
        <div className="caixa">
          <h3>Talentos de {classe.nome}</h3>
          <p className={`contagem ${pend.talentos === 0 ? "ok" : ""}`} role="status">
            {escolhidos.length} de {slots} escolhido(s){pend.talentos > 0 ? ` · faltam ${pend.talentos}` : ""}
          </p>
          {grupos.map(([g, lista]) => (
            <details key={g} className="grupo-tal" open={grupos.length === 1}>
              <summary>{g} <small>({lista.length})</small></summary>
              <div className="cartas-tal">
                {lista.map((t) => {
                  const marcado = f.talentos.includes(t.id);
                  const trava = talentoLiberado(t, f);
                  const cheio = !marcado && escolhidos.length >= slots;
                  return (
                    <Dica key={t.id} balao={<><b>{t.nome}</b><small>{trava ? `Bloqueado: ${trava}` : t.req || `${t.nivel}º nível`}</small><p>{t.texto}</p></>}>
                      {(alternar) => (
                        <div className={`tal ${marcado ? "on" : ""} ${trava ? "trava" : ""}`}>
                          <button
                            type="button"
                            className="tal-corpo"
                            onClick={() => (!trava || marcado) && alternarTalento(t.id)}
                            disabled={(!!trava && !marcado) || cheio}
                            aria-pressed={marcado}
                          >
                            <b>{marcado ? <><Icone nome="check" tamanho={15} /> </> : null}{t.nome}</b>
                            <small>{trava ? <><Icone nome="cadeado" tamanho={13} /> {trava}</> : t.req || `${t.nivel}º nível`}</small>
                          </button>
                          <button type="button" className="tal-ver" onClick={alternar} aria-label={`Ler ${t.nome}`}>Ler</button>
                        </div>
                      )}
                    </Dica>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}

      {maxKidos > 0 && (
        <div className="caixa">
          <h3>Kidō</h3>
          <p className={`contagem ${pend.kidos === 0 ? "ok" : ""}`} role="status">
            {f.kidos.length} de {maxKidos} conhecido(s) · até o rank {rank}
            {pend.kidos > 0 ? ` · faltam ${pend.kidos}` : ""}
          </p>
          {f.kidos.length > 0 && (
            <div className="chips">
              {f.kidos.map((k) => (
                <button key={k.tipo + k.n} type="button" className="chip chip-x" onClick={() => alternarKido({ ...k, rank: "" })} aria-label={`Tirar ${k.nome}`}>
                  {k.tipo === "hadou" ? "Hadō" : "Bakudō"} {k.n} · {k.nome} ×
                </button>
              ))}
            </div>
          )}
          <div className="filtro-kido">
            <div className="modos" role="group" aria-label="Tipo de Kidō">
              {(["hadou", "bakudou"] as const).map((t) => (
                <button key={t} type="button" className={tipoKido === t ? "on" : ""} aria-pressed={tipoKido === t} onClick={() => setTipoKido(t)}>
                  {t === "hadou" ? "Hadō (ataque)" : "Bakudō (apoio)"}
                </button>
              ))}
            </div>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou número" aria-label="Buscar Kidō" />
          </div>
          <div className="lista-kido">
            {kidosFiltrados.map((k) => {
              const on = temKido(k);
              return (
                <Dica key={k.tipo + k.n} balao={<><b>{k.tipo === "hadou" ? "Hadō" : "Bakudō"} {k.n} · {k.nome}</b><small>Rank {k.rank}{k.meta ? ` · ${k.meta}` : ""}</small><p>{k.texto || "Veja o texto completo no capítulo de Feitiços e Técnicas do livro."}</p></>}>
                  <button type="button" className={`kido ${on ? "on" : ""}`} onClick={() => alternarKido(k)} aria-pressed={on} disabled={!on && f.kidos.length >= maxKidos}>
                    <i>{k.n}</i>
                    <span>{k.nome}</span>
                    <em>{k.rank}</em>
                  </button>
                </Dica>
              );
            })}
            {kidosFiltrados.length === 0 && <p className="ajuda">Nada encontrado nesse rank.</p>}
          </div>
          <p className="ajuda">Ranks: {RANKS.join(" → ")}. A descrição de cada Kidō está no capítulo de Feitiços e Técnicas do livro.</p>
        </div>
      )}

      {maxTec > 0 && (
        <div className="caixa">
          <h3>Técnicas de Reishi</h3>
          <p className={`contagem ${pend.tecnicas === 0 ? "ok" : ""}`} role="status">
            {f.tecnicasReishi.length} de {maxTec} conhecida(s) · técnicas até o nível {nivTec}
            {pend.tecnicas > 0 ? ` · faltam ${pend.tecnicas}` : ""}
          </p>
          <div className="lista-kido">
            {tecnicas.map((t) => {
              const on = f.tecnicasReishi.includes(t.nome);
              return (
                <Dica key={t.nome} balao={<><b>{t.nome}</b><small>Técnica de Reishi · nível {t.nivel}</small><p>{t.texto || "Veja o texto completo no capítulo de Feitiços e Técnicas do livro."}</p></>}>
                  <button type="button" className={`kido ${on ? "on" : ""}`} onClick={() => alternarTecnica(t.nome)} aria-pressed={on} disabled={!on && f.tecnicasReishi.length >= maxTec}>
                    <i>{t.nivel}</i>
                    <span>{t.nome}</span>
                  </button>
                </Dica>
              );
            })}
          </div>
        </div>
      )}

      {melhoriasDoNivel(f.classe, f.nivel) > 0 && <SecaoMelhorias f={f} mudar={mudar} pendentes={pend.melhorias} />}

      {(f.classe === "schutze" || f.classe === "ritter") && f.nivel >= NIVEL_SCHRIFT && <SecaoSchrift f={f} mudar={mudar} pendente={pend.schrift > 0} />}

      {slots === 0 && maxKidos === 0 && maxTec === 0 && (
        <p className="ajuda">No nível {f.nivel} esta classe ainda não escolhe talentos, Kidō nem técnicas. Eles chegam a partir do nível 2.</p>
      )}
    </div>
  );
}

function SecaoMelhorias({ f, mudar, pendentes }: { f: Ficha; mudar: (p: Partial<Ficha>) => void; pendentes: number }) {
  const total = melhoriasDoNivel(f.classe, f.nivel);
  const [tipo, setTipo] = useState<TipoMelhoria>("dano");
  const [alvo, setAlvo] = useState("");
  const alvoReal = tipo === "escudo" ? "escudo" : alvo || f.ataques[0]?.id || "";
  const ok = !!alvoReal && podeMelhorar(f, alvoReal, tipo);
  const nome = (id: string) => (id === "escudo" ? "Escudo" : f.ataques.find((a) => a.id === id)?.nome ?? "Ataque removido");
  return (
    <div className="caixa" id="escolha-melhorias">
      <h3>Melhorias de equipamento</h3>
      <p className={`contagem ${pendentes === 0 ? "ok" : ""}`} role="status">
        {f.melhorias.length} de {total} escolhida(s){pendentes > 0 ? ` · faltam ${pendentes}` : ""}
      </p>
      {f.melhorias.map((m) => (
        <p className="linha-edit" key={m.id}>
          <b>{nome(m.alvo)}</b> · {TIPOS_MELHORIA.find((t) => t.id === m.tipo)?.nome}
          <button type="button" className="link-perigo" onClick={() => mudar({ melhorias: f.melhorias.filter((x) => x.id !== m.id) })}>Desfazer</button>
        </p>
      ))}
      {pendentes > 0 && (
        <div className="linha-edit">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMelhoria)} aria-label="Tipo de melhoria">
            {TIPOS_MELHORIA.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          {tipo !== "escudo" && (
            <select value={alvoReal} onChange={(e) => setAlvo(e.target.value)} aria-label="Arma a melhorar">
              {f.ataques.length === 0 && <option value="">Cadastre uma arma na aba Combate</option>}
              {f.ataques.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          )}
          <button type="button" className="btn btn-red" disabled={!ok} onClick={() => mudar({ melhorias: [...f.melhorias, { id: novoId(), alvo: alvoReal, tipo }] })}>Aplicar</button>
        </div>
      )}
      <p className="ajuda">{TIPOS_MELHORIA.find((t) => t.id === tipo)?.texto}{!ok && alvoReal ? " Essa melhoria já chegou ao limite nesse alvo." : ""}</p>
    </div>
  );
}

function SecaoSchrift({ f, mudar, pendente }: { f: Ficha; mudar: (p: Partial<Ficha>) => void; pendente: boolean }) {
  const atual = SCHRIFTS.find((s) => s.id === f.schrift);
  return (
    <div className="caixa" id="escolha-schrift">
      <h3>Schrift</h3>
      <p className={`contagem ${pendente ? "" : "ok"}`} role="status">{pendente ? "Falta escolher sua Schrift (10º nível)" : `Schrift: ${atual?.nome ?? "—"}`}</p>
      <label className="campo">
        <span>Schrift do mangá (com a aprovação do Mestre)</span>
        <select value={f.schrift} onChange={(e) => mudar({ schrift: e.target.value })}>
          <option value="">Escolha uma Schrift</option>
          {SCHRIFTS.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </label>
      {atual && (
        <p className="ajuda">
          <b>Poder de tema (10 PR, 1× por cena):</b> {atual.base} <b>Com a Vollständig:</b> {atual.voll}
        </p>
      )}
    </div>
  );
}

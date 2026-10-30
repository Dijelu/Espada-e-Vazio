import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Passo } from "./FichaPecas";
import { treinoConcluido, treinosDaFicha } from "../regras/catalogo";
import { classePorId, type Calculo, type Ficha } from "../regras/ficha";

const NIVEL_TREINO: Record<string, number> = { shikai: 3, bankai: 10, resurreccion: 9, "bankai-final": 20, terror: 15 };

export function AbaTreinamento({ f, c, alterar, onMontar }: { f: Ficha; c: Calculo; alterar: (p: Partial<Ficha>) => void; onMontar?: (tipo: "bankai") => void }) {
  const tipo = classePorId(f.classe)?.tipo;
  const lista = treinosDaFicha(f, tipo);
  const feitos = f.treinos.feitos;
  const marcar = (id: string) => alterar({ treinos: { ...f.treinos, feitos: feitos.includes(id) ? feitos.filter((x) => x !== id) : [...feitos, id] } });

  return (
    <section className="aba">
      <p className="ajuda">
        Só aparecem os treinamentos que existem para o seu personagem. As regras completas estão no <Link to="/livro/treinamentos" target="_blank">capítulo de Treinamentos</Link>.
      </p>
      {lista.map((t) => {
        const min = NIVEL_TREINO[t.id] ?? 1;
        const travado = f.nivel < min;
        const pronto = treinoConcluido(f, t.id);
        return (
          <div className={`caixa treino ${pronto ? "pronto" : ""}`} key={t.id}>
            <h3>{t.nome} {pronto && <span className="chip">Concluído</span>}</h3>
            <p>{t.resumo}</p>
            {travado && <p className="aviso-mini">Disponível a partir do nível {min}.</p>}

            {t.id === "geral" && (
              <div className="linha-edit">
                <Campo2 rotulo="Dias de treino acumulados">
                  <Passo valor={f.treinos.geralDias} min={0} max={999} rotulo="dias de treino" onChange={(v) => alterar({ treinos: { ...f.treinos, geralDias: v } })} />
                </Campo2>
                <span className="ajuda">
                  {Math.floor(f.treinos.geralDias / 15)} etapa(s) ganha(s) a cada 15 dias · faltam {15 - (f.treinos.geralDias % 15)} para a próxima.
                </span>
              </div>
            )}

            {t.etapas.length > 0 && (
              <ol className="etapas">
                {t.etapas.map((e) => {
                  const bloqueada = travado || (e.nivelMin !== undefined && f.nivel < e.nivelMin);
                  const dias = e.dias?.({ con: c.atr.con, esp: c.atr.esp });
                  return (
                    <li key={e.id} className={feitos.includes(e.id) ? "on" : ""}>
                      <label>
                        <input type="checkbox" checked={feitos.includes(e.id)} disabled={bloqueada} onChange={() => marcar(e.id)} />
                        <b>{e.nome}</b>
                      </label>
                      <p>{e.texto}</p>
                      {dias !== undefined && <p className="dias">Para você: <b>{dias} dias</b> de treino.</p>}
                      {e.teste && <p className="teste">Teste: {e.teste}</p>}
                      {e.nivelMin && f.nivel < e.nivelMin && <p className="aviso-mini">Exige o nível {e.nivelMin}.</p>}
                    </li>
                  );
                })}
              </ol>
            )}

            {t.id === "bankai-final" && pronto && (
              <Campo2 rotulo="Forma final escolhida">
                <select value={f.treinos.caminhoBankai} onChange={(e) => alterar({ treinos: { ...f.treinos, caminhoBankai: e.target.value as "" | "plena" | "verdadeira" } })}>
                  <option value="">Escolha um caminho</option>
                  <option value="plena">Bankai Plena (custo pela metade, +2 na CR, técnicas +25%)</option>
                  <option value="verdadeira">Bankai Verdadeira (nova forma, técnica de assinatura, 1 minuto)</option>
                </select>
                {f.treinos.caminhoBankai && onMontar && (
                  <button type="button" className="btn btn-paper" onClick={() => onMontar("bankai")}>
                    Montar a Bankai {f.treinos.caminhoBankai === "plena" ? "Plena" : "Verdadeira"}
                  </button>
                )}
              </Campo2>
            )}

            {(t.id === "resurreccion" || t.id === "terror") && (
              <Campo2 rotulo="Pontos de Fome (PF)">
                <Passo valor={f.treinos.pf} min={0} max={10} rotulo="Pontos de Fome" onChange={(v) => alterar({ treinos: { ...f.treinos, pf: v } })} />
              </Campo2>
            )}

            {t.id === "shikai" && (
              <div className="grade2">
                <Campo2 rotulo="Nome da Zanpakutou">
                  <input value={f.zanpakutou.nome} onChange={(e) => alterar({ zanpakutou: { ...f.zanpakutou, nome: e.target.value } })} />
                </Campo2>
                <Campo2 rotulo="Frase de liberação">
                  <input value={f.zanpakutou.frase} onChange={(e) => alterar({ zanpakutou: { ...f.zanpakutou, frase: e.target.value } })} />
                </Campo2>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

function Campo2({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="campo">
      <span>{rotulo}</span>
      {children}
    </div>
  );
}

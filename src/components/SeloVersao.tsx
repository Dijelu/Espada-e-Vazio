/* Selo do Mestre: marca a ficha de versão antiga. */
import "../estilos/versao.css";
import { fichaDesatualizada, textoSelo, VERSAO_SISTEMA_ATUAL } from "../regras/versao";

export function SeloVersao({ ficha }: { ficha: { versaoSistema?: unknown } }) {
  if (!fichaDesatualizada(ficha)) return null;
  return <span className="selo-desatualizada" title={`Ficha de versão antiga: a atual é a v${VERSAO_SISTEMA_ATUAL}. Só o dono pode atualizar.`}>{textoSelo(ficha)}</span>;
}

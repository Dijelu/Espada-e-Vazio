import { SCHRIFTS } from "../regras/schrifts";

/** Escolha da Schrift entre as do mangá, com o que ela faz fora e dentro da Vollständig. */
export function SeletorSchrift({ valor, onChange, sugerida }: { valor: string; onChange: (nome: string) => void; sugerida?: string }) {
  const atual = SCHRIFTS.find((s) => s.nome === valor);
  const antigo = valor && !atual; // texto livre salvo antes desta escolha existir
  return (
    <label className="campo">
      Schrift (opcional)
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">Nenhuma</option>
        {antigo && <option value={valor}>{valor}</option>}
        {SCHRIFTS.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
      </select>
      {atual && <small className="ajuda">{atual.base} Com a Vollständig: {atual.voll}</small>}
      {!valor && sugerida && <small className="ajuda">Sua Schrift de classe é {sugerida}.</small>}
    </label>
  );
}

import { ICONES_GAME, ICONES_PHOSPHOR } from "../content/creditos-icones";

const FONTES: [string, string, string][] = [
  ["Cinzel e Cinzel Decorative", "Natanael Gama (The Cinzel Project Authors)", "títulos do visual Quincy e nome da Vollständig"],
  ["Marcellus", "Brian J. Bonislawsky (Astigmatic)", "títulos das cartas Quincy"],
  ["Cormorant Garamond", "The Cormorant Project Authors (Christian Thalmann)", "títulos, capítulos do livro, nomes das cartas e números de destaque"],
  ["Source Sans 3", "Adobe (Paul D. Hunt)", "texto, tabelas, botões e números"],
  ["Caveat Brush", "Impallari Type", "logo, menu e efeitos de liberação"],
  ["Shippori Mincho e Shippori Mincho B1", "The Shippori Mincho Project Authors", "títulos, modo livro e selo das formas Shinigami"],
  ["Grenze Gotisch", "The Grenze Gotisch Project Authors (Omnibus-Type)", "títulos das formas e cartas Hollow"],
];

export default function Creditos() {
  return (
    <main className="page creditos">
      <h1 className="title-font">Créditos</h1>
      <p>Projeto de fã, sem fins lucrativos. Bleach é de Tite Kubo / Shueisha; este site não é oficial.</p>

      <section className="caixa">
        <h2>Imagens enviadas pelo dono do projeto</h2>
        <p>
          Os cabeçalhos da Máscara Hollow, da Resurrección e da Segunda Etapa usam duas imagens em tons de cinza, recoloridas com as cores do site: um vão de carvão com uma máscara pequena e uma silhueta de pincel com respingos e um buraco no peito.
          O buraco do peito e o rosto da máscara foram redesenhados por cima.
        </p>
        <p><b>Fan art anônima, autoria desconhecida.</b> Se o autor aparecer, este bloco será trocado pelo crédito dele.</p>
      </section>

      <section className="caixa">
        <h2>Ícones</h2>
        <p>
          Ícones de cristais, asas, lâminas, relâmpagos, crânios, máscaras, garras, correntes, sóis e eclipses: <a href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a>, por <b>Lorc</b> (lorcblog.blogspot.com) e <b>Delapouite</b> (delapouite.com), licença{" "}
          <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>. Os ícones foram <b>modificados</b>: recoloridos e sem o fundo preto original. Fonte: <a href="https://github.com/game-icons/icons" target="_blank" rel="noreferrer">github.com/game-icons/icons</a>.
        </p>
        <p>
          Ícones de interface: <a href="https://phosphoricons.com" target="_blank" rel="noreferrer">Phosphor Icons</a> (Helena Zhang e Tobias Fried), licença MIT, copyright 2023 Phosphor Icons.
        </p>
        <details>
          <summary>Lista dos ícones e dos originais</summary>
          <table className="tab-creditos">
            <thead><tr><th>Arquivo</th><th>Original</th><th>Autor</th></tr></thead>
            <tbody>
              {ICONES_GAME.map(([a, o, au]) => <tr key={a}><td>{a}</td><td>{o}</td><td>{au}</td></tr>)}
              {ICONES_PHOSPHOR.map(([a, o]) => <tr key={a}><td>{a}</td><td>{o}</td><td>Phosphor Icons (MIT)</td></tr>)}
            </tbody>
          </table>
        </details>
      </section>

      <section className="caixa">
        <h2>Fontes</h2>
        <p>Todas sob a licença SIL Open Font License 1.1. As fontes ficam neste site, sem CDN; a única exceção é a Caveat Brush, que vem do Google Fonts. Os textos das licenças estão em <code>/fontes/OFL-*.txt</code> e <code>/arte/fontes/OFL-*.txt</code>.</p>
        <table className="tab-creditos">
          <thead><tr><th>Fonte</th><th>Autoria</th><th>Uso</th></tr></thead>
          <tbody>{FONTES.map(([n, a, u]) => <tr key={n}><td>{n}</td><td>{a}</td><td>{u}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="caixa">
        <h2>Desenho próprio</h2>
        <p>Molduras, veias de reishi, pinceladas, discos, padrões, selos e brilhos dos painéis e das cartas foram desenhados para este projeto, sem arte, logo ou kanji do mangá.</p>
      </section>
    </main>
  );
}

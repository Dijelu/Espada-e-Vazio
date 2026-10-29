"""Escreve no livro as ações das Resurrecciones e das Vollständig (dados em src/regras/acoes-forma.json)."""
import json, re, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
D = json.loads((raiz / "src/regras/acoes-forma.json").read_text(encoding="utf-8"))
NOMES = {"NIV": "nível", "PROF": "proficiência", "ESP": "Espírito", "FOR": "Força", "DES": "Destreza", "CON": "Constituição", "MEN": "Mente"}

def humano(d):
    if not d: return ""
    def sub(m):
        t = re.sub(r"[A-Z]{3,4}", lambda k: NOMES.get(k.group(0), k.group(0)), m.group(1)).replace("*", "×").replace("/", "/")
        return f"({t})"
    return re.sub(r"\[([^\]]+)\]", sub, d).replace("+", " + ")

def linha(a):
    custo = f"{a['pr']} PR"
    dano = f" Dano: {humano(a['dano'])}." if a["dano"] else ""
    return f"  - **{a['nome']}** ({a['acao']}, {custo}): {a['texto']}{dano}"

# ---- Resurrección
p = raiz / "src/content/livro/03-classes.md"
s = p.read_text(encoding="utf-8")
# remove blocos gerados antes
s = re.sub(r"\n- \*\*Ações da forma:\*\*\n(?:  - .*\n?)+", "\n", s)
s = re.sub(r"### Ações Básicas da Resurrección\n.*?(?=### Criando Sua Resurrección)", "", s, flags=re.S)
nomes = {"pantera": "Pantera", "los-lobos": "Los Lobos", "santa-teresa": "Santa Teresa", "murcielago": "Murciélago", "fornicaras": "Fornicarás", "espejo-negro": "Espejo Negro"}
for mid, nome in nomes.items():
    i = s.index(f"**{nome}** (Caminho")
    j = s.index("- **Ponto fraco", i)
    k = s.index("\n", j)
    bloco = "\n- **Ações da forma:**\n" + "\n".join(linha(a) for a in D["resurreccion"]["modelos"][mid])
    s = s[:k] + bloco + s[k:]
s = s.replace("- **Técnica de assinatura:**", "- **Aparência da técnica de assinatura:**")
p.write_text(s, encoding="utf-8")

# ---- Vollständig (modelos inspirados nos Quincy do mangá/anime)
M = json.loads((raiz / "src/regras/vollstandig-modelos.json").read_text(encoding="utf-8"))
HAB = {"armadura": "Armadura de Reishi", "defesa": "Defesa", "forca": "Força Espiritual", "melhoria": "Melhoria", "olhos": "Olhos do Céu", "potencia": "Potência Espiritual", "precisao": "Precisão Espiritual", "reserva-esp": "Reserva Espiritual", "reserva-vital": "Reserva Vital", "reuniao": "Reunião Eficiente", "sentido": "Sentido Divino", "velocidade": "Velocidade", "vigor": "Vigor do Reishi"}
p = raiz / "src/content/livro/07-arsenal-quincy.md"
s = p.read_text(encoding="utf-8")
txt = """## Vollstanding Prontas

Estas são as Vollstanding prontas do livro. Cada uma segue a forma de um Quincy do mangá e do anime, com a aparência, o canalizador e os poderes que ele mostra na obra. A Schrift é outra coisa e não faz parte delas: se o seu personagem tiver uma, ela influencia o nome e os efeitos, como descrito mais adiante. Você pode usar o modelo como está ou mudar o nome e a aparência para o seu Quincy.

Todo modelo usa as mesmas habilidades passivas e escolhe quatro habilidades únicas da lista acima (Força Espiritual e Precisão Espiritual só uma vez cada), mais três ações no padrão da Bankai. Depois de escolhida, a combinação é permanente.

"""
for m in M:
    picks = ", ".join(f"{HAB[k]} ({n}x)" for k, n in m["picks"].items())
    txt += f"### {m['nome']} ({m['personagem']})\n\n"
    txt += f"{m['resumo']}\n\n"
    txt += f"- **Reishi:** {m['cor']}.\n- **Aparência:** {m['aparencia']}\n- **Canalizador:** {m['canalizador']}.\n"
    if m.get("schrift"): txt += f"- **Schrift (à parte):** {m['schrift']}.\n"
    txt += f"- **Habilidades únicas:** {picks}.\n- **Ações:**\n"
    txt += "\n".join(linha(a) for a in D["vollstandig"]["prontas"][m["id"]]) + "\n\n"
a = s.index("## Vollstanding Prontas")
b = s.index("### Criando Sua Vollstanding")
s = s[:a] + txt + s[b:]
s = s.replace("Se não quiser uma versão pronta, monte a sua em seis passos.", "Se não quiser uma das formas prontas, monte a sua em seis passos.")
p.write_text(s, encoding="utf-8")
print("ok")

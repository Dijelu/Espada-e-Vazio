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
if "**Ações da forma:**" not in s:
    nomes = {"pantera": "Pantera", "los-lobos": "Los Lobos", "santa-teresa": "Santa Teresa", "murcielago": "Murciélago", "fornicaras": "Fornicarás", "espejo-negro": "Espejo Negro"}
    for mid, nome in nomes.items():
        i = s.index(f"**{nome}** (Caminho")
        j = s.index("- **Ponto fraco", i)
        k = s.index("\n", j)
        bloco = "\n- **Ações da forma:**\n" + "\n".join(linha(a) for a in D["resurreccion"]["modelos"][mid])
        s = s[:k] + bloco + s[k:]
    base = ("\n### Ações Básicas da Resurrección\n\nEstas ações valem para qualquer Resurrección da classe, só enquanto ela estiver ativa. Os valores entre parênteses usam o seu nível e os seus atributos.\n\n"
            "- **Hueco:**\n" + "\n".join(linha(a) for a in D["resurreccion"]["base"]["hueco"]) +
            "\n- **Vazio:**\n" + "\n".join(linha(a) for a in D["resurreccion"]["base"]["vazio"]) + "\n")
    i = s.index("### Criando Sua Resurrección")
    s = s[:i] + base.lstrip("\n") + "\n" + s[i:]
    s = s.replace("**Ponto fraco, Pelagem", "**Ponto fraco, Pelagem")  # no-op, mantém estilo
    p.write_text(s, encoding="utf-8")

# ---- Vollständig
p = raiz / "src/content/livro/07-arsenal-quincy.md"
s = p.read_text(encoding="utf-8")
if "### Ações da Vollstanding" not in s:
    pront = {"conjurador": "Conjurador", "defensivo": "Defensivo", "duelista": "Duelista", "expurgador": "Expurgador", "oraculo": "Oráculo", "velocista": "Velocista", "atirador-celeste": "Atirador Celeste", "bombardeiro": "Bombardeiro", "sentinela": "Sentinela"}
    txt = ("### Ações da Vollstanding\n\nEnquanto a Vollstanding estiver ativa, você tem estas ações, além dos ataques com a arma espiritual e das Técnicas de Reishi. Os bônus de Potência Espiritual, Olhos do Céu e das outras habilidades únicas continuam valendo.\n\n"
           "**Ações de todo Quincy:**\n\n" + "\n".join(linha(a)[2:] if False else "- " + linha(a)[4:] for a in D["vollstandig"]["base"]) +
           "\n\n**Ação própria de cada modelo pronto:**\n\n" +
           "\n".join(f"- **{n}:** " + linha(D['vollstandig']['prontas'][i][0])[4:] .split(': ', 1)[0] + ": " + linha(D['vollstandig']['prontas'][i][0])[4:].split(': ', 1)[1] for i, n in pront.items()) + "\n\n")
    j = s.index("## Schirift")
    s = s[:j] + txt + s[j:]
    p.write_text(s, encoding="utf-8")
print("ok")

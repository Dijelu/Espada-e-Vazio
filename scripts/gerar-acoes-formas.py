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

# ---- Vollständig
p = raiz / "src/content/livro/07-arsenal-quincy.md"
s = p.read_text(encoding="utf-8")
s = re.sub(r"### Ações da Vollstanding\n.*?(?=## Schirift)", "", s, flags=re.S)
pront = {"conjurador": "Conjurador", "defensivo": "Defensivo", "duelista": "Duelista", "expurgador": "Expurgador", "oraculo": "Oráculo", "velocista": "Velocista", "atirador-celeste": "Atirador Celeste", "bombardeiro": "Bombardeiro", "sentinela": "Sentinela"}
txt = "### Ações das Vollstanding Prontas\n\nCada Vollstanding pronta vem com as suas próprias ações, no estilo das técnicas da Bankai: custo, ação e dano definidos. Elas só valem enquanto a Vollstanding estiver ativa. Se você criar a sua, monte as ações no mesmo padrão (uma básica de 8 a 10 PR, uma de apoio e uma final de 30 PR).\n\n"
for i, n in pront.items():
    txt += f"**{n}**\n\n" + "\n".join("- " + linha(a)[4:] for a in D["vollstandio" if False else "vollstandig"]["prontas"][i]) + "\n\n"
j = s.index("## Schirift")
s = s[:j] + txt + s[j:]
p.write_text(s, encoding="utf-8")
print("ok")

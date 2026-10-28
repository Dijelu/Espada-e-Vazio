"""Gera src/regras/essencias.json e reescreve o capítulo 4 do livro com formato uniforme."""
import json, re, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from essencias_dados import ESS

raiz = pathlib.Path(__file__).resolve().parent.parent
md = raiz / "src/content/livro/04-essencias-espirituais.md"
ORD = ["Primeira", "Segunda", "Terceira", "Quarta", "Quinta", "Sexta"]
GRUPOS = [
    ("todas", "Todas as Classes", "## Todas as Classes", "Qualquer personagem pode escolher estas essências (Hollows só as que não dependem de Kidō, Zanpakutou ou Reishi)."),
    ("shinigami", "Shinigami", "## Classes de Shinigami", "Exclusivas das classes de Shinigami."),
    ("quincy", "Quincy", "## Classes de Quincy", "Exclusivas das classes de Quincy."),
    ("hollow", "Hollow", "## Classes de Hollow", "Hueco e Vazio usam as essências desta lista e também as de **Todas as Classes** que não dependam de Kidō, Zanpakutou ou Reishi. “Hueco” e “Vazio” indicam quem pode escolher."),
    ("proibida", "Proibida", "## Essências Proibidas", None),
]

def fim(t):
    return t if t.endswith((".", "!", "?", "|")) else t + "."

def cap(s):
    return s[:1].upper() + s[1:]

saida = []
dados = []
for e in ESS:
    nome, grupo, rep, texto, etapas, nota = e
    dados.append({"nome": nome, "grupo": grupo, "repetivel": rep, "texto": texto, "etapas": [cap(fim(x)) for x in etapas], "nota": nota})
(raiz / "src/regras/essencias.json").write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")

txt = md.read_text(encoding="utf-8")
# introdução (até o fim de "Repetindo Uma Essência", cortando o lixo da extração)
corte = txt.index("Algumas essências podem ser repetidas")
fim_rep = txt.index("respectivas características.", corte) + len("respectivas características.")
intro = txt[:fim_rep].replace("Algumas essências podem ser repetidas, conforme indicado na Tabela de Essências.", "Algumas essências podem ser repetidas, conforme indicado na lista de cada grupo.")
# texto original das Proibidas (introdução e troca)
ini_p = txt.index("## Essências Proibidas")
fim_p = txt.index("| NOME | CLASSE |")
intro_proibidas = txt[ini_p:fim_p].rstrip() + "\n"

partes = [intro.rstrip() + "\n"]
for chave, rotulo, titulo, apres in GRUPOS:
    lista = [d for d in dados if d["grupo"] == chave]
    if chave == "proibida":
        partes.append(intro_proibidas)
        partes.append("Todas as Essências Proibidas podem ser escolhidas por qualquer classe.\n")
    else:
        partes.append(f"{titulo}\n\n{apres}\n")
    partes.append("| Nome | Repetível? |\n|---|---|\n" + "\n".join(f"| {d['nome']} | {'Sim' if d['repetivel'] else 'Não'} |" for d in lista) + "\n")
    for d in lista:
        b = f"### {d['nome']}\n\n{d['texto']}\n"
        if d["etapas"]:
            b += "\n" + "\n".join(f"- **{ORD[i + 1]} Etapa:** {t}" for i, t in enumerate(d["etapas"])) + "\n"
        if d["nota"]:
            b += f"\n> {d['nota']}\n"
        partes.append(b)
md.write_text("\n".join(partes), encoding="utf-8")
print(len(dados), "essências")

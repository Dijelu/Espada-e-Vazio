"""Extrai as tabelas de progressão das classes, a lista de Kidō e as técnicas de Reishi do livro."""
import json, re, pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
cls = (raiz / "src/content/livro/03-classes.md").read_text(encoding="utf-8").split("\n")
cap11 = (raiz / "src/content/livro/11-feiticos-e-tecnicas.md").read_text(encoding="utf-8").split("\n")

ORDEM = ["zanjutsu", "tokubetsu", "hakuda", "kidoshu", "kyugo", "schutze", "ritter", "hueco", "vazio"]
tabelas = []
i = 0
while i < len(cls):
    l = cls[i]
    if l.startswith("| Nível |") and ("Col. 1" in l or "Técnicas conhecidas" in l or l.startswith("| Nível | Característica")):
        j = i + 2
        linhas = []
        while j < len(cls) and cls[j].startswith("|"):
            linhas.append([c.strip() for c in cls[j].strip("|").split("|")])
            j += 1
        tabelas.append((l, linhas))
        i = j
    else:
        i += 1
assert len(tabelas) == 9, len(tabelas)

prog = {}
for cid, (cab, linhas) in zip(ORDEM, tabelas):
    d = {}
    for c in linhas:
        n = int(re.match(r"\d+", c[0]).group(0))
        if "Col. 1" in cab:
            d[n] = {"kido": int(c[2]), "rank": c[3], "caract": c[4]}
        elif "Técnicas conhecidas" in cab:
            d[n] = {"tecnicas": int(c[2]), "nivelTec": int(c[3]), "caract": c[4]}
        else:
            d[n] = {"caract": c[1]}
    if cid == "schutze":  # mesma tabela, colunas de técnicas de Reishi
        d = {n: {"tecnicas": v["kido"], "nivelTec": int(v["rank"]), "caract": v["caract"]} for n, v in d.items()}
    prog[cid] = d
(raiz / "src/regras/progressao.json").write_text(json.dumps(prog, ensure_ascii=False, indent=1), encoding="utf-8")

# Kidō
cur = None
kidos, vistos = [], set()
for l in cap11:
    s = l.strip()
    m = re.match(r"^#{2,4} (?:Rank|Classificação) (\w+)", s, re.I)
    if m:
        cur = m.group(1).upper()
    m = re.match(r"^- (\d+)[º°o]\s*(Hadou|Bakudou):\s*(.+)$", s, re.I)
    if m and cur:
        tipo, n = m.group(2).lower(), int(m.group(1))
        if (tipo, n) in vistos:
            continue
        vistos.add((tipo, n))
        nome = re.sub(r"\s*\(Bleach\)\s*", "", m.group(3)).strip()
        kidos.append({"tipo": tipo, "n": n, "nome": nome, "rank": cur})
(raiz / "src/regras/kidos.json").write_text(json.dumps(kidos, ensure_ascii=False), encoding="utf-8")

# Técnicas de Reishi
ini = next(i for i, l in enumerate(cap11) if l.startswith("### Lista de Técnicas de Reishi"))
niveis = {"Primeiro": 1, "Segundo": 2, "Terceiro": 3, "Quarto": 4, "Quinto": 5}
tec, cn, nlista = [], 0, 0
for l in cap11[ini + 1 :]:
    m = re.match(r"^### (\w+) Nível", l)
    if m:
        cn, nlista = niveis.get(m.group(1), 0), 0
        continue
    s_ = l.strip()
    if not s_:
        continue
    m = re.match(r"^- (.+)$", s_)
    if m and cn and not m.group(1).startswith("*") and len(m.group(1)) < 45 and not any(t["nome"] == m.group(1) for t in tec):
        tec.append({"nome": re.sub(r"\s*\(Bleach\)\s*", "", m.group(1)).strip(), "nivel": cn})
        nlista += 1
    elif re.match(r"^## ", s_):
        break
(raiz / "src/regras/tecnicas-reishi.json").write_text(json.dumps(tec, ensure_ascii=False), encoding="utf-8")
print({k: len(v) for k, v in prog.items()}, len(kidos), len(tec))
print(prog["zanjutsu"][5], prog["schutze"][3], prog["hueco"][3])

"""Extrai os talentos de cada classe do capítulo 3 e grava src/regras/talentos.json."""
import json, re, unicodedata, pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
linhas = (raiz / "src/content/livro/03-classes.md").read_text(encoding="utf-8").split("\n")

def slug(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

# (classe, título da seção, a partir de qual título procurar, títulos de seções extras logo depois da principal)
# O Zanjutsu tem 11 talentos escritos sob "Aprimoramento da Essência", fora da lista principal.
SECOES = [
    ("zanjutsu", r"^### Talentos de Zanjutsu", None, [r"^### Aprimoramento da Essência"]),
    ("tokubetsu", r"^### Talentos de Tokubetsu"),
    ("hakuda", r"^### Talentos de Hakuda"),
    ("kidoshu", r"^### Talentos de Kidōshū"),
    ("kyugo", r"^### Talentos de Kyūgo"),
    ("schutze", r"^### Talento de Schütze"),
    ("ritter", r"^### Talentos de Ritter"),
    ("hueco", r"^### Talentos de Hueco$", r"^## Talentos Hollow"),
    ("vazio", r"^### Talentos de Vazio$", r"^## Talentos Hollow"),
]

# ajustes feitos à mão no JSON que a extração deve manter
ID_FIXO = {("hueco", "bala"): "bala-hollow"}
AJUSTES = {
    ("schutze", "sequencia-fatal"): {"req": "12° nível de Schütze."},
}
# (classe, id) -> id depois do qual o talento fica na lista
MOVER: dict = {}

def fim_secao(i, nivel):
    for j in range(i + 1, len(linhas)):
        m = re.match(r"^(#{1,6}) ", linhas[j])
        if m and len(m.group(1)) <= nivel:
            return j
    return len(linhas)

def limpar(t):
    t = re.sub(r"\*\*", "", t)
    return re.sub(r"\s+", " ", t).strip()

def itens(ini, fim):
    out, atual, grupo = [], None, ""
    for k in range(ini, fim):
        l = linhas[k].rstrip()
        mg = re.match(r"^#### (.+)", l)
        if mg:
            grupo = limpar(mg.group(1))
            atual = None
            continue
        mb = re.match(r"^- (.*)", l)
        sem = re.match(r"^([A-ZÀ-Ú][^:\n]{2,40}):\s+\S", l)
        if mb:
            atual = {"bruto": mb.group(1), "grupo": grupo}
            out.append(atual)
        elif sem and not l.startswith("Pré-Requisito") and not l.startswith("Pré-req"):
            atual = {"bruto": l, "grupo": grupo}
            out.append(atual)
        elif atual is not None and l.strip():
            atual["bruto"] += " " + l.strip()
    return out

def interpretar(it):
    b = it["bruto"]
    m = re.match(r"^\*\*([^*]+?)\*\*\s*(?:\(([^)]*)\))?\s*[:.]?\s*(.*)$", b)
    if m:
        nome, par, resto = m.group(1).strip().rstrip(":."), m.group(2) or "", m.group(3)
    else:
        m2 = re.match(r"^([^:]{2,60}):\s*(.*)$", b)
        if not m2:
            return None
        nome, par, resto = m2.group(1).strip(), "", m2.group(2)
    nome = limpar(nome).rstrip(".")
    resto = limpar(resto)
    req = par
    pm = re.search(r"Pré-Requisito[s]?:\s*(.*)$", resto)
    if pm:
        req = (req + " " + pm.group(1)).strip()
        resto = resto[: pm.start()].strip()
    nm = re.search(r"(\d+)[º°]\s*n[ií]vel", req) or re.search(r"(\d+)[º°]\s*n[ií]vel", it["bruto"][:140])
    return {"id": slug(nome), "nome": nome, "texto": resto, "nivel": int(nm.group(1)) if nm else 1, "req": limpar(req), "grupo": it["grupo"]}

res = {}
for sec in SECOES:
    cid, pad = sec[0], sec[1]
    ancora = sec[2] if len(sec) > 2 else None
    # Hueco/Vazio têm um resumo da classe com o mesmo título antes da lista completa em "Talentos Hollow"
    desde = next(i for i, l in enumerate(linhas) if re.match(ancora, l)) if ancora else 0
    extras = sec[3] if len(sec) > 3 else []
    ini = next(i for i, l in enumerate(linhas) if i >= desde and re.match(pad, l))
    nivel = len(re.match(r"^(#+)", linhas[ini]).group(1))
    fim = fim_secao(ini, nivel)
    faixas = [(ini + 1, fim)]
    for pe in extras:
        ie = next(i for i, l in enumerate(linhas) if i >= fim and re.match(pe, l))
        faixas.append((ie + 1, fim_secao(ie, len(re.match(r"^(#+)", linhas[ie]).group(1)))))
    lista, vistos = [], set()
    for it in [x for a, b in faixas for x in itens(a, b)]:
        d = interpretar(it)
        if not d or d["id"] in vistos or len(d["nome"]) < 3:
            continue
        # ignora linhas que são só texto explicativo
        if d["nome"].lower().startswith(("a partir", "você pode", "você escolhe", "um talento", "pré")):
            continue
        vistos.add(d["id"])
        d["id"] = ID_FIXO.get((cid, d["id"]), d["id"])
        lista.append(d)
    res[cid] = lista

# talentos de requisito: mantém só os nomes de talentos conhecidos da própria classe
for cid, lista in res.items():
    nomes = {t["nome"].lower(): t["id"] for t in lista}
    for t in lista:
        pre = [i for n, i in nomes.items() if n != t["nome"].lower() and n in t["req"].lower()]
        t["pre"] = pre
        # Hueco/Vazio escrevem "(7º nível; requer X)": o requisito de talento já fica em "pre"
        t["req"] = re.sub(r";\s*requer .*$", "", t["req"])
        t.update(AJUSTES.get((cid, t["id"]), {}))
    for (c, i), depois in MOVER.items():
        if c == cid and any(t["id"] == i for t in lista) and any(t["id"] == depois for t in lista):
            t = next(t for t in lista if t["id"] == i)
            lista.remove(t)
            lista.insert(next(k for k, x in enumerate(lista) if x["id"] == depois) + 1, t)

saida = raiz / "src/regras/talentos.json"
saida.write_text(json.dumps(res, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
for k, v in res.items():
    print(k, len(v))

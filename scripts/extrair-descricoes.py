"""Acrescenta descrições curtas (para os balões de dica) a Kidō, Técnicas de Reishi e subclasses; extrai as Shikais do livro."""
import json, re, pathlib, unicodedata
raiz = pathlib.Path(__file__).resolve().parent.parent
livro = raiz / "src/content/livro"

def norm(s):
    return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower().strip()

def limpa(t, n=520):
    t = re.sub(r"\s+", " ", t).strip()
    return t if len(t) <= n else t[: n - 1].rsplit(" ", 1)[0] + "…"

# ---------- Kidō
txt = (livro / "11-feiticos-e-tecnicas.md").read_text(encoding="utf-8")
blocos = {}
for m in re.finditer(r"(?m)^### (?:(\d+)\s*·\s*)?(Hadou|Bakudou) no [^:\n]*:\s*(.+)$", txt):
    fim = txt.find("\n### ", m.end())
    blocos[(norm(m.group(2)), norm(m.group(3)))] = txt[m.end(): fim if fim > 0 else len(txt)]
kidos = json.loads((raiz / "src/regras/kidos.json").read_text(encoding="utf-8"))
achou = 0
for k in kidos:
    b = blocos.get((norm(k["tipo"]), norm(k["nome"])))
    meta = []
    texto = ""
    if b:
        for campo in ("Requisito", "Alcance", "Velocidade"):
            mm = re.search(rf"\*\*{campo}:\*\*\s*(.+)", b)
            if mm: meta.append(f"{campo}: {mm.group(1).strip()}")
        rr = re.search(r"\*\*Reiatsu:\*\*[^\d]*(\d+)", b)
        if rr: meta.append(f"Custo: {rr.group(1)} PR")
        paras = [p.strip() for p in b.split("\n\n") if p.strip() and not p.strip().startswith(("-", "|", "*", "#"))]
        texto = limpa(paras[0]) if paras else ""
        achou += 1
    k["texto"] = texto
    k["meta"] = " · ".join(meta)
(raiz / "src/regras/kidos.json").write_text(json.dumps(kidos, ensure_ascii=False, indent=1), encoding="utf-8")
print("kidos com texto:", achou, "de", len(kidos))

# ---------- Técnicas de Reishi
tec = json.loads((raiz / "src/regras/tecnicas-reishi.json").read_text(encoding="utf-8"))
n2 = 0
for t in tec:
    nome = re.sub(r"\s*\(Bleach\)", "", t["nome"])
    mm = re.search(rf"(?m)^#{{2,4}}\s*{re.escape(nome)}\s*$", txt, re.I)
    if not mm:
        mm = re.search(rf"\b{re.escape(nome.upper())}\b", txt)
    if mm:
        corpo = txt[mm.end(): mm.end() + 1800]
        paras = [p.strip() for p in corpo.split("\n\n") if len(p.strip()) > 80 and not p.strip().startswith(("-", "|", "#"))]
        t["texto"] = limpa(paras[0]) if paras else ""
        n2 += bool(t["texto"])
    else:
        t["texto"] = ""
(raiz / "src/regras/tecnicas-reishi.json").write_text(json.dumps(tec, ensure_ascii=False, indent=1), encoding="utf-8")
print("técnicas com texto:", n2, "de", len(tec))

# ---------- Subclasses
cl = (livro / "03-classes.md").read_text(encoding="utf-8")
nomes = ["Forja Espiritual", "Ryoka", "Colosso", "Caminho do Shunko", "Caminho Híbrido", "Caminho do Guerreiro", "Caminho do Punho", "Mago", "Sacerdote", "Lâmina Espiritual", "Bibliotecário", "Curandeiro", "Ajudante", "Médico de Combate", "Arqueiro", "Sniper", "Pistoleiro", "Seele Schneider", "Eisenritter", "Ätherklinge", "Glotonería", "Estallido", "Sonido", "Ponzoña", "Ilusión", "Reflejo"]
sub = {}
for n in nomes:
    mm = None
    for pat in (rf"(?m)^#{{2,5}}\s*(?:Caminho\s+)?{re.escape(n)}\s*$", rf"(?m)^#{{2,5}}\s*.*{re.escape(n)}.*$"):
        mm = re.search(pat, cl, re.I)
        if mm: break
    if not mm:
        sub[n] = ""
        continue
    corpo = cl[mm.end(): mm.end() + 2500]
    paras = [p.strip() for p in corpo.split("\n\n") if len(p.strip()) > 60 and not p.strip().startswith(("|", "#"))]
    sub[n] = limpa(paras[0], 380) if paras else ""
(raiz / "src/regras/subclasses.json").write_text(json.dumps(sub, ensure_ascii=False, indent=1), encoding="utf-8")
print("subclasses com texto:", sum(1 for v in sub.values() if v), "de", len(sub))

# ---------- Shikais
z = (livro / "05-zanpakutous.md").read_text(encoding="utf-8")
z = z[: z.index("## Criando Sua Zanpakutou")]
saida, vistos = [], set()
for p in re.split(r"(?m)^## ", z)[1:]:
    nome, _, corpo = p.partition("\n")
    nome = nome.strip()
    m = re.search(r"(?m)^### Shikai\s*$", corpo)
    if not m or nome in vistos or nome == "Zanpakutou":
        continue
    vistos.add(nome)
    cat = re.search(r"Categoria:[^.]*?tipo\s+(\w+)", corpo)
    resto = corpo[m.end():]
    b = re.search(r"(?m)^### Bankai\s*$", resto)
    if b: resto = resto[: b.start()]
    acoes = []
    for h in re.split(r"(?m)^### ", resto)[1:]:
        titulo, _, c = h.partition("\n")
        c = c.strip()
        if not c: continue
        low = c.lower()
        pr = re.search(r"(\d+)\s*(?:pontos?|pr)\s+de\s+reiatsu", low)
        acao = "Ação bônus" if "ação bônus" in low else "Reação" if "reação" in low else "Ação" if re.search(r"\bação\b", low) else "Habilidade"
        dano = re.search(r"\d+d\d+", c)
        acoes.append({"id": re.sub(r"[^a-z0-9]+", "-", titulo.lower()).strip("-"), "nome": titulo.replace("Técnica:", "").strip(), "acao": acao, "pr": int(pr.group(1)) if pr else 0, "dano": dano.group(0) if dano else "", "texto": c[:900]})
    intro = resto.split("\n###")[0].strip()
    custo = re.search(r"(\d+)\s*pontos de reiatsu", intro, re.I)
    saida.append({"id": re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-"), "nome": nome, "categoria": (cat.group(1) if cat else "").capitalize(), "resumo": limpa(intro, 600), "custo": int(custo.group(1)) if custo and 1 <= int(custo.group(1)) <= 12 else 0, "acoes": acoes})
(raiz / "src/regras/shikais.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
print("shikais:", len(saida), [(s["nome"], s["categoria"], s["custo"]) for s in saida][:8])

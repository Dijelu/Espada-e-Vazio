"""Extrai das Zanpakutous prontas do livro o texto da Bankai (para escolher um modelo na ficha)."""
import json, re, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
txt = (raiz / "src/content/livro/05-zanpakutous.md").read_text(encoding="utf-8")
fim = txt.index("## Criando Sua Zanpakutou")
txt = txt[:fim]
partes = re.split(r"(?m)^## ", txt)[1:]
AJUSTES = {
    ("Zangetsu", "Getsuga Tenshou Negro"): {"acao": "Ação"},
    ("Suzumebachi", "Míssil"): {"acao": "Ação", "pr": 0},
    ("Katen Kyokotsu", "3. Dangyo no Fuchi"): {"acao": "Habilidade", "pr": 0},
    ("Senbonzakura", "Comando Gestual"): {"acao": "Habilidade"},
}
vistos = set()
saida = []
for p in partes:
    nome, _, corpo = p.partition("\n")
    nome = nome.strip()
    m = re.search(r"(?m)^### Bankai\s*$", corpo)
    if not m or nome in vistos or nome == "Zanpakutou":
        continue
    vistos.add(nome)
    bloco = corpo[m.end():].strip()
    # corta lixo de seções vizinhas: usa tudo até o fim da seção
    paragrafos = [x.strip() for x in bloco.split("\n\n") if x.strip()]
    resumo = paragrafos[0] if paragrafos else ""
    custo = re.search(r"(\d+)\s*(?:Pontos|pontos) de [Rr]eiatsu", bloco)
    acoes = []
    for h in re.split(r"(?m)^### ", bloco)[1:]:
        titulo, _, corpo_h = h.partition("\n")
        corpo_h = corpo_h.strip()
        if not corpo_h:
            continue
        low = corpo_h.lower()
        pr = re.search(r"(\d+)\s*(?:pontos?|pr)\s+de\s+reiatsu", low)
        acao = "Ação bônus" if "ação bônus" in low else "Reação" if "reação" in low else "Ação" if "com uma ação" in low or "como uma ação" in low or re.search(r"\bação\b", low) else "Habilidade"
        dano = re.search(r"\d+d\d+", corpo_h)
        acoes.append({
            "id": re.sub(r"[^a-z0-9]+", "-", titulo.lower()).strip("-"),
            "nome": titulo.replace("Técnica:", "").strip(),
            "acao": acao,
            "pr": int(pr.group(1)) if pr else 0,
            "dano": dano.group(0) if dano else "",
            "texto": corpo_h[:900],
        })
    for a in acoes:
        a.update(AJUSTES.get((nome, a["nome"]), {}))
    saida.append({
        "id": re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-"),
        "nome": nome,
        "resumo": resumo[:700],
        "texto": bloco[:6000],
        "acoes": acoes,
        "custo": int(custo.group(1)) if custo and 30 <= int(custo.group(1)) <= 100 else 0,
    })
(raiz / "src/regras/bankais.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(saida), [s["nome"] for s in saida])

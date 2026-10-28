"""Extrai das Zanpakutous prontas do livro o texto da Bankai (para escolher um modelo na ficha)."""
import json, re, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
txt = (raiz / "src/content/livro/05-zanpakutous.md").read_text(encoding="utf-8")
fim = txt.index("## Criando Sua Zanpakutou")
txt = txt[:fim]
partes = re.split(r"(?m)^## ", txt)[1:]
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
    saida.append({
        "id": re.sub(r"[^a-z0-9]+", "-", nome.lower()).strip("-"),
        "nome": nome,
        "resumo": resumo[:700],
        "texto": bloco[:6000],
        "custo": int(custo.group(1)) if custo and 30 <= int(custo.group(1)) <= 100 else 0,
    })
(raiz / "src/regras/bankais.json").write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(saida), [s["nome"] for s in saida])

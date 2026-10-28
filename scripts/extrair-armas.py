"""Extrai as tabelas de armas Quincy do capítulo 7 para src/regras/armas.json."""
import json, re, pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
linhas = (raiz / "src/content/livro/07-arsenal-quincy.md").read_text(encoding="utf-8").split("\n")
corpo = next(l for l in linhas if "ARMAS CORPO A CORPO Nome Dano" in l)
dist = next(l for l in linhas if l.startswith("ARMAS A DISTÂNCIA ARMAS A DISTÂNCIA Nome"))

ATR = r"(Destreza ou Força|Força, Destreza|Destreza|Força)"
def itens(texto, ranged):
    out = []
    pad = (r"([A-ZÀ-Ú][A-Za-zÀ-ÿ ]+?) (\d+d\d+) ((?:cortante|perfurante|concussão)(?: ou (?:cortante|perfurante|concussão))?) (\d+) - x(\d) (.*?) "
           + (r"(\d+m / \d+ sqm) " if ranged else "") + ATR + r" (\d)")
    for m in re.finditer(pad, texto):
        g = m.groups()
        if ranged:
            nome, dano, tipo, crit, mult, props, alc, atr, peso = g
        else:
            nome, dano, tipo, crit, mult, props, atr, peso = g
            alc = ""
        out.append({"nome": nome.strip(), "dano": dano, "tipo": tipo, "crit": int(crit), "mult": int(mult),
                    "props": "" if props.strip() == "-" else props.strip(), "alcance": alc, "atr": atr, "peso": int(peso)})
    return out

res = {"leves": [], "pesadas": [], "medievais": [], "modernas": []}
a, b = corpo.split("PESADAS", 1)
res["leves"] = itens(a.split("LEVES", 1)[1], False)
res["pesadas"] = itens(b, False)
a, b = dist.split("MODERNAS", 1)
res["medievais"] = itens(a.split("MEDIEVAIS", 1)[1], True)
res["modernas"] = itens(b, True)
(raiz / "src/regras/armas.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
print({k: len(v) for k, v in res.items()})
print([x["nome"] for x in res["leves"]][:8], res["modernas"][0])

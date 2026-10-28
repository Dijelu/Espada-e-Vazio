"""Detecta tabelas desenhadas só com texto (sem linhas) e as reconstrói pela posição das palavras."""
import re
from collections import Counter

GAP_CELULA = 9.0   # pontos entre palavras para separar células
TOL_LINHA = 2.6


def _linhas(ws):
    ws = sorted(ws, key=lambda w: (round(w["top"]), w["x0"]))
    linhas = []
    for w in ws:
        for l in linhas:
            if abs(l["top"] - w["top"]) <= TOL_LINHA:
                l["ws"].append(w)
                break
        else:
            linhas.append({"top": w["top"], "ws": [w]})
    for l in linhas:
        l["ws"].sort(key=lambda w: w["x0"])
        cel = [[l["ws"][0]]]
        for w in l["ws"][1:]:
            if w["x0"] - cel[-1][-1]["x1"] > GAP_CELULA:
                cel.append([w])
            else:
                cel[-1].append(w)
        l["cel"] = cel
        l["x0"] = l["ws"][0]["x0"]
        l["x1"] = l["ws"][-1]["x1"]
    linhas.sort(key=lambda l: l["top"])
    return linhas


def _fam(w):
    return re.sub(r"^[A-Z]{6}\+", "", w["fontname"])


def detectar(pg, meio=297.6):
    """Retorna lista de tabelas: dict(md, palavras(Counter), rows)."""
    ws = pg.extract_words(extra_attrs=["fontname", "size"])
    ws = [w for w in ws if w["top"] > 35 and w["bottom"] < 805]
    res = []
    # analisa separadamente: tela inteira, coluna esquerda, coluna direita
    faixas = [(0, 1000)]
    for x0, x1 in [(0, meio + 2), (meio - 2, 1000)]:
        faixas.append((x0, x1))
    usados = set()
    for fx0, fx1 in faixas:
        sub = [w for w in ws if w["x0"] >= fx0 - 1 and w["x1"] <= fx1 + 1 and id(w) not in usados]
        if len(sub) < 8:
            continue
        linhas = _linhas(sub)
        multi = [len(l["cel"]) >= 2 for l in linhas]
        i = 0
        while i < len(linhas):
            if not multi[i]:
                i += 1
                continue
            j = i
            ult = i
            while j < len(linhas):
                if j > ult + 2:
                    break
                if multi[j] or (j > i and j - ult <= 1 and len(linhas[j]["cel"]) == 1 and linhas[j]["top"] - linhas[ult]["top"] < 26):
                    if multi[j]:
                        ult = j
                    j += 1
                else:
                    j += 1
            bloco = [l for l in linhas[i:ult + 1]]
            nmulti = sum(len(l["cel"]) >= 2 for l in bloco)
            if nmulti >= 3 and _plausivel(bloco):
                tab = _montar(bloco)
                if tab:
                    for l in bloco:
                        for w in l["ws"]:
                            usados.add(id(w))
                    res.append(tab)
            i = ult + 1
    return res


def _exib(w):
    return _fam(w).startswith(("JasonBrush", "BRUSHIA", "HyperBrush", "Arrancar", "PWBrusheez"))


def _plausivel(bloco):
    cab = bloco[0]["ws"]
    if sum(_exib(w) for w in cab) / len(cab) < 0.6 or max(w["size"] for w in cab) > 14:
        return False
    if len(bloco[0]["cel"]) < 2:
        return False
    # precisa de alguma fonte de exibição ou números nas células
    fam = Counter(_fam(w) for l in bloco for w in l["ws"])
    exib = sum(c for f, c in fam.items() if f.startswith(("JasonBrush", "BRUSHIA", "HyperBrush", "Arrancar", "PWBrusheez")))
    total = sum(fam.values())
    if exib / total < 0.08:
        return False
    # colunas alinhadas: x0 das células devem se repetir
    xs = Counter(round(c[0]["x0"] / 6) for l in bloco for c in l["cel"])
    return sum(1 for v in xs.values() if v >= 3) >= 2


def _montar(bloco):
    # colunas por agrupamento do x0 das células
    xs = sorted(c[0]["x0"] for l in bloco for c in l["cel"])
    cols = []
    for x in xs:
        if cols and x - cols[-1][-1] <= 14:
            cols[-1].append(x)
        else:
            cols.append([x])
    centros = [sum(c) / len(c) for c in cols]
    # descarta colunas raras (só 1 célula)
    cont = [sum(1 for l in bloco for c in l["cel"] if min(range(len(centros)), key=lambda k: abs(centros[k] - c[0]["x0"])) == k) for k in range(len(centros))]
    manter = [k for k, n in enumerate(cont) if n >= 2]
    if len(manter) < 2:
        return None
    centros = [centros[k] for k in manter]
    linhas_md = []
    pal = Counter()
    for l in bloco:
        linha = [""] * len(centros)
        for c in l["cel"]:
            k = min(range(len(centros)), key=lambda k: abs(centros[k] - c[0]["x0"]))
            txt = " ".join(w["text"] for w in c)
            linha[k] = (linha[k] + " " + txt).strip()
            for w in c:
                pal[w["text"]] += 1
        linhas_md.append(linha)
    # junta linhas de continuação (uma célula só, na 1ª coluna vazia) à anterior
    saida = []
    for linha in linhas_md:
        ocup = sum(bool(c) for c in linha)
        if ocup == 1 and saida and not linha[0]:
            k = next(k for k, c in enumerate(linha) if c)
            saida[-1][k] = (saida[-1][k] + " " + linha[k]).strip()
        else:
            saida.append(linha)
    n = len(centros)
    celulas = [c for linha in saida for c in linha if c]
    if not celulas or sum(len(c.split()) for c in celulas) / len(celulas) > 6:
        return None
    cab = saida[0]
    md = ["| " + " | ".join(c.replace("|", "/") for c in cab) + " |", "|" + "---|" * n]
    for linha in saida[1:]:
        md.append("| " + " | ".join(c.replace("|", "/") for c in linha) + " |")
    return {"md": "\n".join(md), "pal": pal, "top": bloco[0]["top"]}

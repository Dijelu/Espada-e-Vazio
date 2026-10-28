#!/usr/bin/env python3
"""Limpeza pós-conversão dos capítulos (idempotente)."""
import re, glob

SMALL = {"de","da","do","das","dos","e","em","a","o","as","os","com","para","por","no","na","ao","à"}

def titulo(s):
    out = []
    for i, w in enumerate(s.lower().split()):
        out.append(w if (i and w in SMALL) else w[:1].upper() + w[1:])
    return " ".join(out)

def so_maiuscula(s):
    letras = re.sub(r"[^A-Za-zÀ-ÿ]", "", s)
    return len(letras) >= 3 and letras == letras.upper()

for f in sorted(glob.glob("src/content/livro/*.md")):
    linhas = open(f, encoding="utf-8").read().split("\n")
    # 1) tira marcadores soltos e rabichos de "•"
    tmp = []
    for l in linhas:
        if re.fullmatch(r"[\s•·]*", l) and l.strip():
            continue
        l = re.sub(r"(\s*[•·])+\s*$", "", l)
        tmp.append(l)
    linhas = tmp
    # 2) promove títulos soltos
    out = []
    for i, l in enumerate(linhas):
        ant = linhas[i - 1] if i else ""
        prox = linhas[i + 1] if i + 1 < len(linhas) else ""
        t = l.strip()
        solto = (not ant.strip()) and (not prox.strip()) and t
        if solto and not t.startswith(("#", "-", "*", "|", ">")) and not re.search(r"[.,;:!?)”\"]$", t) and not re.search(r"\d", t):
            palavras = t.split()
            if so_maiuscula(t) and 1 <= len(palavras) <= 6:
                out.append("## " + titulo(t)); continue
            if 2 <= len(palavras) <= 6 and not t[0].isdigit():
                out.append("### " + titulo(t)); continue
        out.append(l)
    txt = re.sub(r"\n{3,}", "\n\n", "\n".join(out))
    open(f, "w", encoding="utf-8").write(txt)
print("ok")

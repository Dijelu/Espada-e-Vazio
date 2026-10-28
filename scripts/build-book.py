#!/usr/bin/env python3
"""Converte o PDF do livro em arquivos Markdown (um por capítulo).

Uso: python3 scripts/build-book.py caminho/do/livro.pdf
Requer o utilitário pdftotext (poppler).
"""
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

PDF = sys.argv[1] if len(sys.argv) > 1 else "livro.pdf"
OUT = Path(__file__).resolve().parent.parent / "src" / "content"
(OUT / "livro").mkdir(parents=True, exist_ok=True)

# (slug, número, título, descrição, arte, primeira página, última página)
CAPS = [
    ("introducao", 0, "Introdução", "O que é Espada & vazio e como jogar", "intro", 10, 21),
    ("criacao-de-personagem", 1, "Criação de Personagem", "Do conceito à ficha pronta", "c01", 22, 28),
    ("origem", 2, "Origem", "Shinigami, Quincy, Hollow, Humano", "c02", 29, 38),
    ("classes", 3, "Classes", "Zanjutsu, Hakuda, Kidō, Kyūgo…", "c03", 39, 82),
    ("essencias-espirituais", 4, "Essências Espirituais", "Poderes e reiryoku", "c04", 83, 97),
    ("zanpakutous", 5, "Zanpakutōs", "Shikai, Bankai e treinamento", "c05", 98, 137),
    ("seireitei", 6, "Seireitei", "O mundo e suas cortes", "c06", 138, 150),
    ("arsenal-quincy", 7, "Arsenal Quincy", "Ritter, Schütze, Vollständig", "c07", 151, 164),
    ("atributos-e-pericias", 8, "Atributos e Perícias", "Testes, CR e proficiência", "c08", 165, 171),
    ("treinamentos", 9, "Treinamentos", "Evoluir além do nível", "c09", 172, 178),
    ("condicoes", 10, "Condições", "Estados e efeitos", "c10", 179, 181),
    ("feiticos-e-tecnicas", 11, "Feitiços e Técnicas", "Lista completa", "c11", 182, 246),
    ("jogando", 12, "Jogando", "Turnos, combate e descanso", "c12", 247, 267),
    ("mestre", 13, "Mestre", "Duelos, NPCs e mesas", "c13", 268, 273),
    ("ameacas", 14, "Ameaças", "Hollows, Arrancar e chefes", "c14", 274, 302),
]


def titulo(s: str) -> str:
    miúdas = {"de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os", "para", "com", "no", "na"}
    palavras = s.lower().split()
    out = []
    for i, p in enumerate(palavras):
        out.append(p if (i > 0 and p in miúdas) else p[:1].upper() + p[1:])
    return " ".join(out)


def eh_titulo(linha: str) -> bool:
    letras = [c for c in linha if c.isalpha()]
    if len(letras) < 4 or len(linha) > 70:
        return False
    if re.search(r"\d", linha) and len(letras) < 8:
        return False
    return linha == linha.upper()


def converter(texto: str, titulo_cap: str) -> str:
    linhas = [l.rstrip() for l in texto.replace("\f", "\n").split("\n")]
    # remove numeração de página e o cabeçalho "CAPÍTULO N: ..."
    linhas = [l for l in linhas if not re.fullmatch(r"\s*\d{1,3}\s*", l)]
    linhas = [l for l in linhas if not re.match(r"^\s*CAP[ÍI]TULO\s+\d+\s*:", l, re.I)]
    blocos, atual = [], []
    for l in linhas:
        if l.strip() == "":
            if atual:
                blocos.append(atual)
                atual = []
        else:
            atual.append(l.strip())
    if atual:
        blocos.append(atual)

    saida = []
    i = 0
    while i < len(blocos):
        b = blocos[i]
        # letra capitular sozinha: "S" + "er o Mestre..."
        if len(b) == 1 and len(b[0]) == 1 and b[0].isalpha() and i + 1 < len(blocos):
            prox = blocos[i + 1]
            prox[0] = b[0] + prox[0]
            i += 1
            continue
        if len(b) == 1 and eh_titulo(b[0]):
            saida.append("## " + titulo(b[0]))
        else:
            largura = max(len(l) for l in b)
            par = ""
            anterior = ""
            for l in b:
                if not par:
                    par = l
                elif par.endswith("-") and l[:1].islower():
                    par = par[:-1] + l
                elif (
                    re.search(r"[.!?:”\")]$", anterior)
                    and len(anterior) < largura * 0.8
                    and l[:1].isupper()
                ):
                    saida.append(par)
                    par = l
                else:
                    par = par + " " + l
                anterior = l
            saida.append(par)
        i += 1
    return f"# {titulo_cap}\n\n" + "\n\n".join(saida) + "\n"


def pdftotext(p1: int, p2: int) -> str:
    return subprocess.run(
        ["pdftotext", "-f", str(p1), "-l", str(p2), PDF, "-"],
        capture_output=True, text=True, check=True,
    ).stdout


meta = []
for slug, no, tit, desc, arte, p1, p2 in CAPS:
    md = converter(pdftotext(p1, p2), tit)
    nome = f"{no:02d}-{slug}.md"
    (OUT / "livro" / nome).write_text(md, encoding="utf-8")
    meta.append({"slug": slug, "no": no, "title": tit, "desc": desc, "art": arte, "file": nome})

meta.append({"slug": "homenagens-e-fontes", "no": 15, "title": "Homenagens e Fontes",
             "desc": "Créditos, inspirações e referências", "art": "c06", "file": "15-homenagens-e-fontes.md"})
(OUT / "chapters.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(meta), "capítulos")

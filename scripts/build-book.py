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

if "--forcar" not in sys.argv:
    sys.exit("Os capítulos em src/content/livro já foram editados à mão. Rodar este script sobrescreve tudo. Use --forcar só se for esse o objetivo.")
sys.argv = [a for a in sys.argv if a != "--forcar"]
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


import pdfplumber
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import tabelas

DISP = ("HyperBrush", "JasonBrush", "BRUSHIA", "Arrancar", "PWBrusheez")
IGNORAR = {"não oficial", "nao oficial"}
CAMPOS = ("Encantamento:", "Requisito:", "Jogada de Ataque:", "Alcance:", "Velocidade:", "Reiatsu:")
FIM_FRASE = re.compile(r"[.!?:”\")]$")
INICIO_FRASE = "“\"("
DOBRO = re.compile(r"\b[A-Za-zÀ-ÿ]{4,}\b")
NIVEL = re.compile(r"^\d{1,2}°\s+\+\d")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip().lower()


def familia(w) -> str:
    return re.sub(r"^[A-Z]{6}\+", "", w["fontname"])


def exibicao(pg):
    """Linhas em fontes de exibição: (texto, família, tamanho)."""
    ws = pg.extract_words(use_text_flow=True, extra_attrs=["fontname", "size"])
    out, cur = [], []
    for w in ws:
        if familia(w).startswith(DISP):
            if cur and abs(cur[-1]["top"] - w["top"]) <= 3 and cur[-1]["fontname"] == w["fontname"]:
                cur.append(w)
            else:
                if cur:
                    out.append(cur)
                cur = [w]
        else:
            if cur:
                out.append(cur)
                cur = []
    if cur:
        out.append(cur)
    return [(" ".join(x["text"] for x in l), familia(l[0]), round(l[0]["size"])) for l in out]


def pagina(pdf, n: int):
    """Linhas da página n na ordem de leitura, como (tipo, texto)."""
    raw = subprocess.run(
        ["pdftotext", "-raw", "-f", str(n), "-l", str(n), PDF, "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    marc = {}
    for texto, fam, tam in exibicao(pdf.pages[n - 1]):
        k = norm(texto)
        if k in IGNORAR or len(k) < 2:
            continue
        if fam.startswith("BRUSHIA") and tam >= 15:
            marc[k] = "h1"
        elif fam.startswith(("HyperBrush", "JasonBrush")) and tam in (12, 14) and not re.fullmatch(r"\d+", k):
            marc[k] = "h2"
        elif fam.startswith("Arrancar") and tam == 14 and re.fullmatch(r"\d{1,3}", k):
            marc[k] = "num"
        elif fam.startswith("JasonBrush") and tam == 11:
            marc[k] = "banner"
    def limpa(l):
        l = l.strip().replace("\u200b", "")
        return DOBRO.sub(lambda m: m.group(0)[::2] if m.group(0)[::2] * 2 == m.group(0) else m.group(0), l)

    tabs = tabelas.detectar(pdf.pages[n - 1])
    for t in tabs:
        t["pal"] = Counter({limpa(k): v for k, v in t["pal"].items()})
    linhas = []
    for l in raw.replace("\f", "").split("\n"):
        l = limpa(l)
        if not l or re.match(r"^CAP[ÍI]TULO\s+\d+\s*:", l, re.I):
            continue
        linhas.append(l)
    if linhas and re.fullmatch(r"\d{1,3}", linhas[-1]) and marc.get(linhas[-1]) != "num":
        linhas.pop()
    out = []
    emitidas = set()
    for l in linhas:
        dono = None
        toks = l.split()
        for k, t in enumerate(tabs):
            c = Counter(toks)
            if toks and all(t["pal"][x] >= v for x, v in c.items()):
                dono = k
                for x, v in c.items():
                    t["pal"][x] -= v
                break
        if dono is not None:
            if dono not in emitidas:
                emitidas.add(dono)
                out.append(("tab", tabs[dono]["md"]))
            continue
        t = marc.get(norm(l))
        if t:
            out.append((t, l))
        elif re.fullmatch(r"\d{1,3}", l):
            continue
        else:
            out.append(("txt", l))
    for k, t in enumerate(tabs):
        if k not in emitidas:
            out.append(("tab", t["md"]))
    return out


def tabela_nivel(linhas):
    """Converte linhas '1° +2 1 D Texto' em tabela Markdown."""
    rows = []
    for l in linhas:
        m = re.match(r"^(\d{1,2}°)\s+(\+\d)\s+(.*)$", l)
        toks = m.group(3).split() if m else []
        extra = []
        while toks and re.fullmatch(r"\d{1,2}|[A-E]|—|-", toks[0]):
            extra.append(toks.pop(0))
        rows.append((m.group(1), m.group(2), extra, " ".join(toks)))
    n_extra = max(len(r[2]) for r in rows)
    cab = ["Nível", "Proficiência"] + [f"Col. {i + 1}" for i in range(n_extra)] + ["Características"]
    out = ["| " + " | ".join(cab) + " |", "|" + "---|" * len(cab)]
    for nv, pr, ex, txt in rows:
        ex = ex + [""] * (n_extra - len(ex))
        out.append("| " + " | ".join([nv, pr] + ex + [txt.replace("|", "/")]) + " |")
    return "\n".join(out)


def converter(pdf, p1: int, p2: int, titulo_cap: str) -> str:
    itens = []
    for n in range(p1, p2 + 1):
        itens.extend(pagina(pdf, n))
    tem_h1 = any(t == "h1" for t, _ in itens)

    lim, i = [], 0
    while i < len(itens):
        t, l = itens[i]
        if t in ("h1", "txt") and len(l) == 1 and l.isalpha() and i + 1 < len(itens) and itens[i + 1][0] == "txt":
            itens[i + 1] = ("txt", l + itens[i + 1][1])
            i += 1
            continue
        lim.append((t, l))
        i += 1
    itens = lim

    larg = sorted(len(l) for t, l in itens if t == "txt" and len(l) > 40)
    maxlen = larg[int(len(larg) * 0.92)] if larg else 70

    saida, par, estado = [], [], {"item": False}

    def fecha():
        if par:
            txt = par[0]
            for x in par[1:]:
                txt = txt[:-1] + x if (txt.endswith("-") and x[:1].islower() and not txt.endswith(" -")) else txt + " " + x
            saida.append(("- " if estado["item"] else "") + txt)
        par.clear()
        estado["item"] = False

    def rank(j):
        return j < len(itens) and itens[j][0] == "txt" and re.search(r"Rank|Quincy|Hakuda", itens[j][1])

    i = 0
    while i < len(itens):
        t, l = itens[i]
        if t == "h1":
            fecha()
            saida.append("## " + titulo(l))
        elif t == "h2":
            fecha()
            saida.append(("### " if tem_h1 else "## ") + titulo(l))
        elif t == "num":
            fecha()
            for k in range(len(saida) - 1, -1, -1):
                if saida[k].startswith("### ") and "·" not in saida[k]:
                    saida[k] = "### " + l + " · " + saida[k][4:]
                    break
        elif t == "tab":
            fecha()
            saida.append(l)
        elif t == "banner":
            fecha()
            saida.append("### " + l)
            if rank(i + 1):
                saida.append("*" + itens[i + 1][1] + "*")
                i += 1
        elif NIVEL.match(l):
            j = i
            while j < len(itens) and itens[j][0] == "txt" and NIVEL.match(itens[j][1]):
                j += 1
            fecha()
            saida.append(tabela_nivel([x[1] for x in itens[i:j]]))
            i = j
            continue
        else:
            campo = next((c for c in CAMPOS if l.startswith(c)), None)
            if campo:
                fecha()
                txt, j = l, i + 1
                if campo == "Velocidade:" and txt.endswith("Encantamento") and j < len(itens) and itens[j][0] == "txt":
                    txt += " " + itens[j][1]
                    j += 1
                if campo == "Encantamento:":
                    while j < len(itens) and itens[j][0] == "txt" and not any(itens[j][1].startswith(c) for c in CAMPOS):
                        txt += " " + itens[j][1]
                        j += 1
                saida.append("- **" + campo + "**" + txt[len(campo):])
                i = j
                continue
            if l.startswith("•"):
                fecha()
                par.append(l.lstrip("• ").strip())
                estado["item"] = True
            elif par:
                ant = par[-1]
                if FIM_FRASE.search(ant) and len(ant) < maxlen * 0.8 and (l[:1].isupper() or l[:1] in INICIO_FRASE):
                    fecha()
                par.append(l)
            else:
                par.append(l)
        i += 1
    fecha()
    corpo = ""
    for k, b in enumerate(saida):
        if k:
            corpo += "\n" if (b.startswith("- ") and saida[k - 1].startswith("- ")) else "\n\n"
        corpo += b
    return f"# {titulo_cap}\n\n" + corpo + "\n"


PDFOBJ = pdfplumber.open(PDF)

meta = []
for slug, no, tit, desc, arte, p1, p2 in CAPS:
    md = converter(PDFOBJ, p1, p2, tit)
    nome = f"{no:02d}-{slug}.md"
    (OUT / "livro" / nome).write_text(md, encoding="utf-8")
    meta.append({"slug": slug, "no": no, "title": tit, "desc": desc, "art": arte, "file": nome})

REVISOES = {
    "introducao": ["regras-gerais"],
    "criacao-de-personagem": ["regras-gerais"],
    "origem": ["hollow"],
    "classes": ["classes-revisadas", "hollow", "ritter"],
    "essencias-espirituais": ["regras-gerais"],
    "zanpakutous": ["regras-gerais", "resurreccion"],
    "arsenal-quincy": ["ritter"],
    "atributos-e-pericias": ["regras-gerais"],
    "jogando": ["regras-gerais"],
    "mestre": ["regras-do-mestre"],
    "ameacas": ["regras-do-mestre", "regras-gerais"],
}
for m in meta:
    m["parte"] = "base"
    if m["slug"] in REVISOES:
        m["revisoes"] = REVISOES[m["slug"]]

# capítulos da edição Espada & vazio e créditos (arquivos escritos à mão)
EXTRAS = [
    ("regras-gerais", 15, "Regras Gerais", "Atributos, perícias, CR, Defender e Essências", "c08", "15-regras-gerais.md", "ev"),
    ("classes-revisadas", 16, "Classes Revisadas", "Todas as classes com os números finais", "c03", "16-classes-revisadas.md", "ev"),
    ("hollow", 17, "Hollow", "Origens, classes Hueco e Vazio e talentos", "c14", "17-hollow.md", "ev"),
    ("ritter", 18, "Quincy: Ritter", "A classe Ritter e a Vollständig", "c07", "18-ritter.md", "ev"),
    ("resurreccion", 19, "Treinamento da Resurrección", "Como o Hollow libera sua forma final", "c05", "19-resurreccion.md", "ev"),
    ("regras-do-mestre", 20, "Regras do Mestre", "NPC pareado, suporte, Boss e 5v5", "c13", "20-regras-do-mestre.md", "ev"),
    ("homenagens-e-fontes", 21, "Homenagens e Fontes", "Créditos, inspirações e referências", "c06", "21-homenagens-e-fontes.md", "creditos"),
]
for slug, no, tit, desc, arte, arq, parte in EXTRAS:
    meta.append({"slug": slug, "no": no, "title": tit, "desc": desc, "art": arte, "file": arq, "parte": parte})
(OUT / "chapters.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
print(len(meta), "capítulos")

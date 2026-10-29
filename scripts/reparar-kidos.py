"""Recupera descrições de Kidō cortadas na conversão do PDF, usando o texto do capítulo 11 do livro."""
import json, re, pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
caminho = raiz / "src/regras/kidos.json"
k = json.loads(caminho.read_text(encoding="utf-8"))
L = (raiz / "src/content/livro/11-feiticos-e-tecnicas.md").read_text(encoding="utf-8").split("\n")

def secao(x):
    for i, l in enumerate(L):
        m = re.match(r"### (\d+) · ", l)
        if m and int(m.group(1)) == x["n"] and l.rstrip().endswith(": " + x["nome"]) and (("Bakudou" in l or "Bakudō" in l) == (x["tipo"] == "bakudou")):
            j = i + 1
            while j < len(L) and not L[j].startswith("### ") and not L[j].startswith("| "):
                j += 1
            return L[i + 1:j]
    return None

def corpo(s):
    out, estado = [], "cab"
    for l in s:
        if not l.strip() or l.startswith("*Ba") or l.startswith("*Ha"):
            continue
        if l.startswith("- **"):
            if l.startswith("- **Reiatsu"):
                break
            estado = "cab"
            continue
        if estado == "cab":
            estado = "corpo"
            if len(l) < 60 and not l.endswith(".") and not out and not re.match(r"^(O|A|Ao|Você|Quando|Enquanto)\b", l):
                continue
        out.append(l)
    # junta quebras de linha no meio da frase
    t = ""
    for l in out:
        if t and not re.search(r"[.!?”)]$", t.rstrip()) and not l[:1].isupper():
            t = t.rstrip() + " " + l
        elif t and not re.search(r"[.!?”)]$", t.rstrip()):
            t = t.rstrip() + " " + l
        else:
            t = (t + "\n\n" + l) if t else l
    if t and t[0].islower():  # sobra do encantamento
        t = t.split("\n\n", 1)[1] if "\n\n" in t else ""
    return t.strip()

fim = re.compile(r"[.!?”)]$")
mudou = []
for x in k:
    atual = x["texto"].strip()
    if len(atual) >= 120 and fim.search(atual):
        continue
    s = secao(x)
    if not s:
        continue
    t = corpo(s)
    if len(t) > len(atual) + 20 and fim.search(t):
        x["texto"] = t
        mudou.append((x["tipo"], x["n"], x["nome"]))
caminho.write_text(json.dumps(k, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(mudou), "recuperados")
rest = [(x["tipo"], x["n"], x["nome"], len(x["texto"])) for x in k if len(x["texto"]) < 120 or not fim.search(x["texto"].strip())]
print(len(rest), "ainda incompletos:", rest)

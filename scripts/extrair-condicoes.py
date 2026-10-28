import json, re, pathlib
src = pathlib.Path("src/content/livro/10-condicoes.md").read_text(encoding="utf-8")
out = {}
atual = None
for ln in src.splitlines():
    if ln.startswith("## "):
        atual = ln[3:].strip()
        out[atual] = []
    elif atual and ln.startswith("- "):
        out[atual].append(ln[2:].strip())
pathlib.Path("src/regras/condicoes.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(len(out), list(out))

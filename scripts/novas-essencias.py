import json,re
ORD=["Segunda","Terceira","Quarta","Quinta"]
NOVAS=[
("hollow","Sonído Bestial","(Hueco e Vazio) Seu deslocamento aumenta em 1,5 metro.",["o aumento passa a ser 3 metros.","4,5 metros.","6 metros."]),
("hollow","Contra-ataque Selvagem","(Hueco) Uma vez por rodada, quando uma criatura te acerta com um ataque corpo a corpo, você usa a reação para atacá-la com a arma natural.",["o contra-ataque também causa metade da proficiência de dano extra.","você pode usar a reação duas vezes por rodada."]),
("hollow","Aura Sufocante","(Hueco e Vazio) No início do seu turno, criaturas hostis a até 3 metros de você perdem 2 pontos de reiatsu.",["a perda passa a ser 3 pontos.","o alcance vai a 4,5 metros.","a perda passa a ser 4 pontos."]),
("hollow","Último Fôlego","(Hueco e Vazio) Uma vez por descanso longo, ao cair a 0 PV por dano que não o mate na hora, você fica com 1 PV.",["você também recupera PV iguais ao seu nível.","você pode usar duas vezes entre descansos longos.","ao usar, ganha RD 5 contra todo dano até o fim do próximo turno."]),
("hollow","Cero Perfurante","(Hueco e Vazio) Seu Cero (Hueco) ou Poder Inato (Vazio) ignora 5 pontos da redução de dano de Energia do alvo.",["ignora 10 pontos.","ignora 15 pontos."]),
("quincy","Hirenkyaku Aprimorado","Ao usar o Hirenkyaku, você pode se teletransportar até 1,5 metro além do seu deslocamento atual.",["o acréscimo passa a ser 3 metros.","4,5 metros.","6 metros."]),
("quincy","Barreira de Reishi","Com a reação e 4 PR, ao ser atingido por um ataque, você condensa Reishi na frente do corpo e reduz o dano recebido em 5.",["a redução passa a ser 8.","12.","16."]),
("quincy","Tiro Penetrante","Seus ataques à distância com Arma Quincy ignoram cobertura parcial.",["também ignoram cobertura de três quartos.","você recebe +1 nas jogadas de acerto contra alvos com qualquer cobertura."]),
("quincy","Tiro Livre","Você não sofre desvantagem ao atacar à distância com uma criatura hostil adjacente a você.",["você recebe +1 nas jogadas de acerto à distância contra a criatura adjacente.","o bônus passa a ser +2."]),
]
j=json.load(open('src/regras/essencias.json'))
md=open('src/content/livro/04-essencias-espirituais.md').read()
for g,n,t,et in NOVAS:
    if any(x['nome']==n for x in j): continue
    j.append(dict(nome=n,grupo=g,repetivel=False,texto=t,etapas=et,nota=""))
    sec="\n### "+n+"\n\n"+t+"\n\n"+"\n".join(f"- **{ORD[i]} Etapa:** {e[0].upper()+e[1:]}" for i,e in enumerate(et))+"\n"
    fim="## Classes de Hollow" if g=="quincy" else "## Essências Proibidas"
    k=md.index("\n"+fim)
    md=md[:k].rstrip("\n")+"\n"+sec+md[k:]
    # linha da tabela
    ini=md.index("## Classes de Quincy" if g=="quincy" else "## Classes de Hollow")
    rows=[m for m in re.finditer(r"^\| [^|]+ \| (Sim|Não) \|$",md[ini:],re.M)]
    last=rows[-1]; pos=ini+last.end()
    md=md[:pos]+f"\n| {n} | Não |"+md[pos:]
json.dump(j,open('src/regras/essencias.json','w'),ensure_ascii=False,indent=1)
open('src/content/livro/04-essencias-espirituais.md','w').write(md)
print(len(j))

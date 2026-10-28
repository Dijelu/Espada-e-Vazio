# Regras do Mestre

Este capítulo ensina a montar combates equilibrados. O formato padrão do jogo é o duelo: cada jogador enfrenta um NPC feito para ele, do mesmo nível, e um grupo luta em duelos paralelos (cinco jogadores contra cinco NPCs). As regras abaixo dizem como transformar uma ameaça do capítulo Ameaças em um adversário calibrado para essa luta, como criar um curandeiro adversário, um Hollow espelhado, um chefe de grupo e como ajustar o 5v5.

## O que um combate equilibrado quer dizer

O duelo é construído para que o jogador seja um pouco mais forte que o NPC: entre **5% e 10%**. Na prática, isso significa que o jogador vence cerca de **55% a 65%** dos duelos. Em outras palavras, a cada dez duelos contra NPCs pareados, ele deve vencer seis, e perder uns quatro (ou ficar muito perto disso).

- **Meta:** vitória do jogador entre 55% e 65%.
- **Tolerância:** entre 45% e 75%. Fora disso, o duelo está fácil ou duro demais.
- **Resultado esperado:** o jogador sente o risco, mas sai por cima na maioria das vezes.

Uma luta perdida faz parte do jogo. Se a mesa estiver vencendo com folga demais ou sofrendo demais, ajuste os PV do NPC em 10% para mais ou para menos e siga em frente.

Atenção: as tabelas deste capítulo foram calibradas com personagens de 11 Pontos de Essência até o 19º nível (1 na criação e 2 em cada Aprimoramento da Essência: 4º, 8º, 12º, 16º e 19º), com atributos e proficiência pelas regras do livro e com o NPC usando os atributos das fichas de ameaça e a mesma proficiência que um personagem do nível (+2 do 1º ao 4º, +3 do 5º ao 8º, +4 do 9º ao 12º, +5 do 13º ao 16º e +6 do 17º ao 20º). Essências ganhas pela história ficam fora do cálculo, e cabe ao Mestre compensá-las.

## NPC pareado

O NPC pareado é uma ameaça Solo de ND igual ao nível do jogador, com PV, dano e técnicas multiplicados por um **fator k** que depende do nível. O fator k é o que transforma uma ficha de ameaça comum em um rival à altura de um personagem de jogador.

### Montando um NPC pareado, passo a passo

1. **Escolha a ficha.** Pegue uma ameaça Shinigami do capítulo Ameaças com ND igual ao nível do jogador (use as regras de mudar o ND se a ficha for de outro nível).
2. **Consulte o fator k** na tabela abaixo. Cada nível tem o seu próprio valor: não interpole nem arredonde.
3. **Multiplique os PV** da ficha por k e arredonde **para baixo**, para o número inteiro.
4. **Multiplique os dados de dano base** (os dados dos ataques) por k. O número de dados é arredondado **para baixo**.
5. **Multiplique os dados das técnicas** por k, com o mesmo arredondamento.
6. **Mantenha o resto.** CR, bônus de acerto, CD, atributos fixos e bônus de dano fixos continuam como na ficha.

| Nível | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Fator k | 2,5 | 1,9 | 1,65 | 1,45 | 1,5 | 1,375 | 1,25 | 1,1 | 1,15 | 1,3 |

| Nível | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|
| Fator k | 1,35 | 1,1 | 1,2 | 1,07 | 1,08 | 1,0 | 1,07 | 1,0 | 1,0 | 1,0 |

Os níveis em que o personagem ganha proficiência nova ou muita força de uma vez (como 3, 9, 11, 13, 15 e 17) pedem seu próprio valor de k, e é por isso que a tabela não sobe nem desce em linha reta.

### Arredondando os dados

Ao multiplicar dados por k (ou pelo fator de suporte, mais adiante), **o número de dados é sempre arredondado para baixo**. O tipo do dado não muda.

- 1d8 × 1,9 = **1d8** (1,9 vira 1).
- 1d8 × 2,5 = **2d8** (2,5 vira 2).
- 3d10 × 1,65 = **4d10** (4,95 vira 4).

Não pule essa regra. Sem o arredondamento para baixo, o NPC do 2º ao 5º nível sai bem mais forte do que o calibrado.

Atenção: nunca use um k entre 1,95 e 2,05 em uma ficha com 1 dado só. O NPC dobraria o dano de uma vez, o que desequilibra o duelo do 2º nível por inteiro. Se você inventar um fator para um NPC especial, fique abaixo de 1,95 ou acima de 2,05.

### Exemplo trabalhado

Exemplo: o grupo está no 5º nível e um jogador vai duelar com um Shinigami rival. O Mestre pega a ficha de ameaça Shinigami de ND 5, que tem 125 PV, ataque de espada 2d8 + atributo e uma técnica de 4d6.

1. O nível é 5, então k = **1,5**.
2. PV: 125 × 1,5 = 187,5, que vira **187 PV**.
3. Dado de dano do ataque: 2 × 1,5 = 3, então o ataque passa a **3d8 + atributo**.
4. Técnica: 4 × 1,5 = 6, então a técnica passa a **6d6**.
5. CR, acerto, CD e o bônus fixo de dano não mudam. A proficiência do NPC é +3, a mesma do jogador de 5º nível.

O NPC pareado está pronto: 187 PV, ataque 3d8 + atributo e técnica 6d6.

Agora o mesmo cálculo no 2º nível, com uma ficha de ND 2 de 50 PV, ataque 1d8 + atributo e técnica 2d6. Com k = 1,9: PV 50 × 1,9 = 95; ataque 1 × 1,9 = 1,9, que vira **1d8**; técnica 2 × 1,9 = 3,8, que vira **3d6**. Note que o ataque não muda: por isso o NPC desse nível ganha quase tudo em PV e técnica.

## NPC Hollow espelhado

Para um duelo contra um Hollow, use o NPC pareado Shinigami do mesmo ND (a mesma tabela de k), mude o tipo para Hollow e dê a ele o **Hierro**.

- **Hierro:** dano físico sofrido é reduzido à metade.
- **O que o Hierro não reduz:** dano de energia ou esotérico. Isso inclui Shikai e Bankai, Resurrección, Cero, Kidō e Shunko.

Assim o Hollow resiste a espadadas e socos, mas não a técnicas e liberações, e o jogador que depende só de golpes físicos precisa de um plano.

Atenção: nos níveis altos (do 12º em diante), alguns duelos com Hueco e Vazio podem se arrastar por muitas rodadas, porque os golpes comuns quase não passam pela defesa. Se o duelo travar, encerre-o na narrativa ou dê ao adversário uma forma de furar a defesa do outro lado.

## NPC de suporte

O Kyūgo Curandeiro duela contra um NPC de suporte, uma versão do NPC pareado que cura e reforça aliados e luta menos. O fator de suporte existe porque um curandeiro tem pouca ofensiva: sem ele, um NPC normal esmagaria o jogador.

### Montando o NPC de suporte

1. Monte o **NPC pareado** do mesmo nível (passos da seção anterior).
2. Multiplique **PV, dados de dano e dados de técnica** desse NPC pelo **fator de suporte** da tabela, com o arredondamento para baixo.
3. A CR **não** muda.

| Nível | 1 | 2 | 3 | 4 | 5–6 | 7–8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|
| Fator de suporte | 1,1 | 1,0 (**PV × 1,1**) | 0,75 | 0,7 | 0,65 | 0,6 | 0,65 | 0,38 | 0,35 |

| Nível | 12–15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|
| Fator de suporte | 0,32 | 0,28 | 0,3 | 0,28 | 0,21 | 0,13 |

- **No 2º nível,** o fator de dados fica em 1,0 e só os **PV sobem 10%**. Um fator de 1,05 tiraria um dado da técnica e deixaria o duelo duro demais para o curandeiro.
- **No 3º nível,** nenhum fator abaixo de 0,75 serve, porque tiraria 1 dado da técnica.
- **Não use um fator fixo.** Algo como ×0,4 funcionaria em um nível e quebraria o duelo em outros.

Exemplo: no 5º nível, o NPC pareado do exemplo anterior tem 187 PV, ataque 3d8 e técnica 6d6. Com fator 0,65: PV 187 × 0,65 = 121,55, que vira **121 PV**; ataque 3 × 0,65 = 1,95, que vira **1d8**; técnica 6 × 0,65 = 3,9, que vira **3d6**.

### Quem enfrenta o NPC de suporte

- **Curandeiro:** sempre duela contra o NPC de suporte.
- **1º e 2º nível:** a Afinidade só chega no 3º nível, então até lá **todo Kyūgo** duela contra o NPC de suporte, seja Curandeiro ou futuro Médico de Combate.
- **Médico de Combate:** a partir do 3º nível duela contra o NPC pareado normal.

Em grupo, o NPC de suporte cura e reforça os NPCs aliados, com a mesma reserva de cura do Curandeiro dos jogadores.

## Boss de grupo

Se a mesa quiser o formato "grupo contra um chefe", use um Boss. Ele está fora da calibração padrão dos duelos, então trate os números como ponto de partida e ajuste-os em cerca de 20% conforme o resultado.

- **PV:** os PV do NPC pareado × número de jogadores × **1,8** (níveis 3 a 10) ou × **2,3** (nível 11 em diante). Para um grupo de 5 jogadores, o Boss tem cerca de 9 vezes os PV do NPC pareado no 3º a 10º nível e cerca de 11 vezes e meia do 11º em diante.
- **Ataques:** o Boss faz **1 ataque a mais** por rodada.
- **Técnicas em área:** a técnica de área do Boss atinge **2 alvos**.

A regra foi pensada para o 3º nível em diante. Nos níveis 1 e 2, use o fator 1,8 e acompanhe de perto os primeiros turnos.

## 5v5

No 5v5, cada jogador duela com um NPC e o grupo vence quando ganha **3 duelos de 5**. Como a maioria ganha, cada jogador vencendo seus duelos com 60% a 65% de chance faz o grupo vencer com cerca de 68% a 76%, e isso é folga demais. Por isso, os NPCs do grupo recebem **PV extra**, calculado sobre os PV do NPC já montado (e arredondado para baixo).

| Grupo dos jogadores | PV dos NPCs até o 12º nível | PV dos NPCs do 13º em diante |
|---|---|---|
| Nenhum Curandeiro | +10% | +10% |
| Exatamente 1 Curandeiro | +20% | +10% |
| 2 ou mais Curandeiros | +10% | +0% |

- **Só o Curandeiro conta.** O Médico de Combate cura aliados pela metade do próprio custo e não cria reserva de cura para o grupo, então um grupo com Médico (e sem Curandeiro) é tratado como grupo **sem Curandeiro**.
- **Um Curandeiro é útil, não obrigatório.** A reserva de cura dele vale bastante para o grupo, mas trocá-lo por um lutador dá resultados parecidos.
- **Dois Curandeiros** deixam o grupo mais fraco no ataque, por isso o extra de PV some do 13º em diante.
- **O NPC de suporte** (par do Curandeiro) cura os outros NPCs com a mesma reserva do Curandeiro dos jogadores.

Exemplo: um grupo de 5º nível com exatamente 1 Curandeiro vai ao 5v5. Todos os NPCs ganham +20% de PV. O NPC pareado do exemplo (187 PV) passa a ter 187 × 1,2 = 224,4, ou seja, **224 PV**. O NPC de suporte do Curandeiro (121 PV) também recebe o aumento: 121 × 1,2 = 145,2, ou **145 PV**.

Atenção: o 5v5 tem dois pontos que merecem olho na mesa. No **7º nível**, os grupos tendem a sofrer mais do que nos outros níveis, principalmente quando há Curandeiro. Já os grupos com **1 Curandeiro entre o 13º e o 19º nível** podem vencer com folga. Se isso acontecer, mexa em 10% dos PV dos NPCs, para mais ou para menos, até o duelo ficar bom.

## Ajustando na mesa

As regras acima apontam para a meta de 55% a 65% de vitória. Cada grupo é diferente, e a mesa é o teste de verdade. Use estas ideias para acertar o tom:

- **O jogador vence sem suar?** Some 10% aos PV do NPC.
- **O jogador perde com frequência demais?** Tire 10% dos PV do NPC.
- **O duelo pede uma cena especial?** Dê ao NPC uma técnica única, em vez de mexer nos números. A tabela não precisa ser lei em todo duelo, só um bom ponto de partida.

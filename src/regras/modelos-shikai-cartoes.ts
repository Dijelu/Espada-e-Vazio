/* Gerado a partir da remontagem dos modelos (cartões neutros). Dados, não lógica. */
import type { CartoesDoModelo } from "./modelos-cartoes";

export const CARTOES_SHIKAI: Record<string, CartoesDoModelo> = {
 "ashisogi-jizo": {
  "acoes": {
   "Rasgar": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Kyōdo Yon: Choro do Bebê": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Veneno Injetado": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "MEN"
   },
   "Corpo Modificado": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "MEN"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Paralisado"
     },
     "liga": "Kyōdo Yon: Choro do Bebê"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Rasgar"
    }
   ],
   [
    {
     "k": "C",
     "id": "golpe-duplo",
     "p": {},
     "liga": "Rasgar"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Envenenado"
     },
     "liga": "Veneno Injetado"
    }
   ]
  ],
  "fraco": {
   "forca": "medio",
   "modo": "pronta",
   "prejuizo": "m-casca"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Fluxo Restaurador, Mente Afiada."
 },
 "benihime": {
  "acoes": {
   "Nake, Benihime": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Shibari, Benihime": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Tsuppane, Benihime": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Chikasumi no Tate": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Shibari, Benihime"
    }
   ],
   [
    {
     "k": "C",
     "id": "empurrao",
     "p": {},
     "liga": "Tsuppane, Benihime"
    }
   ],
   [
    {
     "k": "C",
     "id": "atravessa",
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "critico-ampliado",
     "p": {},
     "liga": "todas"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-corte"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Kidō Canalizado, Parede de Reiatsu."
 },
 "haineko": {
  "acoes": {
   "Unare: Nuvem que Rosna": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Garra de Cinzas": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Véu de Cinzas": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Redemoinho de Cinzas": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "alcance",
     "liga": "todas"
    },
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 1,
      "d": 6
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Cego"
     },
     "liga": "Véu de Cinzas"
    }
   ],
   [
    {
     "k": "C",
     "id": "aura",
     "p": {
      "tipo": "Cortante"
     },
     "liga": "todas"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "livre",
   "nome": "Cabo Vazio",
   "texto": "A lâmina vira partículas e só o cabo fica na sua mão. Você não pode usar reações para aparar ou bloquear com a arma, e ataques corpo a corpo contra você têm +2 no acerto."
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Corpo Leve."
 },
 "hyorinmaru": {
  "acoes": {
   "Dragão de Gelo": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Rokui Hyōketsujin": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Corrente da Lua Gelada": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Ryōjin Hyōheki": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Congelado"
     },
     "liga": "Rokui Hyōketsujin"
    }
   ],
   [
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 1,
      "d": 6
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Dragão de Gelo"
    }
   ],
   [
    {
     "k": "E",
     "forca": "leve",
     "nome": "Domínio do Clima",
     "texto": "Ao liberar, o céu fecha num raio de 30 m e a área vira terreno difícil para inimigos; vantagem contra Frio."
    }
   ]
  ],
  "fraco": {
   "forca": "forte",
   "modo": "pronta",
   "prejuizo": "f-ferida",
   "param": "Fogo"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Guarda Elemental."
 },
 "katen-kyokotsu": {
  "acoes": {
   "Bushōgoma": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Kageoni: Saída da Sombra": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Irooni: Cor Escolhida": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Kageokuri": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "E",
     "forca": "forte",
     "nome": "Regras do Jogo",
     "texto": "Ação bônus: anuncie um jogo (Takaoni, Kageoni, Irooni ou Daruma-san ga Koronda). Ele vale para todos a até 9 m, você inclusive, até anunciar outro. Só um por vez."
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "livre",
   "nome": "Regra para Todos",
   "texto": "As regras que a forma impõe valem para você do mesmo jeito. Se você quebrar a regra do jogo ativo, sofre o mesmo efeito de quem a quebra, e a regra só pode ser trocada na sua ação bônus."
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Passo Ligeiro, Mente Afiada."
 },
 "kyoka-suigetsu": {
  "acoes": {
   "Kanzen Saimin": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Corte no Reflexo": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Tempo no Espelho": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "MEN"
   },
   "Troca de Lugar": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "MEN"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Enfeitiçado"
     },
     "liga": "Kanzen Saimin"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Distorcido"
     },
     "liga": "Tempo no Espelho"
    }
   ],
   [
    {
     "k": "E",
     "forca": "forte",
     "nome": "Hipnose Completa",
     "texto": "Quem viu a liberação vê, ouve e sente o que você quiser; 1 vez por rodada, ao acertar você, faz Mente: na falha acertou uma imagem e você sofre metade."
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "livre",
   "nome": "Espelho que Exige Olhos",
   "texto": "A ilusão só prende quem viu a liberação. Cegos, quem estava fora da sua vista e quem tocou a lâmina antes da liberação ficam imunes a tudo o que a forma faz contra a mente e os sentidos. Quem vencer duas salvaguardas de Mente seguidas contra a forma fica imune até o fim da cena."
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Kidō Canalizado, Mente Afiada."
 },
 "ryujin-jakka": {
  "acoes": {
   "Jōkaku Enjō": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Ennetsu Jigoku": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Taimatsu": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Muralha de Chamas": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Queimado"
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 1,
      "d": 6
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "aura",
     "p": {
      "tipo": "Fogo"
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Jōkaku Enjō"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-corpo"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Mente Afiada."
 },
 "senbonzakura": {
  "acoes": {
   "Chire: Nuvem de Pétalas": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Perseguir": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Rio Rosado": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Defesa Dilacerante": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "alcance",
     "liga": "todas"
    },
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 1,
      "d": 6
     },
     "liga": "todas"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-passos"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Parede de Reiatsu, Mente Afiada."
 },
 "sode-no-shirayuki": {
  "acoes": {
   "Some no Mai: Tsukishiro": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Tsugi no Mai: Hakuren": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "San no Mai: Shirafune": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Juhaku": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Congelado"
     },
     "liga": "Some no Mai: Tsukishiro"
    }
   ],
   [
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 1,
      "d": 6
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Juhaku"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "livre",
   "nome": "Dança sem Repetição",
   "texto": "Cada técnica é um passo de uma dança. Você não pode usar a mesma habilidade de Ação da forma em dois turnos seguidos. Se ficar Caído, Agarrado ou Preso, perde o ritmo: a próxima habilidade da forma custa +3 PR."
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Guarda Elemental, Corpo Leve."
 },
 "suzumebachi": {
  "acoes": {
   "Ferrão": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Nigeki Kessatsu": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Passo do Onmitsukidō": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Utsusemi": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "marcar-alvo"
    },
    {
     "k": "I",
     "id": "reforco",
     "tec": "marcar-alvo"
    }
   ],
   [
    {
     "k": "C",
     "id": "golpe-duplo",
     "p": {},
     "liga": "Ferrão"
    }
   ],
   [
    {
     "k": "C",
     "id": "critico-ampliado",
     "p": {},
     "liga": "todas"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-guarda"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Corpo Leve, Passo Ligeiro."
 },
 "suzumushi": {
  "acoes": {
   "Benihiko": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Corte no Sono": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Nota Aguda": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Lâmina que Ouve": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Surdo"
     },
     "liga": "Nota Aguda"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Inconsciente"
     },
     "liga": "Benihiko"
    }
   ]
  ],
  "fraco": {
   "forca": "medio",
   "modo": "pronta",
   "prejuizo": "m-casca"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Corpo Leve, Mente Afiada, Passo Ligeiro."
 },
 "tenken": {
  "acoes": {
   "Corte do Braço Gigante": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Lâmina que Esmaga": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Uivo de Comando": {
    "sub": "area",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Braço que Protege": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "alcance",
     "p": {},
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Caído"
     },
     "liga": "Lâmina que Esmaga"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Amedrontado"
     },
     "liga": "Uivo de Comando"
    }
   ],
   [
    {
     "k": "C",
     "id": "atravessa",
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "critico-ampliado",
     "p": {},
     "liga": "Lâmina que Esmaga"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-guarda"
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Lâmina Pesada, Parede de Reiatsu."
 },
 "zabimaru": {
  "acoes": {
   "Hoero: Chicote Estendido": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Higa Zekkō": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Mordida da Serpente": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Segmentos que Voltam": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "alcance",
     "p": {},
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Agarrado"
     },
     "liga": "Mordida da Serpente"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "livre",
   "nome": "Lâmina Partida",
   "texto": "A arma pode ser quebrada. Quando você sofre um crítico ou falha numa salvaguarda de Força contra ser Agarrado, a lâmina se parte: até gastar uma ação bônus e 3 PR para refazê-la, você perde o alcance extra e os dados extras da forma."
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Lâmina Pesada, Parede de Reiatsu, Golpe duplo."
 },
 "zangetsu": {
  "acoes": {
   "Getsuga Tenshō": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Getsuga Colado": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Girar pela Faixa": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Lâmina Larga": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "empurrao",
     "p": {},
     "liga": "Getsuga Colado"
    }
   ],
   [
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 1,
      "d": 6
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "C",
     "id": "alcance",
     "liga": "todas"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "livre",
   "nome": "Fúria Contida",
   "texto": "No início de cada turno, salvaguarda de Mente (CD 10 + proficiência). Na falha, o seu primeiro ataque do turno vai contra a criatura mais próxima, amiga ou inimiga."
  },
  "sabor": "Também faz parte deste espírito, só como sabor (sem custo nem número): Lâmina Pesada, Corpo Leve."
 }
};

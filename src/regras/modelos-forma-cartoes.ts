/* Gerado a partir da remontagem dos modelos (cartões neutros). Dados, não lógica. */
import type { CartoesDoModelo } from "./modelos-cartoes";

export const CARTOES_BANKAI: Record<string, CartoesDoModelo> = {
 "benihime-aratame": {
  "acoes": {
   "Abrir e Costurar": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Braços de Manequim": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Refazer o Corpo": {
    "sub": "cura",
    "ritmo": "acao",
    "atr": "MEN",
    "cura": "pv"
   },
   "Abrir Caminho": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "MEN"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "cura-no-acerto",
     "p": {},
     "liga": "Braços de Manequim"
    }
   ],
   [
    {
     "k": "T",
     "id": "invocacao-grande"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao-grande"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-encanto"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Distorcido"
     },
     "liga": "Abrir e Costurar"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-costura"
  },
  "sabor": ""
 },
 "daiguren-hyorinmaru": {
  "acoes": {
   "Ryūsenka": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Guncho Tsurara": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Sennen Hyōrō": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Clone de Gelo": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-flores-gelo"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-asas"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-gelo-lento"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-elemento",
     "param": {
      "tipo": "Gelo"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Sennen Hyōrō"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-degelo"
  },
  "sabor": ""
 },
 "enma-korogi": {
  "acoes": {
   "Corte no Silêncio": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Cem Lâminas do Grilo": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Passo no Escuro": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Lâmina Sentida": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "dominio"
    },
    {
     "k": "I",
     "id": "dominio-sentidos",
     "tec": "dominio"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-duplo"
    }
   ]
  ],
  "fraco": {
   "forca": "medio",
   "modo": "pronta",
   "prejuizo": "m-casca"
  },
  "sabor": "Domo do Silêncio: o campo debilita (Surdo, escolhido ao abrir); a cegueira e a luta só por reiatsu ficam como sabor."
 },
 "hakka-no-togame": {
  "acoes": {
   "Hakka no Togame: Zero Absoluto": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Lâmina de Geada": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Dança da Neve": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Cortina Branca": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "barreira"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-elemento",
     "param": {
      "tipo": "Gelo"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-gelo-lento"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-barreira"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-perfura"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-pele",
     "param": {
      "tipo": "Gelo"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-sentidos"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Esgotado"
     },
     "liga": "final"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-degelo"
  },
  "sabor": ""
 },
 "hihio-zabimaru": {
  "acoes": {
   "Hikotsu Taihō": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Mordida do Babuíno": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Chicote de Segmentos": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Segmentos que Voltam": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "FOR",
    "cura": "reduz"
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
     "k": "P",
     "id": "bk-fio-golpe",
     "param": {
      "n": 2
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "C",
     "id": "explosao",
     "p": {},
     "liga": "Hikotsu Taihō"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Agarrado"
     },
     "liga": "Mordida do Babuíno"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-passos"
  },
  "sabor": ""
 },
 "jakuho-raikoben": {
  "acoes": {
   "Jakuhō Raikōben": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES",
    "final": true
   },
   "Ferrão Veloz": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Mira Ancorada": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-mil"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-explosao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ],
   [
    {
     "k": "C",
     "id": "critico-ampliado",
     "p": {},
     "liga": "Jakuhō Raikōben"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    }
   ]
  ],
  "fraco": {
   "preset": "pg-tiro"
  },
  "sabor": ""
 },
 "kamishini-no-yari": {
  "acoes": {
   "Estocada Infinita": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Desfazer Molecular": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Recolher a Lâmina": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "DES",
    "cura": "barreira"
   },
   "Butō: Renjin": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES",
    "final": true
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-corte-distante"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-perfura"
    }
   ],
   [
    {
     "k": "C",
     "id": "critico-ampliado",
     "p": {},
     "liga": "todas"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Esgotado"
     },
     "liga": "final"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-tiro"
  },
  "sabor": ""
 },
 "karamatsu-shinju": {
  "acoes": {
   "Ato 1: Tameraikizu no Wakachiai": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Ato 2: Zanki no Shitone": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Ato 3: Dangyo no Fuchi": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Ato 4: Itokiribasami Chizome no Nodobue": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "vinculo"
    },
    {
     "k": "I",
     "id": "vinculo-dano",
     "tec": "vinculo"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-dominio"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "T",
     "id": "marcar-alvo"
    },
    {
     "k": "I",
     "id": "usar-marca",
     "tec": "marcar-alvo"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Ato 3: Dangyo no Fuchi"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-atos"
  },
  "sabor": ""
 },
 "kokujo-tengen-myoo": {
  "acoes": {
   "Corte do Gigante": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Punho de Ferro Negro": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Guarda da Armadura": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "FOR",
    "cura": "reduz"
   },
   "Uivo do Lobo": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "invocacao-grande"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao-grande"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-explosao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-recompor"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Amedrontado"
     },
     "liga": "Uivo do Lobo"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-elo"
  },
  "sabor": ""
 },
 "konjiki-ashisogi-jizo": {
  "acoes": {
   "Hálito Mortal": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Lâminas sob o Lenço": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "MEN"
   },
   "Veneno Sob Medida": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Autodestruição": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "MEN"
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "invocacao-grande"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao-grande"
    }
   ],
   [
    {
     "k": "C",
     "id": "aura",
     "p": {
      "tipo": "Veneno"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-recompor"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Paralisado"
     },
     "liga": "Veneno Sob Medida"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-descontrole"
  },
  "sabor": ""
 },
 "kyoka-reflexos": {
  "acoes": {
   "Ilusão Completa": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Troca de Reflexo": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "MEN",
    "cura": "barreira"
   },
   "Mundo de Espelhos": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "MEN"
   },
   "Despertar dos Reflexos": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN",
    "final": true
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "clones"
    },
    {
     "k": "I",
     "id": "passo-clones",
     "tec": "clones"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-concentrado"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-sentidos"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-dominio"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Distorcido"
     },
     "liga": "Ilusão Completa"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Esgotado"
     },
     "liga": "final"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-vista"
  },
  "sabor": ""
 },
 "senbonzakura-kageyoshi": {
  "acoes": {
   "Tempestade de Pétalas": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Gōkei: Esfera Sem Saída": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Rio de Lâminas": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Parede Rosada": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-mil"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-concentrado"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Gōkei: Esfera Sem Saída"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-passos"
  },
  "sabor": ""
 },
 "shatatsu-karagara": {
  "acoes": {
   "Rolo de Pano": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Fio de Costura": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "MEN"
   },
   "Tecido sob Medida": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "MEN",
    "cura": "barreira"
   },
   "Máquina de Padrão das Seis Cores": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN",
    "final": true
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-dominio"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-concentrado"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-sentidos"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-corte-distante"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-barreira"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Esgotado"
     },
     "liga": "final"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-raiz"
  },
  "sabor": ""
 },
 "shirafude-ichimonji": {
  "acoes": {
   "Nome Pela Metade": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Traço Largo": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "MEN"
   },
   "Rasura": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "MEN",
    "cura": "barreira"
   },
   "Novo Nome": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN",
    "final": true
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-dominio"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-corte-distante"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-perfura"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-concentrado"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-sentidos"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-barreira"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "men"
     }
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Esgotado"
     },
     "liga": "final"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-tiro"
  },
  "sabor": ""
 },
 "tensa-zangetsu": {
  "acoes": {
   "Getsuga Tenshō Negro": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Cortes Sem Imagem": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Passo Residual": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Getsuga à Queima-Roupa": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-negra"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-duplo"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-reacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-explosao"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-frenesi-leve"
  },
  "sabor": ""
 },
 "zanka-no-tachi": {
  "acoes": {
   "Higashi: Kyokujitsujin": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Kita: Tenchi Kaijin": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Minami: Exército de Cinzas": {
    "sub": "cura",
    "ritmo": "acao",
    "atr": "FOR",
    "cura": "temp"
   },
   "Nishi: Zanjitsu Gokui": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "FOR",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "dados-extras",
     "p": {
      "n": 2,
      "d": 8
     },
     "liga": "todas"
    },
    {
     "k": "C",
     "id": "atravessa",
     "p": {},
     "liga": "todas"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-manto-sol"
    }
   ],
   [
    {
     "k": "T",
     "id": "invocacao-grande"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao-grande"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-sol"
  },
  "sabor": ""
 }
};

export const CARTOES_BANKAI2: Record<string, CartoesDoModelo> = {
 "tensa-zangetsu": {
  "acoes": {
   "Getsuga Final dos Clones": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Chuva de Clones": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Correntes que Prendem": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "T",
     "id": "clones"
    },
    {
     "k": "I",
     "id": "passo-clones",
     "tec": "clones"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Correntes que Prendem"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-escudo-corrente"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-negra"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-sangue"
  },
  "sabor": "Também faz parte desta forma, só como sabor (sem custo nem número): Correntes de Sangue."
 },
 "senbonzakura-kageyoshi": {
  "acoes": {
   "Shūkei: Hakuteiken": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Lâmina na Mão": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Fileiras que Fecham": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Asas Brancas": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-senkei"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-sem-defesa"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-heranca"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-asas"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    }
   ]
  ],
  "fraco": {
   "preset": "pg-aberto"
  },
  "sabor": ""
 },
 "daiguren-hyorinmaru": {
  "acoes": {
   "Hyōten Hyakkasō": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Toque dos Quatro Elementos": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Ryūsenka": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Sennen Hyōrō": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-quatro-elementos"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-absoluta"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Congelado"
     },
     "liga": "Ryūsenka"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Sennen Hyōrō"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-gelo-lento"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-elemento",
     "param": {
      "tipo": "Gelo"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-veloz"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-degelo"
  },
  "sabor": ""
 },
 "hihio-zabimaru": {
  "acoes": {
   "Zaga Teppō": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Orochiō": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Punho de Hihiō": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Garra Óssea": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-braco-osso"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-eco"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Caído"
     },
     "liga": "Punho de Hihiō"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio-golpe",
     "param": {
      "n": 2
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-ferro"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-sede"
  },
  "sabor": ""
 },
 "kokujo-tengen-myoo": {
  "acoes": {
   "Golpe do Gigante Sem Cerne": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Esmagar": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Lâmina do Homem": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-corpo-ilusao"
    }
   ],
   [
    {
     "k": "T",
     "id": "invocacao-grande"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao-grande"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-outra-forma",
     "param": {
      "tipo": "Cortante"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-armadura"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Esmagar"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-fio-golpe",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "for"
     }
    }
   ]
  ],
  "fraco": {
   "preset": "pg-contagem"
  },
  "sabor": ""
 },
 "konjiki-ashisogi-jizo": {
  "acoes": {
   "Devorar": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "MEN"
   },
   "Mil Camadas": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "MEN",
    "cura": "reduz"
   },
   "Hálito Mortal": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "MEN",
    "final": true
   },
   "Nervos Expostos": {
    "sub": "utilidade",
    "ritmo": "bonus",
    "atr": "MEN"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-gestacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-inedito"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Agarrado"
     },
     "liga": "Devorar"
    }
   ],
   [
    {
     "k": "C",
     "id": "aura",
     "p": {
      "tipo": "Veneno"
     },
     "liga": "todas"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-lagarta"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-descontrole"
  },
  "sabor": "Também faz parte desta forma, só como sabor (sem custo nem número): Névoa Venenosa."
 },
 "enma-korogi": {
  "acoes": {
   "Los Nueve Aspectos": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Cero do Grilo": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Canto das Asas": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Ver pela Primeira Vez": {
    "sub": "utilidade",
    "ritmo": "bonus",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "bv-final"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-inedito"
    }
   ],
   [
    {
     "k": "P",
     "id": "bv-outra-forma",
     "param": {
      "tipo": "Energia"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-asas"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-precisao"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-duplo"
    }
   ],
   [
    {
     "k": "P",
     "id": "bk-forca",
     "param": {
      "atr": "des"
     }
    }
   ]
  ],
  "fraco": {
   "preset": "pf-casca"
  },
  "sabor": ""
 }
};

export const CARTOES_RES: Record<string, CartoesDoModelo> = {
 "arbol": {
  "acoes": {
   "Mundo Quebrado: Floresta de Máscaras": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Colheita": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Raízes que Prendem": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Ordem de Ataque": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-calaveras"
    }
   ],
   [
    {
     "k": "T",
     "id": "invocacao"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-escuro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-uivo"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Preso"
     },
     "liga": "Raízes que Prendem"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-elo"
  },
  "sabor": ""
 },
 "arrogante": {
  "acoes": {
   "Veneno Total: Senilidade": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Sopro de Respira": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Gran Caída": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Mão da Velhice": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "aura",
     "p": {
      "tipo": "Veneno"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-veneno"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 2
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-uivo"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-casulo"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-ruina-devolvida"
  },
  "sabor": ""
 },
 "brujeria": {
  "acoes": {
   "Mundo Quebrado: Olhar Total": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Amor Pleno": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Gemelos Sonido": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Corpo Emprestado": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "E",
     "forca": "medio",
     "nome": "Amor",
     "texto": "Marque um braço ou uma perna do alvo: ele perde o uso do membro até o fim da cena (o Mestre decide os detalhes)."
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-escuro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-sonido-selvagem"
    }
   ],
   [
    {
     "k": "T",
     "id": "clones"
    },
    {
     "k": "I",
     "id": "passo-clones",
     "tec": "clones"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Enfeitiçado"
     },
     "liga": "Amor Pleno"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-olhos"
  },
  "sabor": ""
 },
 "dragra": {
  "acoes": {
   "Gran Rey Cero: Rugido do Dragão": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Rajada Dracônica": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Punho do Dragão": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Escamas Eriçadas": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-cero-denso"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-espinhos"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-mira"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-uivo"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-cauda"
    }
   ]
  ],
  "fraco": {
   "forca": "medio",
   "modo": "pronta",
   "prejuizo": "m-casca"
  },
  "sabor": ""
 },
 "extinguir": {
  "acoes": {
   "Espejo Roto: Corpo Selado": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Punhos Infinitos": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Selo Engolido": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Chama Devolvida": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-extinguir"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-veu"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-sonido-selvagem"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-chama-engolida"
  },
  "sabor": ""
 },
 "gamuza": {
  "acoes": {
   "Espejo Roto: Duelo Honrado": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Lanzador Verde": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Carga do Centauro": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Cero Devolvido": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-cero-doble"
    }
   ],
   [
    {
     "k": "C",
     "id": "cura-no-acerto",
     "p": {},
     "liga": "Cero Devolvido"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-sonido-selvagem"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-veu"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-mascara"
  },
  "sabor": ""
 },
 "giralda": {
  "acoes": {
   "Golpe Fantasma: Passo do Bailarino": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Ciclones": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Cero Cornada": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Giro Defensivo": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "DES",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-ciclone"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-pantera"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-primeiro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-gemelos"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 2
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-guarda"
  },
  "sabor": ""
 },
 "gloton": {
  "acoes": {
   "Devorar: Banquete": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Rosto Roubado": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Chuva de Bocas": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Lâmina Engolida": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "copiar"
    },
    {
     "k": "I",
     "id": "usar-copia",
     "tec": "copiar"
    }
   ],
   [
    {
     "k": "C",
     "id": "alcance",
     "p": {},
     "liga": "Lâmina Engolida"
    },
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Agarrado"
     },
     "liga": "Lâmina Engolida"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-fome"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-carne"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 1
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "for"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ],
   [
    {
     "k": "T",
     "id": "invocacao"
    },
    {
     "k": "I",
     "id": "comandar-invocacao",
     "tec": "invocacao"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Enfeitiçado"
     },
     "liga": "Rosto Roubado"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-luz"
  },
  "sabor": ""
 },
 "ira": {
  "acoes": {
   "Devorar: Mordida da Fera": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Cero Gigante": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Bala Pesada": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Pisotear": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-ira"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "con"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 2
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-cauda"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-carne"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-fome"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-frenesi-leve"
  },
  "sabor": ""
 },
 "murcielago": {
  "acoes": {
   "Mundo Quebrado: Desespero": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Luz de la Luna": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Cero Verde": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Asas que se Fecham": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-asas"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-escuro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-sonido-selvagem"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-uivo"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-luz"
  },
  "sabor": ""
 },
 "pantera": {
  "acoes": {
   "Golpe Fantasma: Caçada": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Desgarrón": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Garra de la Pantera": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Couro de Pantera": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "DES",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-pantera"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-garra"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-presa",
     "param": {
      "n": 2
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "des"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-sonido-selvagem"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-primeiro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ]
  ],
  "fraco": {
   "forca": "leve",
   "modo": "pronta",
   "prejuizo": "l-guarda"
  },
  "sabor": ""
 },
 "tiburon": {
  "acoes": {
   "Gran Rey Cero: Dente do Mar": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Cascada": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "La Gota": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Trident": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Hirviendo": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "rs-mare"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hirviendo"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-cero-denso"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-mira"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-regen"
    }
   ],
   [
    {
     "k": "P",
     "id": "rs-instinto"
    }
   ]
  ],
  "fraco": {
   "forca": "forte",
   "modo": "pronta",
   "prejuizo": "f-ferida",
   "param": "Gelo"
  },
  "sabor": ""
 }
};

export const CARTOES_SEGUNDA: Record<string, CartoesDoModelo> = {
 "arrogante-trono": {
  "acoes": {
   "Era da Ruína": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Ordem do Rei": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Areia que Cai": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Tempo Parado": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "reduz"
   }
  },
  "blocos": [
   [
    {
     "k": "C",
     "id": "aura",
     "p": {
      "tipo": "Energia"
     }
    }
   ],
   [
    {
     "k": "P",
     "id": "se-vazio-total"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-terror"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-hierro"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-forca",
     "param": {
      "atr": "esp"
     }
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Amedrontado"
     },
     "liga": "Ordem do Rei"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-sangue"
  },
  "sabor": ""
 },
 "ira-furia": {
  "acoes": {
   "Soco do Colosso": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "FOR"
   },
   "Cero da Fera": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "FOR",
    "final": true
   },
   "Pisada Colossal": {
    "sub": "area",
    "ritmo": "bonus",
    "atr": "FOR"
   },
   "Raiva sem Dor": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "temp"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "se-colosso"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-rei"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-fome"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-grito"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-indomavel"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-colosso"
  },
  "sabor": ""
 },
 "murcielago-segunda": {
  "acoes": {
   "Lanza del Relámpago": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Luz de la Luna": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Cero Oscuras": {
    "sub": "area",
    "ritmo": "acao",
    "atr": "ESP"
   },
   "Látigo": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Corpo que se Refaz": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "pv"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "se-lanza"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-oscuras"
    }
   ],
   [
    {
     "k": "C",
     "id": "alcance",
     "p": {},
     "liga": "Látigo"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-regen"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-instinto"
    }
   ],
   [
    {
     "k": "C",
     "id": "condicao-acerto",
     "p": {
      "condicao": "Agarrado"
     },
     "liga": "Látigo"
    }
   ]
  ],
  "fraco": {
   "preset": "pg-ruina"
  },
  "sabor": ""
 },
 "pantera-rei": {
  "acoes": {
   "Desgarrón Real": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES",
    "final": true
   },
   "Garra do Rei": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Salto Predador": {
    "sub": "movimento",
    "ritmo": "bonus",
    "atr": "DES"
   },
   "Rugido do Rei": {
    "sub": "ataque",
    "ritmo": "reacao",
    "atr": "DES"
   }
  },
  "blocos": [
   [
    {
     "k": "P",
     "id": "se-rei"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-indomavel"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-devorar"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-terror"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-forca",
     "param": {
      "atr": "des"
     }
    }
   ]
  ],
  "fraco": {
   "preset": "pf-frenesi-leve"
  },
  "sabor": ""
 },
 "tiburon-abismo": {
  "acoes": {
   "Mandíbula do Abismo": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "DES"
   },
   "Pressão das Profundezas": {
    "sub": "ataque",
    "ritmo": "acao",
    "atr": "ESP",
    "final": true
   },
   "Cardume de Gotas": {
    "sub": "ataque",
    "ritmo": "bonus",
    "atr": "ESP"
   },
   "Maré que Protege": {
    "sub": "cura",
    "ritmo": "reacao",
    "atr": "ESP",
    "cura": "temp"
   }
  },
  "blocos": [
   [
    {
     "k": "T",
     "id": "dominio"
    },
    {
     "k": "I",
     "id": "regra-dominio",
     "tec": "dominio"
    },
    {
     "k": "I",
     "id": "dominio-condicao",
     "tec": "dominio"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-oscuras"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-instinto"
    }
   ],
   [
    {
     "k": "P",
     "id": "se-regen"
    }
   ]
  ],
  "fraco": {
   "preset": "pf-sede"
  },
  "sabor": ""
 }
};

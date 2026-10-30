import { useEffect, useState } from "react";

/** Dicas do Kon para cada etapa da criação de ficha. */
const DICAS = [
  [
    "Ei, novato! A Origem é o que você é: Humano, Fullbringer, Quincy, Hollow… ela já te dá bônus de vida, deslocamento e poderes.",
    "Não sabe qual escolher? Leia o resumo de cada uma. Dá para voltar e trocar antes de salvar.",
  ],
  [
    "A Classe é o seu jeito de lutar. Zanjutsu é espada, Kidōshu é magia, Hakuda é soco… Escolha a que combina com a sua ideia de personagem.",
    "A subclasse vem depois, quando a classe pede. Sem pressa!",
  ],
  [
    "Todos os atributos começam em 0. Você tem 12 pontos para distribuir, e cada atributo pode ficar com no máximo 4 na criação. Os bônus da Origem entram depois, sozinhos.",
    "Dica do Kon: ponha os pontos mais altos no que a sua classe mais usa.",
  ],
  [
    "Perícias são o que você sabe fazer fora da luta: perceber, enganar, correr, estudar. Marque as que a sua classe e a sua história pedem.",
  ],
  [
    "Hora dos poderes! Escolha com calma, porque cada um aparece depois nas Ações da ficha. O que estiver bloqueado ainda pede nível ou requisito.",
  ],
  [
    "Essências são bônus permanentes e fortes. Abra o guia ali em cima se tiver dúvida do que cada uma faz.",
    "E não esqueça do equipamento: ele vira os seus ataques prontos.",
  ],
  [
    "Quase lá! Dê um nome, uma história e um jeito de ser ao seu personagem. O Mestre vai adorar.",
    "Pode salvar. Depois dá para mudar quase tudo na ficha.",
  ],
];

export function KonAjuda({ passo }: { passo: number }) {
  const dicas = DICAS[passo] ?? DICAS[0];
  const [i, setI] = useState(0);
  const [aberto, setAberto] = useState(() => {
    try { return localStorage.getItem("esv:kon") !== "off"; } catch { return true; }
  });
  useEffect(() => setI(0), [passo]);
  const fechar = (v: boolean) => {
    setAberto(v);
    try { localStorage.setItem("esv:kon", v ? "on" : "off"); } catch { /* sem armazenamento */ }
  };
  const img = passo % 2 === 0 ? "/art/kon-fala.png" : "/art/kon-pensa.png";

  if (!aberto) {
    return <p className="kon-volta"><button type="button" className="link" onClick={() => fechar(true)}>Chamar o Kon para ajudar</button></p>;
  }
  return (
    <aside className="kon" aria-label="Dica do Kon" role="note">
      <div className="kon-balao">
        <p>{dicas[i]}</p>
        <div className="kon-acoes">
          {i < dicas.length - 1 && <button type="button" className="link" onClick={() => setI(i + 1)}>Mais uma dica →</button>}
          <button type="button" className="link" onClick={() => fechar(false)}>Dispensar o Kon</button>
        </div>
      </div>
      <img className="kon-img" src={img} alt="Kon, o ursinho de pelúcia, ajudando" width={120} />
    </aside>
  );
}

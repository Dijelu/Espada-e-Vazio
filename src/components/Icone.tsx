type Nome = "dado" | "cadeado" | "check";

const D: Record<Nome, JSX.Element> = {
  // d20 de lados cortantes, como um fragmento de lâmina
  dado: (
    <>
      <path d="M12 2.5l8.5 5v9L12 21.5l-8.5-5v-9z" />
      <path d="M12 2.5l3.2 6.5H8.8zM3.5 7.5l5.3 1.5M20.5 7.5L15.2 9M8.8 9L12 21.5 15.2 9M3.5 16.5l5.3-7.5M20.5 16.5L15.2 9" />
    </>
  ),
  // cadeado com a haste em forma de lâmina
  cadeado: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 017 0v3M12 14.5v3" />
    </>
  ),
  // marca em traço de pincel
  check: <path d="M4 12.5l5 5L20.5 5.5" />,
};

/** Ícones do site em traço, com cantos vivos para combinar com o visual do livro. */
export function Icone({ nome, tamanho = 18, titulo }: { nome: Nome; tamanho?: number; titulo?: string }) {
  return (
    <svg className="icone" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" role={titulo ? "img" : undefined} aria-label={titulo} aria-hidden={titulo ? undefined : true}>
      {D[nome]}
    </svg>
  );
}

/* Foto da máscara anexada pelo jogador: reduz o tamanho e tira o fundo liso, guardando tudo como imagem dentro da ficha. */

const LADO_MAX = 480;

function carregar(arq: File): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(arq);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); erro(new Error("Não foi possível abrir essa imagem.")); };
    img.src = url;
  });
}

/** Se os quatro cantos têm quase a mesma cor, apaga o que for dessa cor a partir das bordas (fundo liso). */
function tirarFundo(d: ImageData) {
  const { width: w, height: h, data } = d;
  const px = (x: number, y: number) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const cantos = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  if (cantos.some((c) => c[3] < 250)) return; // já tem transparência
  const media = [0, 1, 2].map((k) => cantos.reduce((s, c) => s + c[k], 0) / 4);
  const dist = (c: number[]) => Math.hypot(c[0] - media[0], c[1] - media[1], c[2] - media[2]);
  if (cantos.some((c) => dist(c) > 40)) return; // fundo não é liso
  const tol = 48;
  const visto = new Uint8Array(w * h);
  const pilha: number[] = [];
  const empurra = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const k = y * w + x;
    if (visto[k]) return;
    visto[k] = 1;
    if (dist(px(x, y)) <= tol) pilha.push(k);
  };
  for (let x = 0; x < w; x++) { empurra(x, 0); empurra(x, h - 1); }
  for (let y = 0; y < h; y++) { empurra(0, y); empurra(w - 1, y); }
  while (pilha.length) {
    const k = pilha.pop() as number;
    data[k * 4 + 3] = 0;
    const x = k % w, y = (k - x) / w;
    empurra(x + 1, y); empurra(x - 1, y); empurra(x, y + 1); empurra(x, y - 1);
  }
}

/** Devolve uma imagem (data URL) pequena e, se possível, sem fundo. */
export async function prepararFotoMascara(arq: File, semFundo = true): Promise<string> {
  if (!arq.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  const img = await carregar(arq);
  const esc = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * esc));
  const h = Math.max(1, Math.round(img.height * esc));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  if (!g) throw new Error("O navegador não conseguiu processar a imagem.");
  g.drawImage(img, 0, 0, w, h);
  if (semFundo) {
    const d = g.getImageData(0, 0, w, h);
    tirarFundo(d);
    g.putImageData(d, 0, 0);
  }
  const out = c.toDataURL("image/webp", 0.85);
  return out.startsWith("data:image/webp") ? out : c.toDataURL("image/png");
}

// @ts-nocheck
/* Geradores de arte SVG (portados do protótipo aprovado v6/v7/v9): Vollständig, hanafuda, osso e tinta. Só desenho em código, sem dependências. */
const VA = (() => {
  const f = (n) => Math.round(n * 10) / 10;
  const PRNG = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  /* traço de pena: a linha central vira um polígono cuja largura vai de w0 a w1 (w1 = 0 dá ponta fina) */
  function afina(pts, w0, w1, pot) {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
      const w = (w0 + (w1 - w0) * Math.pow(i / (n - 1), pot || 1)) / 2;
      L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]); R.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return "M" + L.concat(R.reverse()).map((p) => f(p[0]) + " " + f(p[1])).join("L") + "Z";
  }
  const linha = (pts) => "M" + pts.map((p) => f(p[0]) + " " + f(p[1])).join("L");

  /* veia que cresce e se ramifica. Devolve [{ d: polígono, c: linha central, w }] */
  function veias(R, x, y, ang, len, w, prof, saida) {
    const passo = 7, n = Math.max(6, Math.round(len / passo)), pts = [[x, y]];
    let a = ang, px = x, py = y;
    const ramos = [];
    for (let i = 1; i <= n; i++) {
      a += (R() - 0.5) * 0.34 + Math.sin(i * 0.31 + ang * 3) * 0.045;
      px += Math.cos(a) * passo; py += Math.sin(a) * passo; pts.push([px, py]);
      if (prof > 0 && i > n * 0.22 && i < n * 0.86 && R() < 0.085) ramos.push([i, a]);
    }
    saida.push({ d: afina(pts, w, 0, 0.8), c: linha(pts), w });
    ramos.slice(0, 4).forEach(([i, ar]) => {
      const lado = R() < 0.5 ? -1 : 1;
      veias(R, pts[i][0], pts[i][1], ar + lado * (0.5 + R() * 0.55), len * (0.3 + R() * 0.3) * (1 - i / n * 0.4), w * 0.55, prof - 1, saida);
    });
    return saida;
  }

  /* lâmina de luz: curva leve, largura w na raiz, ponta fina */
  function lamina(ox, oy, ang, len, w, curva) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14, dx = Math.cos(ang) * len * t, dy = Math.sin(ang) * len * t;
      const off = Math.sin(t * Math.PI * 0.5) * curva * len; // abaulado perpendicular
      pts.push([ox + dx - Math.sin(ang) * off, oy + dy + Math.cos(ang) * off]);
    }
    return afina(pts, w, 0, 0.9);
  }

  /* rede de cristal: grade irregular de triângulos, com opacidades diferentes (vidro facetado) */
  function rede(R, x0, y0, x1, y1, cols, lins) {
    const P = [];
    for (let j = 0; j <= lins; j++) { P[j] = []; for (let i = 0; i <= cols; i++) P[j][i] = [x0 + (x1 - x0) * i / cols + (i && i < cols ? (R() - 0.5) * (x1 - x0) / cols * 0.7 : 0), y0 + (y1 - y0) * j / lins + (j && j < lins ? (R() - 0.5) * (y1 - y0) / lins * 0.7 : 0)]; }
    let s = "";
    for (let j = 0; j < lins; j++) for (let i = 0; i < cols; i++) {
      const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i], q = R() < 0.5;
      const tri = q ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      tri.forEach((t) => { const o = R(); s += `<path d="M${t.map((p) => f(p[0]) + " " + f(p[1])).join("L")}Z" fill="#5cc8ff" fill-opacity="${f(o * o * 0.2)}" stroke="#8fd8ff" stroke-opacity="${f(0.05 + o * 0.18)}" stroke-width=".6"/>`; });
    }
    return s;
  }

  const estrela = (cx, cy, Rr, r, n) => Array.from({ length: n * 2 }, (_, i) => { const a = (Math.PI / n) * i - Math.PI / 2, k = i % 2 ? r : Rr; return f(cx + k * Math.cos(a)) + "," + f(cy + k * Math.sin(a)); }).join(" ");
  const cruz = (cx, cy, s) => [[-.3, -1], [.3, -1], [.16, -.34], [.9, -.3], [.9, .3], [.16, .34], [.3, 1], [-.3, 1], [-.16, .34], [-.9, .3], [-.9, -.3], [-.16, -.34]].map(([x, y]) => f(cx + x * s) + "," + f(cy + y * s)).join(" ");

  /* ---------- ARTE DO CABEÇALHO ----------
     p = prefixo dos ids (várias cópias na página), W,H = viewBox, (ox,oy) = centro da cruz, k = escala, sem = semente */
  function cabArte(p, W, H, ox, oy, k, sem, opt) {
    opt = opt || {};
    const R = PRNG(sem), id = (n) => `${p}-${n}`;
    // feixes (asas): esquerda maior que direita, de propósito
    let fe = "";
    const asa = (lado, n, Lmax, a0, a1, seed) => {
      const r = PRNG(seed); let s = "";
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), ang = (a0 + (a1 - a0) * t) * Math.PI / 180, th = lado < 0 ? Math.PI - ang : ang;
        const len = Lmax * (0.5 + 0.5 * Math.pow(Math.sin(Math.PI * (0.12 + t * 0.8)), 0.9)) * (0.92 + r() * 0.16);
        s += `<path d="${lamina(ox, oy, th, len, (2.8 - t * 0.9) * k, lado * -0.06 * (1 - t * 0.5))}" fill="url(#${id("fx")})"/>`;
      }
      return s;
    };
    const wingE = asa(-1, 11, 470 * k, -74, 22, sem + 3), wingD = asa(1, 8, 250 * k, -66, 16, sem + 9);
    // veias: crescem da cruz para a esquerda (longas) e um pouco para a direita (curtas)
    const V = []; const rv = PRNG(sem + 21);
    [[Math.PI + 0.12, 360 * k, 3.2 * k, 3], [Math.PI - 0.34, 300 * k, 2.6 * k, 3], [Math.PI + 0.55, 330 * k, 2.8 * k, 3], [Math.PI + 0.95, 190 * k, 2.2 * k, 2], [Math.PI - 0.85, 210 * k, 2.2 * k, 2], [-0.3, 120 * k, 2 * k, 2], [0.55, 110 * k, 2 * k, 2]].forEach(([a, l, w, pr]) => veias(rv, ox, oy, a, l, w, pr, V));
    const veiaD = V.map((v) => v.d).join(""), veiaC = V.map((v, i) => `<path class="corre" pathLength="100" style="--i:${i}" d="${v.c}"/>`).join("");
    const rx = 74 * k, ry = 16 * k, hy = oy - 96 * k;
    const marcas = Array.from({ length: 12 }, (_, i) => { const a = Math.PI * (i / 11) , x = ox + Math.cos(a + Math.PI) * (rx + 8 * k), y = hy + Math.sin(a + Math.PI) * (ry + 3 * k); return `M${f(x)} ${f(y)}L${f(ox + Math.cos(a + Math.PI) * (rx + 14 * k))} ${f(hy + Math.sin(a + Math.PI) * (ry + 6.5 * k))}`; }).join("");
    /* silhueta de asa (game-icons "curly-wing", Lorc): a raiz da asa fica em (0.9, 0.66) do ícone; vai para a cruz. lado -1 = asa da esquerda */
    const wingIcon = (lado, S, op, rot) => `<g transform="translate(${ox} ${oy}) rotate(${lado < 0 ? -rot : rot}) scale(${lado * S / 512 * -1} ${S / 512}) translate(-450 -420)"><use href="/arte/sprite.svg#ic-asa-pena" width="512" height="512" fill="url(#${id("gw")})" opacity="${op}"/></g>`;
    return `<svg class="arte-s" style="--ox:${ox}px;--oy:${oy}px" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="${id("fx")}" gradientUnits="userSpaceOnUse" cx="${ox}" cy="${oy}" r="${470 * k}"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".22" stop-color="#cfeeff" stop-opacity=".8"/><stop offset=".6" stop-color="#5cc8ff" stop-opacity=".42"/><stop offset="1" stop-color="#2f7bff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id("vg")}" gradientUnits="userSpaceOnUse" x1="${ox}" y1="0" x2="${ox - 520 * k}" y2="0"><stop offset="0" stop-color="#eef6ff"/><stop offset=".35" stop-color="#5cc8ff"/><stop offset="1" stop-color="#2f7bff" stop-opacity=".25"/></linearGradient>
    <linearGradient id="${id("gw")}" x1="1" y1=".7" x2="0" y2="0"><stop offset="0" stop-color="#eef6ff" stop-opacity=".55"/><stop offset=".45" stop-color="#5cc8ff" stop-opacity=".3"/><stop offset="1" stop-color="#2f7bff" stop-opacity=".02"/></linearGradient>
    <radialGradient id="${id("gl")}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#5cc8ff" stop-opacity=".55"/><stop offset="1" stop-color="#5cc8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id("cz")}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#bfe8ff"/><stop offset="1" stop-color="#4aa8e8"/></linearGradient>
    <linearGradient id="${id("mk")}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".45" stop-color="#fff"/></linearGradient>
    <mask id="${id("mr")}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${id("mk")})"/></mask>
    <filter id="${id("bl")}" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="${f(3.2 * k)}"/></filter>
    <filter id="${id("bl2")}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${f(9 * k)}"/></filter>
  </defs>
  <g class="s-rede" mask="url(#${id("mr")})">${rede(R, opt.x0 !== undefined ? opt.x0 : ox - 600 * k, -8, W + 20, H + 8, opt.cols || 16, 4)}</g>
  <circle class="s-aura" cx="${ox}" cy="${oy}" r="${190 * k}" fill="url(#${id("gl")})"/>
  <g class="s-asas">
    <g class="asa asa-e">${wingIcon(-1, 440 * k, 1, 30)}${wingE}</g>
    <g class="asa asa-d">${wingIcon(1, 300 * k, .9, 30)}${wingD}</g>
  </g>
  <g class="s-veias">
    <path d="${veiaD}" fill="#2f7bff" opacity=".75" filter="url(#${id("bl")})"/>
    <path d="${veiaD}" fill="url(#${id("vg")})"/>
    <g class="s-corre" fill="none" stroke="#ffffff" stroke-width="${f(1.6 * k)}" stroke-linecap="round" opacity=".95">${veiaC}</g>
  </g>
  <g class="s-aureola" fill="none">
    <ellipse cx="${ox}" cy="${hy}" rx="${rx}" ry="${ry}" stroke="#5cc8ff" stroke-width="${f(7 * k)}" opacity=".3" filter="url(#${id("bl")})"/>
    <ellipse cx="${ox}" cy="${hy}" rx="${rx}" ry="${ry}" stroke="#eef6ff" stroke-width="${f(1.8 * k)}"/>
    <ellipse cx="${ox}" cy="${hy}" rx="${rx + 9 * k}" ry="${ry + 3.5 * k}" stroke="#8fd8ff" stroke-width="${f(.8 * k)}" stroke-dasharray="${f(18 * k)} ${f(7 * k)} ${f(2 * k)} ${f(7 * k)}" opacity=".85"/>
    <path d="${marcas}" stroke="#8fd8ff" stroke-width="${f(.8 * k)}" opacity=".7"/>
  </g>
  <g class="s-cruz">
    <circle class="s-pulso" cx="${ox}" cy="${oy}" r="${40 * k}" fill="none" stroke="#bfe8ff" stroke-width="${f(2 * k)}"/>
    <g fill="none" stroke="#8fd8ff" stroke-width="${f(.8 * k)}" opacity=".8">
      <path d="M${f(ox - 120 * k)} ${oy}H${f(ox - 52 * k)}M${f(ox + 52 * k)} ${oy}H${f(ox + 120 * k)}M${ox} ${f(oy + 52 * k)}V${f(oy + 84 * k)}"/>
      <circle cx="${ox}" cy="${oy}" r="${f(49 * k)}" stroke-dasharray="${f(3 * k)} ${f(5 * k)}"/>
      <circle cx="${ox}" cy="${oy}" r="${f(41 * k)}" stroke="#eef6ff" stroke-width="${f(1.6 * k)}"/>
    </g>
    <polygon points="${estrela(ox, oy, 66 * k, 22 * k, 8)}" fill="#5cc8ff" fill-opacity=".16" stroke="#8fd8ff" stroke-width="${f(1 * k)}" stroke-linejoin="round"/>
    <polygon points="${estrela(ox, oy, 46 * k, 30 * k, 8)}" fill="none" stroke="#eef6ff" stroke-opacity=".55" stroke-width="${f(.7 * k)}" stroke-linejoin="round"/>
    <polygon class="s-cruz-f" points="${cruz(ox, oy, 38 * k)}" fill="url(#${id("cz")})" stroke="#03111f" stroke-opacity=".7" stroke-width="${f(1.1 * k)}" stroke-linejoin="round"/>
    <polygon points="${cruz(ox, oy, 38 * k)}" fill="none" stroke="#ffffff" stroke-opacity=".9" stroke-width="${f(.7 * k)}" stroke-linejoin="round" transform="translate(${f(-.9 * k)} ${f(-.9 * k)})"/>
    <path d="M${ox} ${f(oy - 38 * k)}L${f(ox + 6 * k)} ${f(oy - 12 * k)}L${ox} ${f(oy + 38 * k)}L${f(ox - 6 * k)} ${f(oy - 12 * k)}Z" fill="#ffffff" opacity=".4"/>
    <circle cx="${ox}" cy="${oy}" r="${f(4.2 * k)}" fill="#03111f"/><circle cx="${ox}" cy="${oy}" r="${f(2.2 * k)}" fill="#5cc8ff"/>
  </g>
</svg>`;
  }

  /* ---------- banner das cartas de ação (400x60) ---------- */
  function bannerArte(sem) {
    const R = PRNG(sem), ox = 330, oy = 38;
    let fe = "";
    for (let i = 0; i < 8; i++) { const t = i / 7, ang = Math.PI + (-58 + 70 * t) * Math.PI / 180; fe += `<path d="${lamina(ox, oy, ang, 150 * (0.55 + 0.45 * Math.sin(Math.PI * (0.1 + t * 0.85))) * (0.9 + R() * 0.2), 2.2 - t * .6, -0.05)}" fill="url(#vb-fx)"/>`; }
    const V = []; veias(PRNG(sem + 5), ox - 6, oy + 6, Math.PI - 0.1, 210, 2.2, 2, V); veias(PRNG(sem + 8), ox, oy, Math.PI + 0.7, 120, 1.6, 2, V);
    return `<symbol id="va-banner-${sem}" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice">
  <defs><radialGradient id="vb-fx" gradientUnits="userSpaceOnUse" cx="${ox}" cy="${oy}" r="170"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".4" stop-color="#5cc8ff" stop-opacity=".5"/><stop offset="1" stop-color="#2f7bff" stop-opacity="0"/></radialGradient>
  <linearGradient id="vb-vg" gradientUnits="userSpaceOnUse" x1="${ox}" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#eef6ff"/><stop offset=".4" stop-color="#5cc8ff"/><stop offset="1" stop-color="#2f7bff" stop-opacity=".2"/></linearGradient>
  <linearGradient id="vb-mk" x1="0" y1="0" x2="1" y2="0"><stop offset=".25" stop-color="#000"/><stop offset=".9" stop-color="#fff"/></linearGradient>
  <mask id="vb-mr"><rect width="400" height="60" fill="url(#vb-mk)"/></mask></defs>
  <rect width="400" height="60" fill="#071426"/>
  <g mask="url(#vb-mr)">${rede(PRNG(sem + 2), 150, 0, 400, 60, 8, 2)}</g>
  ${fe}
  <path d="${V.map((v) => v.d).join("")}" fill="url(#vb-vg)"/>
</symbol>`;
  }

  /* ---------- ornamentos de canto (símbolos) ---------- */
  const simbolos = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <!-- canto cortado (cima-esquerda): fio interno paralelo ao corte, triângulo quebrado, arco de construção, marcas -->
  <symbol id="va-c-tl" viewBox="0 0 44 44"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 14L14 0" stroke="#8fd8ff" stroke-width="2"/>
    <path d="M4 18L18 4" stroke="#eef6ff" stroke-width="1"/>
    <path d="M23 11H11V23" stroke="#5cc8ff" stroke-width="1"/>
    <path d="M0 33A33 33 0 0 0 33 0" stroke="#5cc8ff" stroke-width=".6" opacity=".6" stroke-dasharray="2 3"/>
    <path d="M4 26V32M26 4H32" stroke="#8fd8ff" stroke-width="1"/>
    <path d="M23 8.5L25.5 11L23 13.5L20.5 11ZM8.5 23L11 25.5L8.5 28L6 25.5Z" fill="#5cc8ff" stroke="none"/>
  </g></symbol>
  <!-- canto cortado (baixo-direita): fio interno, losango e linhas de construção -->
  <symbol id="va-c-br" viewBox="0 0 44 44"><g fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 22 22)">
    <path d="M0 14L14 0" stroke="#8fd8ff" stroke-width="2"/>
    <path d="M4 18L18 4" stroke="#eef6ff" stroke-width="1"/>
    <path d="M9 9L20 9M9 9L9 20" stroke="#5cc8ff" stroke-width="1"/>
    <path d="M4 4H40M4 4V40" stroke="#5cc8ff" stroke-width=".5" opacity=".45"/>
    <path d="M13 13L17 17M17 13L13 17" stroke="#8fd8ff" stroke-width=".8"/>
    <path d="M30 4L32.5 6.5L30 9L27.5 6.5ZM4 30L6.5 32.5L4 35L1.5 32.5Z" fill="#5cc8ff" stroke="none"/>
  </g></symbol>
  <!-- canto reto (cima-direita e baixo-esquerda, espelhados por CSS): colchete + nó -->
  <symbol id="va-c-sq" viewBox="0 0 44 44"><g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 22V4H22" stroke="#eef6ff" stroke-width="1"/>
    <path d="M0 14V0H14" stroke="#8fd8ff" stroke-width="2"/>
    <path d="M4 4L12 12" stroke="#5cc8ff" stroke-width=".8"/>
    <path d="M13 10.5L15.5 13L13 15.5L10.5 13Z" fill="#5cc8ff" stroke="none"/>
    <path d="M30 4H38M4 30V38" stroke="#5cc8ff" stroke-width="1"/>
  </g></symbol>
</defs></svg>`;

  /* ---------- peças de HTML ---------- */
  const ic = (nome, cls) => `<svg class="ic ${cls || ""}" viewBox="0 0 ${/^(ligar|cadeado|brilho)$/.test(nome) ? 256 : 512} ${/^(ligar|cadeado|brilho)$/.test(nome) ? 256 : 512}" aria-hidden="true" focusable="false"><use href="/arte/sprite.svg#ic-${nome}"/></svg>`;
  const cantos = (tipo) => `<i class="cn cn-tl" aria-hidden="true"><svg viewBox="0 0 44 44"><use href="#va-c-tl"/></svg></i><i class="cn cn-tr" aria-hidden="true"><svg viewBox="0 0 44 44"><use href="#va-c-sq"/></svg></i><i class="cn cn-bl" aria-hidden="true"><svg viewBox="0 0 44 44"><use href="#va-c-sq"/></svg></i><i class="cn cn-br" aria-hidden="true"><svg viewBox="0 0 44 44"><use href="#va-c-br"/></svg></i>`;
  /* gema de estado: facetada; acesa quando a Vollständig está ligada, vazia e tracejada quando desligada */
  const gema = (on) => `<svg class="gema" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
    <path d="M20 2L36 15L20 38L4 15Z" class="g-fio" fill="${on ? "url(#va-gem)" : "#050b16"}" stroke="${on ? "#eef6ff" : "#6f93b8"}" stroke-width="1.6" ${on ? "" : 'stroke-dasharray="4 3"'} stroke-linejoin="round"/>
    <path d="M4 15H36M13 15L20 2L27 15L20 38M13 15L20 38" fill="none" stroke="${on ? "#03111f" : "#6f93b8"}" stroke-width=".8" opacity="${on ? ".45" : ".7"}"/>
    <path d="M13 15L20 2L27 15Z" fill="#fff" opacity="${on ? ".55" : "0"}"/>
  </svg>`;
  const defsGema = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><linearGradient id="va-gem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dff6ff"/><stop offset=".5" stop-color="#5cc8ff"/><stop offset="1" stop-color="#1b6fe0"/></linearGradient></defs></svg>`;

  /* emblema por habilidade (ícone da biblioteca, recolorido) */
  const EMB = { "Espadas Aladas": "espada-alada", "Galvano Javelin": "relampago-foco", "Sklaverei: Descarga": "cristal-brilho",
    "Força Espiritual": "cristais", "Potência Espiritual": "cristal-brilho", "Olhos do Céu": "cristal-olho", "Velocidade": "pe-alado",
    "Arma Espiritual": "lamina-relicario", "Consciência Expandida": "terceiro-olho", "Sklaverei": "cristal-barras", "Voo": "asa-pena", "Carga Elétrica": "relampago" };
  const medalhao = (nome) => `<span class="va-emb" aria-hidden="true"><svg viewBox="0 0 64 64"><path class="m-1" d="M32 2L50 8L62 24V40L50 56L32 62L14 56L2 40V24L14 8Z"/><path class="m-2" d="M32 7L47 12L57 25V39L47 52L32 57L17 52L7 39V25L17 12Z"/><path class="m-3" d="M32 0V6M32 58V64M0 32H6M58 32H64"/></svg>${ic(EMB[nome] || "estrela4", "m-ic")}</span>`;

  return { cabArte, bannerArte, simbolos, defsGema, gema, ic, cantos, medalhao, EMB, PRNG, afina, linha, veias, lamina, f, estrela, cruz };
})();

const TK = (() => {
  const { PRNG, afina, veias, f } = VA;
  const P = (a) => a.map((q) => f(q[0]) + " " + f(q[1])).join("L");
  const poly = (a) => "M" + P(a) + "Z";
  const suave = (pts, t) => { t = t || 1; const n = pts.length; let d = `M${f(pts[0][0])} ${f(pts[0][1])}`; for (let i = 0; i < n; i++) { const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n], e = pts[(i + 2) % n]; d += `C${f(b[0] + (c[0] - a[0]) / 6 * t)} ${f(b[1] + (c[1] - a[1]) / 6 * t)} ${f(c[0] - (e[0] - b[0]) / 6 * t)} ${f(c[1] - (e[1] - b[1]) / 6 * t)} ${f(c[0])} ${f(c[1])}`; } return d + "Z"; };
  const qc = (a, c, b, n) => { n = n || 18; const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };
  const cc = (a, c1, c2, b, n) => { n = n || 22; const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1]]); } return o; };
  const trk = (pts, w0, w1, pot) => afina(pts, w0, w1 || 0, pot || .8);
  /* o mesmo traço, espelhado em torno de x=500 (viewBox 1000) */
  const trkM = (pts, w0, w1, pot) => trk(pts, w0, w1, pot) + trk(pts.map(([x, y]) => [1000 - x, y]), w0, w1, pot);

  /* escolha por forma: Máscara a|b|c ; Resurrección (silhueta) a = chifres curvos, b = asas de morcego, c = mandíbula e garras */
  const COR = { mascara: "a", resurreccion: "a", segunda: "c" };
  try { const q = new URLSearchParams(location.search); if (q.get("cm")) COR.mascara = q.get("cm"); if (q.get("cr")) COR.resurreccion = q.get("cr"); if (q.get("cs")) COR.segunda = q.get("cs"); } catch (e) { }
  const VAR = { mascara: "a", resurreccion: "c", segunda: "b" };
  try { const q = new URLSearchParams(location.search); if (q.get("vm")) VAR.mascara = q.get("vm"); if (q.get("vr")) { VAR.resurreccion = q.get("vr"); } if (q.get("vs")) VAR.segunda = q.get("vs"); } catch (e) { }

  /* ---------- filtros (todos estáticos) ---------- */
  const filtroCarvao = (p) => `<filter id="${p}-fc" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="3" seed="4" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="44" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".34" numOctaves="3" seed="9" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -.18" result="na"/>
      <feComposite in="d" in2="na" operator="arithmetic" k1="0" k2="2.9" k3="-2.4" k4=".02" result="g"/>
      <feFlood style="flood-color:var(--tk-tinta)" result="c"/><feComposite in="c" in2="g" operator="in"/></filter>`;
  const filtroAspero = (p, id, esc, f1, esc2) => `<filter id="${p}-${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="${f1}" numOctaves="3" seed="${id.length + 3}" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="${esc}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".22" numOctaves="2" seed="17" result="w2"/>
      <feDisplacementMap in="d" in2="w2" scale="${esc2}" xChannelSelector="G" yChannelSelector="R"/></filter>`;
  /* pincel seco: aspereza + pontinhos que "furam" a tinta (cerdas) */
  const filtroPincel = (p, esc, seco, id) => `<filter id="${p}-${id || "fp"}" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".016" numOctaves="3" seed="6" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="${esc}" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".2" numOctaves="2" seed="21" result="w2"/>
      <feDisplacementMap in="d" in2="w2" scale="8" xChannelSelector="G" yChannelSelector="R" result="d2"/>
      ${seco ? `<feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="5" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  16 0 0 0 -12.2" result="na"/>
      <feComposite in="d2" in2="na" operator="out"/>` : ""}</filter>`;

  /* ---------- fundo de papel: osso do Hollow com fibra bem leve ---------- */
  function papel(p, W, H, tipo) {
    return `<svg class="tk-bg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>
      <radialGradient id="${p}-pg" cx=".78" cy=".5" r=".75"><stop offset="0" style="stop-color:var(--tk-papel2)"/><stop offset="1" style="stop-color:var(--tk-papel)"/></radialGradient>
      <filter id="${p}-pf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7 .5" numOctaves="2" seed="${tipo === "m" ? 3 : 8}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 -.18" result="a"/><feFlood style="flood-color:var(--tk-tinta)"/><feComposite in2="a" operator="in"/></filter></defs>
      <rect width="${W}" height="${H}" fill="url(#${p}-pg)"/><rect width="${W}" height="${H}" filter="url(#${p}-pf)" opacity=".16"/></svg>`;
  }
  /* placa de tinta atrás do texto (só no tema claro): pincelada larga de borda áspera */
  function placas(p, seed, tipo) {
    const R = PRNG(seed); const pts = [[0, 0]];
    let x = 61; for (let y = 0; y <= 100; y += 1.1) { x += (R() - .5) * 2.2; x = Math.max(57, Math.min(65, x)); const sp = R() < .12 ? R() * 3.4 : 0; pts.push([x + sp, y]); }
    pts.push([0, 100]);
    const ptsM = [[0, 0]]; let y2 = 80; for (let xx = 0; xx <= 100; xx += 1.1) { y2 += (R() - .5) * 3; y2 = Math.max(75, Math.min(85, y2)); const sp = R() < .12 ? -R() * 4 : 0; ptsM.push([xx, y2 + sp]); }
    const dots = Array.from({ length: 26 }, () => { const yy = R() * 100, xx = 65 + R() * 9, r = .25 + Math.pow(R(), 2.5) * 1.1; return `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r * .6)}" ry="${f(r * 1.4)}"/>`; }).join("");
    const dotsM = Array.from({ length: 22 }, () => { const xx = R() * 100, yy = 70 + R() * 8, r = .3 + Math.pow(R(), 2.5) * 1.3; return `<ellipse cx="${f(xx)}" cy="${f(yy)}" rx="${f(r * 1.4)}" ry="${f(r * .7)}"/>`; }).join("");
    return `<svg class="tk-placa" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${poly(pts)}" fill="var(--tk-placa)"/><g fill="var(--tk-placa)">${dots}</g></svg>
      <svg class="tk-placa-m" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 100L0 ${f(ptsM[0][1])}L${P(ptsM.slice(1).map(([a, b]) => [a, b]))}L100 100Z" fill="var(--tk-placa)"/><g fill="var(--tk-placa)">${dotsM}</g></svg>`;
  }

  /* =================================================================== MÁSCARA */
  const INK = "#15101b", VERM = "#e5173f", VERM2 = "#ff3b5c";
  const MC = [[0, -60], [20, -57], [36, -43], [42, -15], [38, 17], [29, 41], [14, 57], [0, 62]];
  const CONT2 = (() => { const r = MC.map(([x, y]) => [x, y]); const l = MC.slice(1, -1).reverse().map(([x, y]) => [-x, y]); return r.concat(l); })();
  const L1 = [[-5, -90], [-1, -48], [-9, -22], [3, 0], [-3, 22], [5, 46], [0, 90]];
  const L2 = [[3, 0], [14, 8], [22, -2], [33, 9], [90, 6]];
  const CL_A = poly([[-90, -90]].concat(L1, [[-90, 90]]));
  const CL_B1 = poly(L1.slice(0, 4).concat(L2.slice(1), [[90, -90]]));
  const CL_B2 = poly(L1.slice(3).concat([[90, 90]], L2.slice().reverse().slice(0, -1)));
  const SEAM = "M" + P(L1.slice(1, 6)) + "M" + P(L2.slice(0, 4));

  function listras(v) {
    const m = []; const add = (d, to) => m.push(`<path class="km" style="--i:${m.length};--to:${to}" d="${d}"/>`);
    if (v === "a") {
      add(trk(qc([0, -57], [2, -36], [0, -10], 12), 9, 0, .9), "50% 0%");
      [-1, 1].forEach((s) => { add(trk(qc([s * 18, -55], [s * 26, -38], [s * 24, -14], 12), 5.5, 0, .85), "50% 0%"); add(trk(qc([s * 28, 8], [s * 41, 18], [s * 34, 46], 12), 7, 0, .8), "50% 0%"); });
    } else if (v === "b") {
      /* leque de cunhas que sai do alto de um lado só */
      [[2.2, 62, 8], [2.0, 56, 7], [1.8, 50, 6], [1.62, 42, 5]].forEach(([a, L, w]) => { const x0 = 34, y0 = -50, pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([x0 + Math.cos(a) * L * t, y0 + Math.sin(a) * L * t + Math.sin(t * 3) * 1.2]); } add(trk(pts, w, 0, .85), "50% 0%"); });
      add(trk(qc([-20, 18], [-30, 30], [-22, 52], 10), 6, 0, .8), "50% 0%");
    } else {
      add(trk(qc([0, -57], [0, -30], [0, -2], 12), 11, 0, .9), "50% 0%");
      [-1, 1].forEach((s) => add(trk(qc([s * 26, 20], [s * 36, 30], [s * 26, 50], 12), 6, 0, .8), "50% 0%"));
    }
    return m.join("");
  }
  function mascaraGrupo(p, v, seed) {
    const R = PRNG(seed);
    const olho = (s) => { const q = (x, y) => f(s * x) + " " + f(y); return `M${q(7, -3)}Q${q(18, -17)} ${q(33, -19)}Q${q(29, -8)} ${q(17, 0)}Q${q(11, 3)} ${q(7, -3)}Z`; };
    const olhoIn = (s) => { const q = (x, y) => f(s * x) + " " + f(y); return `M${q(10, -4)}Q${q(19, -14)} ${q(29, -16)}Q${q(26, -8)} ${q(17, -2)}Q${q(13, 0)} ${q(10, -4)}Z`; };
    const dentes = []; for (let x = -24; x <= 24; x += 6) { const y = 41 - (x * x) / 60; dentes.push(`<path d="M${x - 2} ${f(y)}L${x + 2} ${f(y)}L${x + 1.4} ${f(y + 9)}L${x - 1.4} ${f(y + 9)}Z"/>`); }
    const V = []; const rv = PRNG(seed + 3);
    veias(rv, -34, -44, 1.15, v === "c" ? 70 : 52, 2.4, 1, V); veias(rv, 30, 30, -2.3, 30, 1.7, 0, V);
    const cl = CONT2; const cd = suave(cl);
    const cara = `<path d="${cd}" fill="url(#${p}-os)" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <g clip-path="url(#${p}-cc)"><path d="M0 -70L60 -70L60 80L0 80Z" fill="#7d6f4f" fill-opacity=".17"/><path d="M-30 -56L-44 -20L-38 20L-26 -16Z" fill="#fcf7e8" fill-opacity=".5"/>
      <g fill="none" stroke="#6e6247" stroke-opacity=".5" stroke-width=".8" stroke-linecap="round">${[-1, 1].map((s) => `<path d="M${s * 36} -34Q${s * 20} -48 ${s * 4} -46M${s * 40} -20Q${s * 24} -36 ${s * 8} -34M${s * 36} 16Q${s * 28} 30 ${s * 18} 38"/>`).join("")}</g></g>
      <path d="${suave(cl.map(([x, y]) => [x * .92, y * .93]))}" fill="none" stroke="#fcf7e8" stroke-opacity=".5" stroke-width=".8"/>
      <path d="M0 6L-4 22Q0 19 4 22Z" fill="${INK}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M-14 46Q0 51 14 46" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/><path d="M-6 42L-6 50M0 42L0 52M6 42L6 50" stroke="${INK}" stroke-width="1" stroke-linecap="round"/>
      <path d="${olho(-1)}${olho(1)}" fill="${INK}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
      <path class="tk-olho" d="${olhoIn(-1)}${olhoIn(1)}" fill="${VERM}"/>
      <g class="tk-listras">${listras(v)}</g>
      <path d="${V.map((q) => q.d).join("")}" fill="${INK}"/>`;
    return { cara, cd };
  }

  /* o vazio: disco de carvão com borda granulada, rabiscos de carvão e (variantes) pingos ou anel de pincel */
  function vazio(p, v, seed) {
    const R = PRNG(seed), C = 250, RR = 168;
    let ring = `<circle cx="${C}" cy="${C}" r="${RR * 1.32}" fill="url(#${p}-rg)"/>`;
    let nucleo = `<circle cx="${C}" cy="${C}" r="${RR * .8}" fill="var(--tk-nucleo)" filter="url(#${p}-fa)"/>`;
    let extra = "";
    if (v === "b") {
      /* vazio que escorre: pingos negros caem da borda de baixo */
      let g = ""; for (let i = 0; i < 7; i++) { const a = 1.2 + i * .24 + (R() - .5) * .1, x0 = C + Math.cos(a) * RR * .84, y0 = C + Math.sin(a) * RR * .84, L = 40 + R() * 84; g += `<path d="${trk([[x0, y0], [x0 + (R() - .5) * 5, y0 + L * .5], [x0 + (R() - .5) * 8, y0 + L]], 14 + R() * 8, 3, .9)}"/><circle cx="${f(x0)}" cy="${f(y0 + L + 4)}" r="${f(3 + R() * 5)}"/>`; }
      extra = `<g fill="var(--tk-nucleo)" filter="url(#${p}-fa)">${g}</g>`;
    } else if (v === "c") {
      /* anel de pincel (ensō): três arcos largos de tinta seca em volta de um núcleo menor */
      nucleo = `<circle cx="${C}" cy="${C}" r="${RR * .6}" fill="var(--tk-nucleo)" filter="url(#${p}-fa)"/>`;
      const arco = (a0, a1, r, w0, w1) => { const pts = []; for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]); } return trk(pts, w0, w1, .7); };
      extra = `<g fill="var(--tk-nucleo)" filter="url(#${p}-fp)">${arco(-2.6, 2.2, RR * .78, 52, 8)}${arco(.4, 5.4, RR * .9, 34, 6)}${arco(2.2, 5.6, RR * .68, 40, 4)}</g>`;
      ring = `<circle cx="${C}" cy="${C}" r="${RR * 1.2}" fill="url(#${p}-rg2)"/>`;
    }
    /* rabiscos de carvão acompanhando a borda (cada um é um traço fino e curto) */
    let rab = "", rab2 = "", rab3 = "";
    const nr = v === "c" ? 90 : 150;
    for (let i = 0; i < nr; i++) {
      const a0 = R() * 6.2832, len = .12 + R() * .7, r0 = RR * (.74 + R() * .42), dr = (R() - .5) * 22, pts = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8, a = a0 + len * t, r = r0 + dr * t + Math.sin(t * 7 + i) * 3; pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]); }
      const d = "M" + P(pts); if (i % 5 === 0) rab3 += d; else if (i % 2) rab2 += d; else rab += d;
    }
    const esc = `<g fill="none" stroke="var(--tk-tinta)" stroke-linecap="round" stroke-linejoin="round" filter="url(#${p}-fb)"><path d="${rab}" stroke-width="1.5" stroke-opacity=".75"/><path d="${rab2}" stroke-width="2.6" stroke-opacity=".55"/><path d="${rab3}" stroke-width="4.4" stroke-opacity=".4"/></g>`;
    return `<defs>
      <radialGradient id="${p}-rg" cx="${C}" cy="${C}" r="${RR * 1.32}" gradientUnits="userSpaceOnUse"><stop offset=".56" stop-color="#000"/><stop offset=".66" stop-color="#000" stop-opacity=".9"/><stop offset=".8" stop-color="#000" stop-opacity=".42"/><stop offset=".92" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-rg2" cx="${C}" cy="${C}" r="${RR * 1.2}" gradientUnits="userSpaceOnUse"><stop offset=".5" stop-color="#000" stop-opacity=".9"/><stop offset=".72" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      ${filtroCarvao(p)}${filtroAspero(p, "fa", 40, ".022", 9)}${filtroAspero(p, "fb", 8, ".05", 3)}${filtroPincel(p, 30, true)}</defs>
      <g class="tk-giz" filter="url(#${p}-fc)">${ring}</g>${nucleo}${extra}${esc}`;
  }
  function respingosM(p, v, seed) {
    const R = PRNG(seed), C = 250; let g = "";
    const n = v === "b" ? 55 : 80;
    for (let i = 0; i < n; i++) { const a = R() * 6.2832, r = 168 * (1.02 + Math.pow(R(), 1.7) * .52), s = .8 + Math.pow(R(), 3) * 5.6; const x = C + Math.cos(a) * r, y = C + Math.sin(a) * r; g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" opacity="${f(.45 + R() * .5)}"/>`; if (s > 3.8) for (let k = 0; k < 3; k++) g += `<circle cx="${f(x + (R() - .5) * 20)}" cy="${f(y + (R() - .5) * 20)}" r="${f(.6 + R() * 1.4)}" opacity=".7"/>`; }
    return `<g fill="var(--tk-tinta)">${g}</g>`;
  }

  function mascara(p, v, seed) {
    if (FOTO) return mascaraFoto(p, COR.mascara);
    v = v || VAR.mascara; seed = seed || 21;
    const { cara, cd } = mascaraGrupo(p, v, seed);
    const sq = (cls, inner, extra) => `<svg class="tk-sq ${cls}" viewBox="0 0 500 500" aria-hidden="true" focusable="false" ${extra || ""}>${inner}</svg>`;
    const FACE = cara;
    const cx = v === "b" ? "translate(250 244) rotate(-11) scale(.8)" : "translate(250 250) rotate(-7) scale(.8)";
    const masc = `<defs>
      <linearGradient id="${p}-os" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#fcf7e8"/><stop offset=".55" stop-color="#e6dcc0"/><stop offset="1" stop-color="#b3a584"/></linearGradient>
      <clipPath id="${p}-cc"><path d="${cd}"/></clipPath><clipPath id="${p}-pa"><path d="${CL_A}"/></clipPath><clipPath id="${p}-pb1"><path d="${CL_B1}"/></clipPath><clipPath id="${p}-pb2"><path d="${CL_B2}"/></clipPath>
      <filter id="${p}-bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
      ${filtroAspero(p, "fm", 2.4, ".08", 1.2)}</defs>
      <g transform="${cx}"><g class="tk-mg" filter="url(#${p}-fm)">
        <g class="tk-pA"><g clip-path="url(#${p}-pa)">${FACE}</g></g>
        <g class="tk-pB1"><g clip-path="url(#${p}-pb1)">${FACE}</g></g>
        <g class="tk-pB2"><g clip-path="url(#${p}-pb2)">${FACE}</g></g></g>
        <path class="tk-fio-b" d="${cd}" pathLength="100" fill="none" stroke="${VERM}" stroke-width="5" stroke-linejoin="round" filter="url(#${p}-bl)"/>
        <path class="tk-fio" d="${cd}" pathLength="100" fill="none" stroke="${VERM2}" stroke-width="1.5" stroke-linejoin="round"/>
        <path class="tk-seam" d="${SEAM}" fill="none" stroke="${VERM2}" stroke-width="2.4" stroke-linejoin="round" filter="url(#${p}-bl)"/></g>`;
    const fx = `<defs><radialGradient id="${p}-hl"><stop offset="0" stop-color="${VERM}" stop-opacity=".55"/><stop offset=".5" stop-color="${VERM}" stop-opacity=".16"/><stop offset="1" stop-color="${VERM}" stop-opacity="0"/></radialGradient></defs>
      <circle class="tk-halo" cx="250" cy="250" r="92" fill="url(#${p}-hl)"/><circle class="tk-onda" cx="250" cy="250" r="34" fill="none" stroke="${VERM}" stroke-width="3"/>`;
    return `<div class="tk tk-m" data-v="${v}" aria-hidden="true">${papel(p, 120, 34, "m")}${placas(p, seed + 1, "m")}
      ${sq("tk-resp", respingosM(p, v, seed + 5))}${sq("tk-vazio", vazio(p, v, seed + 9))}${sq("tk-fx", fx)}${sq("tk-masc", masc)}</div>`;
  }

  /* =================================================================== RESURRECCIÓN / SEGUNDA ETAPA */
  const CORPO = [[500, 236], [538, 244], [566, 278], [570, 322], [552, 356], [596, 376], [672, 404], [726, 452], [748, 520], [766, 640], [800, 800], [830, 1010], [840, 1100]];
  const corpoPath = () => suave(CORPO.concat([[160, 1100]], CORPO.slice(1, -1).reverse().map(([x, y]) => [1000 - x, y])));
  /* meia largura do corpo por altura (só para os respingos não caírem em cima da silhueta) */
  const larg = (y) => y < 236 ? 0 : y < 340 ? 70 : y < 400 ? 70 + (y - 340) * 2.4 : y < 500 ? 214 + (y - 400) * .5 : 264 + (y - 500) * .6;

  function silhueta(v, R) {
    let ap = "";
    const H = (pts, w0, w1, pot) => trkM(pts, w0, w1, pot);
    if (v === "a") {
      /* CHIFRES CURVOS + mechas largas de pincel */
      ap += H(cc([548, 262], [640, 270], [716, 200], [698, 108], 24), 84, 0, .8);
      ap += H(cc([698, 108], [686, 74], [650, 52], [622, 52], 12), 0, 0, 1);
      ap += H(cc([554, 296], [650, 330], [760, 300], [826, 226], 24), 46, 0, .8);
      ap += H(cc([590, 384], [700, 330], [840, 340], [960, 420], 26), 70, 0, .7);
      ap += H(cc([600, 400], [720, 400], [860, 470], [980, 600], 26), 90, 0, .72);
      ap += H(cc([610, 430], [740, 480], [840, 600], [900, 760], 26), 84, 0, .75);
      ap += H(cc([590, 330], [690, 230], [800, 170], [930, 170], 24), 52, 0, .75);
      ap += H(cc([640, 450], [760, 560], [790, 700], [750, 860], 26), 74, 0, .8);
      ap += H(cc([590, 420], [650, 500], [660, 600], [640, 700], 20), 52, 0, .8);
    } else if (v === "b") {
      /* ASAS DE MORCEGO: braço ósseo, cinco dedos e membrana com bordas em arco; chifrinhos curtos */
      const W = [880, 196], T = [[992, 104], [996, 262], [966, 424], [900, 560], [800, 640]], S = [610, 396], B = [704, 590];
      let mem = `M${S[0]} ${S[1]}Q680 330 ${W[0]} ${W[1]}`;
      T.forEach((t, i) => { const prev = i === 0 ? W : T[i - 1]; const mx = (prev[0] + t[0]) / 2, my = (prev[1] + t[1]) / 2; mem += `Q${f(mx * .78 + W[0] * .22)} ${f(my * .78 + W[1] * .22 + 20)} ${t[0]} ${t[1]}`; });
      mem += `Q${f((T[4][0] + B[0]) / 2 - 10)} ${f((T[4][1] + B[1]) / 2 - 36)} ${B[0]} ${B[1]}Q650 520 ${S[0]} ${S[1] + 30}Z`;
      const m2 = mem.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (s, a, b) => f(1000 - a) + " " + b);
      ap += mem + m2;
      ap += H(cc(S, [680, 330], [780, 250], W, 20), 40, 22, .8);
      T.forEach(([x, y], i) => { ap += H(qc(W, [(W[0] + x) / 2 + 6, (W[1] + y) / 2 - 18], [x, y], 18), 18 - i, 0, .8); });
      ap += H(cc([548, 262], [596, 232], [612, 180], [596, 140], 14), 30, 0, .85);
      ap += H(cc([480 + 100, 300], [640, 300], [680, 270], [690, 230], 12), 16, 0, .8);
    } else {
      /* MANDÍBULA E GARRAS: coroa de presas em leque, braços longos que terminam em garras e cauda enrolada */
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .26, r0 = 58, r1 = 250 + (4 - Math.abs(i - 4)) * 30 - Math.abs(i - 4) * 14, bend = (i - 4) * .05; ap += trk(qc([500 + Math.cos(a) * r0, 300 + Math.sin(a) * r0], [500 + Math.cos(a + bend) * (r0 + r1) * .55, 300 + Math.sin(a + bend) * (r0 + r1) * .55], [500 + Math.cos(a + bend * 2.4) * r1, 300 + Math.sin(a + bend * 2.4) * r1], 14), 40 - Math.abs(i - 4) * 3, 0, .85); }
      ap += H(cc([610, 398], [720, 430], [780, 540], [800, 680], 24), 66, 20, .8);
      [[800, 680, 868, 770], [800, 680, 826, 788], [800, 680, 774, 790], [800, 680, 906, 724]].forEach(([x0, y0, x1, y1], i) => { ap += H(qc([x0, y0], [x0 + (x1 - x0) * .2 + 26, y0 + (y1 - y0) * .55], [x1, y1], 12), 24 - i * 2, 0, .75); });
      ap += trk(cc([700, 940], [900, 920], [1000, 760], [940, 600], 26), 70, 4, .85);
      ap += trk(cc([940, 600], [926, 560], [890, 540], [870, 560], 12), 14, 0, 1);
    }
    return ap;
  }

  function respingosR(seed, v) {
    const R = PRNG(seed); let g = "", n = 0, tent = 0;
    while (n < 300 && tent++ < 6000) {
      const y = 90 + R() * 920, x = R() * 1000, hw = larg(y);
      const baixo = y > 560 ? 1 : 0;
      if (Math.abs(x - 500) < hw + 14) continue;
      if (R() > (baixo ? .85 : .5) - Math.abs(x - 500) / 1500) continue;
      const s = .9 + Math.pow(R(), 3.4) * 15; g += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" opacity="${f(.8 + R() * .2)}"/>`; n++;
      if (s > 7) for (let k = 0; k < 4; k++) g += `<circle cx="${f(x + (R() - .5) * 60)}" cy="${f(y + (R() - .5) * 60)}" r="${f(.8 + R() * 3)}" opacity=".85"/>`;
    }
    /* pingos alongados (escorrendo) */
    for (let i = 0; i < 14; i++) { const x = 40 + R() * 920, y = 120 + R() * 800; if (Math.abs(x - 500) < larg(y) + 14) continue; g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(1.5 + R() * 3)}" ry="${f(4 + R() * 12)}" transform="rotate(${f((R() - .5) * 50)} ${f(x)} ${f(y)})"/>`; }
    /* centelhas âmbar perto do buraco (só aparecem ligadas) */
    let am = ""; for (let i = 0; i < 12; i++) { const a = R() * 6.2832, r = 100 + R() * 120; am += `<circle cx="${f(500 + Math.cos(a) * r)}" cy="${f(500 + Math.sin(a) * r)}" r="${f(1.5 + R() * 3)}"/>`; }
    return `<g fill="var(--tk-tinta)">${g}</g><g class="tk-fagulhas" fill="var(--tk-ambar)">${am}</g>`;
  }

  function resurreccion(p, v, seed, tipo) {
    if (FOTO) return resurreccionFoto(p, tipo === "s" ? COR.segunda : COR.resurreccion, tipo);
    v = v || VAR.resurreccion; seed = seed || 31; tipo = tipo || "r";
    const R = PRNG(seed), sq = (cls, inner) => `<svg class="tk-sq ${cls}" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">${inner}</svg>`;
    const corpo = corpoPath();
    const ap = silhueta(v, R);
    const apend = `<defs>${filtroPincel(p, 30, true)}</defs><g class="tk-forma" filter="url(#${p}-fp)"><path class="tk-rim" d="${ap}"/><path class="tk-fill" d="${ap}"/></g>`;
    const tronco = `<defs>${filtroPincel(p, 26, false, "ft")}</defs><g class="tk-forma" filter="url(#${p}-ft)"><path class="tk-rim" d="${corpo}"/><path class="tk-fill" d="${corpo}"/></g>`;
    const hr = 68;
    const furo = `<defs><radialGradient id="${p}-hg" cx=".5" cy=".5" r=".6"><stop offset="0" style="stop-color:var(--tk-furo)"/><stop offset=".72" style="stop-color:var(--tk-furo)"/><stop offset="1" style="stop-color:var(--tk-furo2)"/></radialGradient>
      ${filtroAspero(p, "fh", 9, ".03", 4)}</defs>
      <circle class="tk-anel" cx="500" cy="500" r="${hr + 11}" fill="none" filter="url(#${p}-fh)"/>
      <circle cx="500" cy="500" r="${hr}" fill="url(#${p}-hg)" filter="url(#${p}-fh)"/>
      <path class="tk-furo-som" d="M${500 - hr * .84} ${500 + hr * .44}A${hr} ${hr} 0 0 0 ${500 + hr * .84} ${500 + hr * .44}" fill="none" stroke="var(--tk-ambar)" stroke-width="5" stroke-linecap="round" opacity=".0"/>`;
    const ambar = `<defs><filter id="${p}-ab" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
      <circle cx="500" cy="500" r="${hr + 26}" fill="none" stroke="var(--tk-ambar)" stroke-width="14" opacity=".38" filter="url(#${p}-ab)"/>
      <circle cx="500" cy="500" r="${hr + 22}" fill="none" stroke="var(--tk-ambar)" stroke-width="3.6" stroke-dasharray="1 0"/>
      <circle cx="500" cy="500" r="${hr + 36}" fill="none" stroke="var(--tk-ambar)" stroke-width="1.4" stroke-dasharray="3 9" opacity=".8"/>`;
    const onda = `<circle class="tk-onda" cx="500" cy="500" r="${hr + 22}" fill="none" stroke="var(--tk-ambar)" stroke-width="7"/>`;
    return `<div class="tk tk-r" data-v="${v}" data-t="${tipo}" aria-hidden="true">${papel(p, 120, 34, "r")}
      <svg class="tk-aura tk-bg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><radialGradient id="${p}-au" cx=".74" cy=".56" r=".42"><stop offset="0" stop-color="#ff9a1f" stop-opacity=".26"/><stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#${p}-au)"/></svg>${placas(p, seed + 1, "r")}
      ${sq("tk-resp", respingosR(seed + 2, v))}${sq("tk-apend", apend)}${sq("tk-tronco", tronco)}${sq("tk-ambar", ambar)}${sq("tk-furo", furo)}${sq("tk-fx", onda)}</div>`;
  }


  /* =================================================================== BASE EM FOTO (v9, segunda rodada)
     As duas imagens enviadas pelo dono (assets/ao_lado/referencia-*.webp, tons de cinza) viram MÁSCARA DE LUMINÂNCIA: o escuro da foto
     vira "tinta" (alfa) e é pintado com as cores do projeto (cores por variáveis CSS, gradientes). Bordas ásperas e respingos são os da foto.
     Só no protótipo: confirmar autoria/licença antes de ir ao site (ver CREDITOS.md). */
  const FOTO = (() => { try { return new URLSearchParams(location.search).get("arte") !== "gerada"; } catch (e) { return true; } })();
  const IMG_M = "/arte/hollow/mascara-base.webp", IMG_R = "/arte/hollow/resurreccion-base.webp";
  /* filtro: luminância -> alfa (escuro = tinta), resultado branco com alfa, para servir de máscara */
  const fAlfa = (p, extra, k, b) => { k = k || 1.75; b = b || 1.52; return `<filter id="${p}-iw" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -${k} 0 0 0 ${b}"/></filter>
    <filter id="${p}-ir" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -${k} 0 0 0 ${b}" result="a"/><feMorphology in="a" operator="erode" radius="${extra || 5}" result="e"/><feComposite in="a" in2="e" operator="out"/></filter>`; };

  function mascaraFoto(p, cor) {
    cor = cor || "a";
    const W = 735, H = 738, MX = 376, MY = 376;
    const sq = (cls, inner) => `<svg class="tk-sq ${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${inner}</svg>`;
    const ellip = `<ellipse cx="0" cy="0" rx="54" ry="108"/>`;
    const vazio = `<defs>${fAlfa(p)}
      <mask id="${p}-mk" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><image href="${IMG_M}" width="${W}" height="${H}" filter="url(#${p}-iw)"/></mask>
      <radialGradient id="${p}-vg" cx="367" cy="372" r="352" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--tk-g0)"/><stop offset=".74" style="stop-color:var(--tk-g0)"/><stop offset=".84" style="stop-color:var(--tk-g1)"/><stop offset="1" style="stop-color:var(--tk-g2)"/></radialGradient></defs>
      <circle cx="${MX}" cy="${MY}" r="150" fill="var(--tk-g0)"/><rect width="${W}" height="${H}" fill="url(#${p}-vg)" mask="url(#${p}-mk)"/>`;
    /* a máscara: osso pintado pela luminância da própria foto, só dentro do contorno; as listras escuras ficam em tinta e, ligada, em vermelho */
    const mc = `<g clip-path="url(#${p}-mcl)"><rect width="${W}" height="${H}" fill="url(#${p}-os)" mask="url(#${p}-ml)"/>
        <rect class="tk-lis-v" width="${W}" height="${H}" fill="${VERM}" mask="url(#${p}-mk)"/></g>`;
    const masc = `<defs><linearGradient id="${p}-os" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#fcf7e8"/><stop offset=".55" stop-color="#ece4d0"/><stop offset="1" stop-color="#c2b693"/></linearGradient>
      <mask id="${p}-ml" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><image href="${IMG_M}" width="${W}" height="${H}" style="filter:contrast(1.5) brightness(1.05)"/></mask>
      <clipPath id="${p}-mcl"><ellipse rx="54" ry="108" transform="translate(${MX} ${MY}) rotate(9)"/></clipPath>
      <clipPath id="${p}-pa"><path d="${CL_A}" transform="translate(${MX} ${MY}) rotate(9) scale(1.2)"/></clipPath><clipPath id="${p}-pb1"><path d="${CL_B1}" transform="translate(${MX} ${MY}) rotate(9) scale(1.2)"/></clipPath><clipPath id="${p}-pb2"><path d="${CL_B2}" transform="translate(${MX} ${MY}) rotate(9) scale(1.2)"/></clipPath>
      <filter id="${p}-bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter></defs>
      <g class="tk-mg"><g class="tk-pA"><g clip-path="url(#${p}-pa)">${mc}</g></g><g class="tk-pB1"><g clip-path="url(#${p}-pb1)">${mc}</g></g><g class="tk-pB2"><g clip-path="url(#${p}-pb2)">${mc}</g></g></g>
      <g transform="translate(${MX} ${MY}) rotate(9)"><ellipse class="tk-fio-b" rx="54" ry="108" fill="none" stroke="${VERM}" stroke-width="10" filter="url(#${p}-bl)"/><ellipse class="tk-fio" rx="54" ry="108" pathLength="100" fill="none" stroke="${VERM2}" stroke-width="2.6"/>
      <path class="tk-seam" transform="scale(1.2)" d="${SEAM}" fill="none" stroke="${VERM2}" stroke-width="2.4" stroke-linejoin="round" filter="url(#${p}-bl)"/></g>`;
    const fx = `<defs><radialGradient id="${p}-hl"><stop offset="0" stop-color="${VERM}" stop-opacity=".3"/><stop offset=".5" stop-color="${VERM}" stop-opacity=".1"/><stop offset="1" stop-color="${VERM}" stop-opacity="0"/></radialGradient></defs>
      <circle class="tk-halo" cx="${MX}" cy="${MY}" r="170" fill="url(#${p}-hl)"/><circle class="tk-onda" cx="${MX}" cy="${MY}" r="60" fill="none" stroke="${VERM}" stroke-width="5"/>`;
    return `<div class="tk tk-m tk-foto" data-cor="${cor}" aria-hidden="true">${papel(p, 120, 34, "m")}${placas(p, 22, "m")}${sq("tk-vazio", vazio)}${sq("tk-fx", fx)}${sq("tk-masc", masc)}</div>`;
  }

  function resurreccionFoto(p, cor, tipo) {
    cor = cor || "a";
    const W = 736, H = 1472, HX = 409, HY = 730, hr = 80;
    const tiles = (fl) => `<image href="${IMG_R}" width="736" height="1472" filter="url(#${p}-${fl})"/>`;
    const pt = (cls, inner) => `<svg class="tk-pt ${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${inner}</svg>`;
    const foto = `<defs>${fAlfa(p, 5, 7, 3.2)}
      <mask id="${p}-mk" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${tiles("iw")}</mask>
      <mask id="${p}-mr" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">${tiles("ir")}</mask>
      <linearGradient id="${p}-hgr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".07" stop-color="#555"/><stop offset=".2" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset=".93" stop-color="#555"/><stop offset="1" stop-color="#000"/></linearGradient>
      <filter id="${p}-fdf" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".02 .012" numOctaves="3" seed="12" result="n0"/><feColorMatrix in="n0" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="n"/><feComposite in="SourceGraphic" in2="n" operator="arithmetic" k1="0" k2="1" k3=".9" k4="-.45"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter>
      <mask id="${p}-fd" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${p}-hgr)" filter="url(#${p}-fdf)"/></mask>
      <linearGradient id="${p}-cg" x1="0" y1="0" x2="0" y2="1"><stop offset=".25" style="stop-color:var(--tk-c0)"/><stop offset=".75" style="stop-color:var(--tk-c1)"/></linearGradient></defs>
      <g mask="url(#${p}-fd)"><rect width="${W}" height="${H}" fill="url(#${p}-cg)" mask="url(#${p}-mk)"/><rect class="tk-rim-img" width="${W}" height="${H}" fill="var(--tk-rim)" mask="url(#${p}-mr)"/></g>`;
    const furo = `<defs><radialGradient id="${p}-hg" cx=".5" cy=".5" r=".6"><stop offset="0" style="stop-color:var(--tk-furo)"/><stop offset=".72" style="stop-color:var(--tk-furo)"/><stop offset="1" style="stop-color:var(--tk-furo2)"/></radialGradient>
      ${filtroAspero(p, "fh", 8, ".03", 4)}</defs><circle class="tk-anel" cx="${HX}" cy="${HY}" r="${hr + 8}" fill="none" filter="url(#${p}-fh)"/><circle cx="${HX}" cy="${HY}" r="${hr}" fill="url(#${p}-hg)" filter="url(#${p}-fh)"/>`;
    const ambar = `<defs><filter id="${p}-ab" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
      <circle cx="${HX}" cy="${HY}" r="${hr + 22}" fill="none" stroke="var(--tk-ambar)" stroke-width="16" opacity=".38" filter="url(#${p}-ab)"/>
      <circle cx="${HX}" cy="${HY}" r="${hr + 20}" fill="none" stroke="var(--tk-ambar)" stroke-width="3.6"/>
      <circle cx="${HX}" cy="${HY}" r="${hr + 34}" fill="none" stroke="var(--tk-ambar)" stroke-width="1.4" stroke-dasharray="3 9" opacity=".8"/>`;
    const onda = `<circle class="tk-onda" cx="${HX}" cy="${HY}" r="${hr + 20}" fill="none" stroke="var(--tk-ambar)" stroke-width="8"/>`;
    return `<div class="tk tk-r tk-foto" data-cor="${cor}" data-t="${tipo || "r"}" aria-hidden="true">${papel(p, 120, 34, "r")}
      <svg class="tk-aura tk-bg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><radialGradient id="${p}-au" cx=".79" cy=".66" r=".4"><stop offset="0" stop-color="#ff9a1f" stop-opacity=".3"/><stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/></radialGradient></defs><rect width="100" height="100" fill="url(#${p}-au)"/></svg>${placas(p, 32, "r")}
      <svg class="tk-sq tk-resp" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">${respingosR(33, "a")}</svg>${pt("tk-foto-l", foto)}${pt("tk-ambar", ambar)}${pt("tk-furo", furo)}${pt("tk-fx", onda)}</div>`;
  }

  /* tipo "r" (Resurrección) e "s" (Segunda etapa) usam a mesma linguagem; a silhueta muda */
  return { mascara, resurreccion, mascaraFoto, resurreccionFoto, VAR, COR, FOTO };
})();

const FA = (() => {
  const { PRNG, afina, linha, veias, lamina, f } = VA;
  const PH = /^(ligar|cadeado|brilho|relogio|gota-pr|coracao|livro-aberto)$/;
  const ic = (n, cls) => `<svg class="ic ${cls || ""}" viewBox="0 0 ${PH.test(n) ? 256 : 512} ${PH.test(n) ? 256 : 512}" aria-hidden="true" focusable="false"><use href="/arte/sprite.svg#ic-${n}"/></svg>`;
  const pts = (a) => a.map((p) => f(p[0]) + " " + f(p[1])).join("L");

  /* ---------- peças de pincel (shi) ---------- */
  /* disco de pincel: círculo com borda levemente irregular (parece tinta) */
  function disco(R, cx, cy, r, n) {
    n = n || 72; const P = []; let ph = R() * 6.28;
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832, j = 1 + 0.018 * Math.sin(a * 5 + ph) + 0.012 * Math.sin(a * 11 + ph * 2) + (R() - .5) * 0.012; P.push([cx + Math.cos(a) * r * j, cy + Math.sin(a) * r * j]); }
    return "M" + pts(P) + "Z";
  }
  /* nuvem kasumi: faixa horizontal com pontas arredondadas e topo ondulado */
  function kasumi(R, x, y, w, h) {
    const top = [], bot = [], n = 14;
    for (let i = 0; i <= n; i++) { const t = i / n, ex = Math.min(t, 1 - t) * 2, fa = Math.pow(Math.min(1, ex * 3.2), .55); top.push([x + w * t, y - h / 2 * fa * (0.75 + 0.25 * Math.sin(t * 17 + R() * 2)) ]); bot.push([x + w * t, y + h / 2 * fa * (0.9 + 0.1 * Math.sin(t * 9))]); }
    return "M" + pts(top) + "L" + pts(bot.reverse()) + "Z";
  }
  /* capim (susuki): lâminas curvas que afinam + espigas */
  function susuki(R, x, y, n, h, dir) {
    let d = "", spikes = "";
    for (let i = 0; i < n; i++) {
      const bx = x + (R() - .5) * h * .9, tall = h * (.55 + R() * .5), lean = dir * (0.15 + R() * .45) * tall, P = [];
      for (let j = 0; j <= 10; j++) { const t = j / 10; P.push([bx + lean * t * t + Math.sin(t * 3 + i) * 2, y - tall * t]); }
      d += afina(P, 1.9, 0, .8);
      const e = P[P.length - 1]; if (R() < .55) spikes += `M${f(e[0])} ${f(e[1])}l${f(dir * 2.5)} ${f(-9 - R() * 6)}M${f(e[0])} ${f(e[1] + 5)}l${f(-dir * 2.5)} ${f(-8 - R() * 5)}`;
    }
    return { d, spikes };
  }
  /* pincelada seca: corpo + fios finos que ficam para trás */
  function pincelada(R, x0, y0, x1, y1, w, curv) {
    const N = 26, mid = (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * curv];
    const P = Array.from({ length: N + 1 }, (_, i) => mid(i / N));
    let s = afina(P, w, w * .08, .65);
    for (let k = 0; k < 9; k++) {
      const o = (R() - .5) * w * .95, a = .1 + R() * .3, b = .55 + R() * .45, Q = [];
      for (let i = Math.floor(a * N); i <= Math.floor(b * N); i++) Q.push([P[i][0], P[i][1] + o]);
      if (Q.length > 3) s += afina(Q, 1.1 + R() * 2, 0, .6);
    }
    return s;
  }

  /* ---------- peças de osso (hol) ---------- */
  /* placas de osso: grade irregular; cada placa tem 3 tons; suturas escuras entre elas. Devolve [placas, suturas, poros] */
  function placas(R, x0, y0, x1, y1, cols, lins, tons) {
    const Pn = [];
    for (let j = 0; j <= lins; j++) { Pn[j] = []; for (let i = 0; i <= cols; i++) Pn[j][i] = [x0 + (x1 - x0) * i / cols + (i && i < cols ? (R() - .5) * (x1 - x0) / cols * .62 : 0), y0 + (y1 - y0) * j / lins + (j && j < lins ? (R() - .5) * (y1 - y0) / lins * .62 : 0)]; }
    let pl = "", su = "", po = "";
    for (let j = 0; j < lins; j++) for (let i = 0; i < cols; i++) {
      const a = Pn[j][i], b = Pn[j][i + 1], c = Pn[j + 1][i + 1], d = Pn[j + 1][i], t = tons[Math.floor(R() * tons.length)];
      pl += `<path d="M${pts([a, b, c, d])}Z" fill="${t}"/>`;
      /* sutura em dentes entre a placa e a de baixo */
      const n = 7; let z = `M${f(d[0])} ${f(d[1])}`;
      for (let k = 1; k <= n; k++) { const tt = k / n, X = d[0] + (c[0] - d[0]) * tt, Y = d[1] + (c[1] - d[1]) * tt; z += `L${f(X + (k % 2 ? 2.2 : -2.2))} ${f(Y + (k % 2 ? -2.6 : 2.6))}`; }
      su += z; su += `M${f(b[0])} ${f(b[1])}L${f(c[0])} ${f(c[1])}`;
      for (let k = 0; k < 3; k++) { const px = a[0] + (c[0] - a[0]) * R(), py = a[1] + (c[1] - a[1]) * R(); po += `<ellipse cx="${f(px)}" cy="${f(py)}" rx="${f(.8 + R() * 1.6)}" ry="${f(.5 + R())}" />`; }
    }
    return [pl, su, po];
  }
  /* contorno da máscara Hollow. cx,cy centro; sx,sy raio; dentes na base */
  function mascaraPath(cx, cy, sx, sy, dentes) {
    const H = [[0, -1], [.5, -.97], [.86, -.66], [.95, -.14], [.84, .36], [.58, .72], [.4, .88]];
    const R_ = H.map(([x, y]) => [cx + x * sx, cy + y * sy]), L = H.slice().reverse().map(([x, y]) => [cx - x * sx, cy + y * sy]);
    let tooth = []; const n = dentes || 7, xa = cx + .4 * sx, xb = cx - .4 * sx;
    for (let i = 0; i <= n * 2; i++) { const t = i / (n * 2); tooth.push([xa + (xb - xa) * t, cy + sy * (i % 2 ? 1.2 : .9)]); }
    return "M" + pts(R_.concat(tooth, L)) + "Z";
  }
  const olhoPath = (cx, cy, sx, sy, lado) => { const o = lado, p = (x, y) => f(cx + o * x * sx) + " " + f(cy + y * sy); return `M${p(.7, -.2)}Q${p(.44, -.46)} ${p(.12, -.1)}Q${p(.4, .02)} ${p(.7, -.2)}Z`; };

  /* ---------- artes por tipo (cabeçalho) ---------- */
  /* p = prefixo de ids; W,H = viewBox; (ox,oy) centro (sol/máscara); k = escala; v = variante */
  function arteShi(p, W, H, ox, oy, k, seed, v) {
    const R = PRNG(seed), id = (n) => `${p}-${n}`, big = v !== "shikai", ecl = v === "verdadeira";
    const rS = (v === "shikai" ? 78 : v === "bankai" ? 92 : 100) * k;
    /* nuvens kasumi */
    let nuv = "";
    const faixas = [[.17, .46, .5, 24], [.37, .30, .62, 30], [.58, .50, .55, 32], [.78, .38, .6, 26], [.92, .60, .4, 20]];
    faixas.forEach(([fy, fx, fw, fh], i) => { const d = kasumi(R, W * fx, H * fy, W * fw, fh * k); nuv += `<g class="nv nv-${i % 2 ? "d" : "e"}" style="--i:${i}"><path d="${d}" fill="${i === 1 || i === 3 ? "#b3122e" : "#f6ece4"}" fill-opacity="${i === 1 || i === 3 ? .34 : .17 + i * .03}" stroke="#f6ece4" stroke-opacity=".5" stroke-width="${f(.9 * k)}"/></g>`; });
    /* capim e morro */
    const sk = susuki(R, ox - 330 * k, H + 4, big ? 15 : 11, 138 * k, 1), sk2 = susuki(R, ox + 200 * k, H + 4, 9, 118 * k, -1);
    const morro = `M0 ${H}V${f(H * .78)}C${f(W * .08)} ${f(H * .64)} ${f(W * .16)} ${f(H * .86)} ${f(W * .27)} ${f(H * .74)}C${f(W * .36)} ${f(H * .66)} ${f(W * .43)} ${f(H * .8)} ${f(W * .5)} ${f(H * .78)}V${H}Z M${f(W * .72)} ${H}V${f(H * .9)}C${f(W * .8)} ${f(H * .82)} ${f(W * .9)} ${f(H * .93)} ${W} ${f(H * .86)}V${H}Z`;
    /* sol com disco de pincel; auréola de pinceladas curtas */
    let sol = `<circle cx="${ox}" cy="${oy}" r="${f(rS * 1.9)}" fill="url(#${id("hl")})"/>`;
    sol += `<path d="${disco(R, ox, oy, rS * 1.22, 80)}" fill="none" stroke="#b3122e" stroke-opacity=".55" stroke-width="${f(1.2 * k)}" stroke-dasharray="${f(14 * k)} ${f(6 * k)} ${f(3 * k)} ${f(6 * k)}"/>`;
    sol += `<path d="${disco(R, ox, oy, rS, 90)}" fill="url(#${id("sol")})"/>`;
    sol += `<path d="${disco(R, ox, oy, rS * .86, 80)}" fill="none" stroke="#f6ece4" stroke-opacity=".35" stroke-width="${f(1 * k)}"/>`;
    let extra = "";
    if (big) {
      /* kokuen: línguas de chama negra com borda carmesim, subindo ao redor do sol */
      let ch = ""; const nF = ecl ? 11 : 8;
      for (let i = 0; i < nF; i++) { const bx = ox - rS * 2.2 + i * (rS * 4.4 / (nF - 1)) + (R() - .5) * 14 * k, P = []; const alt = (ecl ? 150 : 120) * k * (.55 + R() * .7), sw = (R() - .5) * 60 * k; for (let j = 0; j <= 14; j++) { const t = j / 14; P.push([bx + sw * Math.sin(t * 3.2 + i) * t, H + 6 - alt * t]); } ch += `<path d="${afina(P, 20 * k, 0, .9)}" fill="#050203" stroke="#b3122e" stroke-width="${f(.9 * k)}" stroke-opacity=".85"/>`; }
      extra += `<g class="kokuen">${ch}</g>`;
      /* meia-lua do Getsuga cortando o sol */
      const cr = rS * 1.5, cxm = ox - rS * .55, cym = oy + rS * .1;
      extra += `<g class="lua"><path d="M${f(cxm - cr)} ${f(cym)}A${f(cr)} ${f(cr)} 0 0 1 ${f(cxm + cr)} ${f(cym)}A${f(cr * 1.06)} ${f(cr * .86)} 0 0 0 ${f(cxm - cr)} ${f(cym)}Z" fill="#050203" stroke="#ff4d6a" stroke-width="${f(1.4 * k)}" transform="rotate(-18 ${ox} ${oy})"/></g>`;
    }
    if (ecl) {
      /* eclipse: disco negro sobre o sol, coroa de lâminas carmesim, correntes */
      let co = ""; for (let i = 0; i < 28; i++) { const a = i / 28 * 6.2832 + R() * .1; co += `<path d="${lamina(ox + Math.cos(a) * rS * .82, oy + Math.sin(a) * rS * .82, a, rS * (.5 + R() * .75), 4.2 * k, 0)}" fill="#ff4d6a" fill-opacity="${f(.45 + R() * .4)}"/>`; }
      extra += `<g class="coroa">${co}<path d="${disco(R, ox, oy, rS * .8, 90)}" fill="#050203" stroke="#ff4d6a" stroke-width="${f(1.6 * k)}"/></g>`;
      let el = "", cadeia = (x0, y0, x1, y1, n) => { let s = ""; for (let i = 0; i < n; i++) { const t = (i + .5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 22 * k, a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + (i % 2 ? 90 : 0); s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(9 * k)}" ry="${f(4.8 * k)}" transform="rotate(${f(a)} ${f(x)} ${f(y)})" fill="none" stroke="${i % 2 ? "#f6ece4" : "#ff4d6a"}" stroke-width="${f(2.2 * k)}"/>`; } return s; };
      el += cadeia(ox - rS * 3.1, oy - rS * .9, ox - rS * .95, oy - rS * .1, 12) + cadeia(ox + rS * 3.1, oy - rS * .7, ox + rS * .95, oy + rS * .05, 10) + cadeia(ox - rS * 2.4, oy + rS * 1.5, ox - rS * .7, oy + rS * .55, 9);
      extra += `<g class="corr">${el}</g>`;
    }
    /* pincelada grande atravessando (separada, para a animação de desenhar) */
    const pinc = `<path d="${pincelada(R, W * .02, oy + rS * .55, W * .98, oy - rS * .3, (big ? 30 : 20) * k, -26 * k)}" fill="${ecl ? "#b3122e" : "#f6ece4"}" fill-opacity="${ecl ? .55 : .20}"/><path d="${pincelada(R, W * .1, oy + rS * 1.05, W * .88, oy + rS * .55, 12 * k, 14 * k)}" fill="#b3122e" fill-opacity=".7"/>`;
    const grao = Array.from({ length: 90 }, () => `<circle cx="${f(R() * W)}" cy="${f(R() * H)}" r="${f(.5 + R() * 1.2)}" fill="#f6ece4" fill-opacity="${f(.03 + R() * .07)}"/>`).join("");
    return `<svg class="arte-s" style="--ox:${ox}px;--oy:${oy}px" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
  <defs><radialGradient id="${id("sol")}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#e8294a"/><stop offset=".6" stop-color="#b3122e"/><stop offset="1" stop-color="#6d0a1d"/></radialGradient>
  <radialGradient id="${id("hl")}"><stop offset="0" stop-color="#e0314f" stop-opacity=".55"/><stop offset="1" stop-color="#b3122e" stop-opacity="0"/></radialGradient>
  <linearGradient id="${id("bg")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#140a0e"/><stop offset="1" stop-color="#070305"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#${id("bg")})"/><g class="grao">${grao}</g>
  <g class="s-sol">${sol}</g>${extra}
  <g class="s-nuvens">${nuv}</g>
  <g class="s-morro"><path d="${morro}" fill="#050203"/><path d="M0 ${f(H * .78)}C${f(W * .08)} ${f(H * .64)} ${f(W * .16)} ${f(H * .86)} ${f(W * .27)} ${f(H * .74)}C${f(W * .36)} ${f(H * .66)} ${f(W * .43)} ${f(H * .8)} ${f(W * .5)} ${f(H * .78)}" fill="none" stroke="#b3122e" stroke-width="${f(1.4 * k)}"/>
    <path d="${sk.d}${sk2.d}" fill="#f6ece4" fill-opacity=".62"/><path d="${sk.spikes}${sk2.spikes}" fill="none" stroke="#f6ece4" stroke-opacity=".55" stroke-width="${f(1 * k)}" stroke-linecap="round"/></g>
  <circle class="s-anel" cx="${ox}" cy="${oy}" r="${f(rS)}" fill="none" stroke="#ff4d6a" stroke-width="${f(3 * k)}"/>
</svg><svg class="arte-p" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false"><g class="s-pincel">${pinc}</g></svg>`;
  }

  function arteHol(p, W, H, ox, oy, k, seed, v) {
    const R = PRNG(seed), id = (n) => `${p}-${n}`, M = v === "mascara", S = v === "segunda";
    const sx = (M ? 92 : S ? 80 : 84) * k, sy = (M ? 118 : S ? 112 : 108) * k;
    const [pl, su, po] = placas(R, ox - 560 * k, -10, W + 10, H + 10, 18, 4, ["#b7aa89", "#aa9d7c", "#9c8f6f", "#8f8364"]);
    /* silhueta grande ao fundo (ícone): crânio de chifres, asas de morcego ou máscara rachada */
    const fundo = M ? `<use href="/arte/sprite.svg#ic-mascara-rachada" x="${f(ox - 250 * k)}" y="${f(oy - 250 * k)}" width="${f(500 * k)}" height="${f(500 * k)}"/>`
      : S ? `<g transform="translate(${ox} ${oy - 20 * k}) scale(${f(-1.7 * k)} ${f(1.7 * k)}) translate(-256 -256)"><use href="/arte/sprite.svg#ic-asa-morcego" width="512" height="512"/></g><g transform="translate(${ox} ${oy - 20 * k}) scale(${f(1.7 * k)} ${f(1.7 * k)}) translate(-256 -256)"><use href="/arte/sprite.svg#ic-asa-morcego" width="512" height="512"/></g>`
      : `<use href="/arte/sprite.svg#ic-cranio-chifres" x="${f(ox - 270 * k)}" y="${f(oy - 270 * k)}" width="${f(540 * k)}" height="${f(540 * k)}"/>`;
    /* chifres (Resurrección: uma crista; Segunda: dois chifres longos) */
    let chifres = "";
    if (!M) { const pa = (dx, a0, L, w) => { const P = []; for (let i = 0; i <= 16; i++) { const t = i / 16; P.push([ox + dx * sx * (.55 + t * 1.15 * (S ? 1.25 : .6)), oy - sy * .85 - Math.pow(t, 1.5) * L * (S ? 1.0 : .55) + Math.sin(t * 2) * 6 * k]); } return afina(P, w, 0, .8); }; chifres = `<path d="${pa(-1, 0, 190 * k, 30 * k)}${pa(1, 0, 190 * k, 30 * k)}" fill="url(#${id("os")})" stroke="#15101b" stroke-width="${f(1.4 * k)}"/>`; }
    /* fissuras: tapered, partem do centro da testa e se ramificam */
    const V = []; const rv = PRNG(seed + 31);
    [[-Math.PI / 2 + .1, 150 * k, 5 * k, 3], [-Math.PI / 2 - .5, 110 * k, 3.6 * k, 2], [Math.PI / 2 - .35, 120 * k, 3.6 * k, 2], [0.2, 300 * k, 3 * k, 2], [Math.PI - 0.2, 300 * k, 3 * k, 2], [-0.5, 200 * k, 2.6 * k, 2]].forEach(([a, l, w, pr]) => veias(rv, ox + (a > -1 && a < 1.5 ? sx * .1 : -sx * .1), oy - sy * .15, a, l, w, pr, V));
    const fd = V.map((x) => x.d).join(""), fc = V.map((x, i) => `<path class="corre" pathLength="100" style="--i:${i}" d="${x.c}"/>`).join("");
    const m = mascaraPath(ox, oy, sx, sy, M ? 8 : 6);
    const olE = olhoPath(ox, oy, sx, sy, -1), olD = olhoPath(ox, oy, sx, sy, 1);
    /* lágrimas negras que descem dos olhos (segunda) / marca do Predador */
    const lag = S ? [-1, 1].map((l) => `<path d="${afina(Array.from({ length: 10 }, (_, i) => [ox + l * sx * .42 + Math.sin(i) * 1.5, oy - sy * .06 + i * sy * .1]), 6 * k, 0, .7)}" fill="#15101b"/>`).join("") : "";
    const marca = M ? `<path d="${afina(Array.from({ length: 12 }, (_, i) => [ox - sx * .2 + i * sx * .035, oy - sy * .95 + i * sy * .17 + Math.sin(i * .9) * 5 * k]), 9 * k, 1.5 * k, .8)}" fill="#e5173f"/><path d="${afina(Array.from({ length: 12 }, (_, i) => [ox + sx * .3 - i * .02 * sx, oy - sy * .7 + i * sy * .1]), 6 * k, 0, .8)}" fill="#e5173f" fill-opacity=".9"/>` : "";
    const grao = Array.from({ length: 70 }, () => `<circle cx="${f(R() * W)}" cy="${f(R() * H)}" r="${f(.5 + R() * 1.4)}" fill="#ece4d0" fill-opacity="${f(.03 + R() * .06)}"/>`).join("");
    return `<svg class="arte-s" style="--ox:${ox}px;--oy:${oy}px" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
  <defs><linearGradient id="${id("bg")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#241631"/><stop offset="1" stop-color="#0c0710"/></linearGradient>
  <linearGradient id="${id("os")}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6efdd"/><stop offset=".6" stop-color="#e2d8bf"/><stop offset="1" stop-color="#b9ac8c"/></linearGradient>
  <linearGradient id="${id("mk")}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#fff"/></linearGradient>
  <mask id="${id("mr")}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${id("mk")})"/></mask>
  <radialGradient id="${id("br")}"><stop offset="0" stop-color="#ffc470" stop-opacity=".95"/><stop offset=".35" stop-color="#ff9a1f" stop-opacity=".6"/><stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/></radialGradient>
  <filter id="${id("bl")}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${f(3.4 * k)}"/></filter></defs>
  <rect width="${W}" height="${H}" fill="url(#${id("bg")})"/><g class="grao">${grao}</g>
  <g class="h-fundo" fill="#ece4d0" fill-opacity=".11">${fundo}</g>
  <g class="h-brasa"><circle cx="${ox}" cy="${oy}" r="${f(300 * k)}" fill="url(#${id("br")})"/></g>
  <g class="h-placas" mask="url(#${id("mr")})"><g class="pl">${pl}</g><g class="pl-su" fill="none" stroke="#15101b" stroke-width="${f(1.5 * k)}" stroke-linejoin="round"><path d="${su}"/></g><g fill="#15101b" fill-opacity=".28">${po}</g></g>
  <g class="h-mascara">${chifres}
    <path d="${m}" fill="url(#${id("os")})" stroke="#15101b" stroke-width="${f(2.2 * k)}" stroke-linejoin="round"/>
    <path d="${m}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${f(.9 * k)}" transform="translate(${f(-2 * k)} ${f(-2 * k)})"/>
    ${marca}
    <path d="${olE}${olD}" fill="#15101b"/>
    <g class="h-olho"><path d="${olE}${olD}" fill="#ff9a1f"/><path d="${olE}${olD}" fill="#ffc470" transform="translate(0 ${f(-1.2 * k)}) scale(1)" fill-opacity=".0"/></g>
    ${lag}
  </g>
  <g class="h-fissura">
    <path class="fi-luz" d="${fd}" fill="#ff9a1f" filter="url(#${id("bl")})"/>
    <path d="${fd}" fill="#15101b"/>
    <g class="s-corre" fill="none" stroke="#ffc470" stroke-width="${f(1.5 * k)}" stroke-linecap="round">${fc}</g>
  </g>
  <circle class="s-onda" cx="${ox}" cy="${oy}" r="${f(40 * k)}" fill="none" stroke="#e5173f" stroke-width="${f(3 * k)}"/>
</svg>`;
  }

  /* ---------- símbolos pequenos: cantos, faixas de carta, medalhões ---------- */
  function simbolos() {
    const R = PRNG(77);
    /* faixa 400x70 das cartas de ação */
    const shiArt = (n) => { const r = PRNG(40 + n); const s = susuki(r, 40 + n * 22, 70, 7, 46, 1), nv = kasumi(r, 130 + n * 40, 26 + n * 4, 250, 15), nv2 = kasumi(r, 30, 52 - n * 3, 190, 11);
      return `<symbol id="fa-shi-${n}" viewBox="0 0 400 70" preserveAspectRatio="xMidYMid slice"><rect width="400" height="70" fill="#0d0609"/><path d="${nv}" fill="#f6ece4" fill-opacity=".2" stroke="#f6ece4" stroke-opacity=".5" stroke-width=".9"/><path d="${nv2}" fill="#b3122e" fill-opacity=".3"/>
      <path d="M0 70V54C50 40 90 62 150 52S250 56 300 60S370 50 400 56V70Z" fill="#050203"/><path d="M0 54C50 40 90 62 150 52S250 56 300 60S370 50 400 56" fill="none" stroke="#b3122e" stroke-width="1.2"/>
      <path d="${s.d}" fill="#f6ece4" fill-opacity=".6"/><path d="${s.spikes}" fill="none" stroke="#f6ece4" stroke-opacity=".5" stroke-width=".9"/>
      <path d="${pincelada(r, 200, 20 + n * 6, 400, 14 + n * 4, 7, -5)}" fill="#b3122e" fill-opacity=".45"/></symbol>`; };
    const holArt = (n) => { const r = PRNG(90 + n); const [pl, su] = placas(r, 120, -6, 410, 76, 7, 2, ["#ece4d0", "#e0d5ba", "#d3c8ae"]); const V = []; veias(PRNG(5 + n), 170 + n * 30, 10, 1.4, 70, 2.4, 2, V);
      return `<symbol id="fa-hol-${n}" viewBox="0 0 400 70" preserveAspectRatio="xMidYMid slice"><rect width="400" height="70" fill="#1b1124"/><linearGradient id="fa-hm"><stop offset="0" stop-color="#000"/><stop offset=".35" stop-color="#fff"/></linearGradient><mask id="fa-hmk${n}"><rect width="400" height="70" fill="url(#fa-hm)"/></mask>
      <g mask="url(#fa-hmk${n})"><g>${pl}</g><path d="${su}" fill="none" stroke="#15101b" stroke-width="1.3"/></g><path d="${V.map((x) => x.d).join("")}" fill="#15101b"/></symbol>`; };
    const cantoShi = `<symbol id="fo-c-shi" viewBox="0 0 40 40"><g fill="none" stroke-linecap="round"><path d="M3 20V6Q3 3 6 3H20" stroke="#f6ece4" stroke-width="1.4"/><path d="M8 24V10Q8 8 10 8H24" stroke="#ff4d6a" stroke-width="1"/><circle cx="13" cy="13" r="2.4" fill="#ff4d6a" stroke="none"/><path d="M3 30V34M30 3H34" stroke="#f6ece4" stroke-width="1"/></g></symbol>`;
    const cantoHol = `<symbol id="fo-c-hol" viewBox="0 0 40 40"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22V4H22" stroke="#15101b" stroke-width="3"/><path d="M2 22V4H22" stroke="#ece4d0" stroke-width="1.2"/><path d="M6 6L16 6L13 10L19 10M6 6L6 16L10 13L10 19" stroke="#e5173f" stroke-width="1.1"/><circle cx="13" cy="13" r="3" fill="#15101b" stroke="#ece4d0" stroke-width="1"/></g></symbol>`;
    const cantoHolC = `<symbol id="fo-c-holc" viewBox="0 0 40 40"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22V4H22" stroke="#ece4d0" stroke-width="3"/><path d="M2 22V4H22" stroke="#15101b" stroke-width="1"/><path d="M6 6L16 6L13 10L19 10M6 6L6 16L10 13L10 19" stroke="#b0102f" stroke-width="1.1"/><circle cx="13" cy="13" r="3" fill="#ece4d0" stroke="#15101b" stroke-width="1"/></g></symbol>`;
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${[0, 1, 2].map(shiArt).join("")}${[0, 1, 2].map(holArt).join("")}${cantoShi}${cantoHol}${cantoHolC}
      <linearGradient id="fo-sol" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8294a"/><stop offset="1" stop-color="#8a0c22"/></linearGradient>
      <linearGradient id="fo-verm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a84"/><stop offset="1" stop-color="#d1102f"/></linearGradient>
      <linearGradient id="fo-ambar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc470"/><stop offset="1" stop-color="#ff9a1f"/></linearGradient></defs></svg>`;
  }
  const cantos = (o) => ["tl", "tr", "bl", "br"].map((c) => `<i class="cn cn-${c}" aria-hidden="true"><svg viewBox="0 0 40 40"><use href="#fo-c-${o}"/></svg></i>`).join("");
  const cantosC = () => ["tl", "tr", "bl", "br"].map((c) => `<i class="cn cn-${c}" aria-hidden="true"><svg viewBox="0 0 40 40"><use href="#fo-c-holc"/></svg></i>`).join("");

  /* medalhão: shi = disco de sol (pincel) ; hol = placa de osso com dentes de sutura */
  let medN = 0;
  function medalhao(o, icone) {
    const R = PRNG(300 + (medN++)), n = 28;
    if (o === "shi") return `<span class="fc-med" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="${disco(R, 32, 32, 28, 56)}" fill="url(#fo-sol)"/><path d="${disco(R, 32, 32, 24, 56)}" fill="none" stroke="#f6ece4" stroke-opacity=".6" stroke-width="1"/></svg>${ic(icone, "m-ic")}</span>`;
    const d = Array.from({ length: n * 2 }, (_, i) => { const a = i / (n * 2) * 6.2832, r = i % 2 ? 27 : 30; return f(32 + Math.cos(a) * r) + " " + f(32 + Math.sin(a) * r); }).join("L");
    return `<span class="fc-med" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M${d}Z" fill="#15101b" stroke="#ece4d0" stroke-width="1.6" stroke-linejoin="round"/><circle cx="32" cy="32" r="23" fill="none" stroke="#e5173f" stroke-width="1.1"/></svg>${ic(icone, "m-ic")}</span>`;
  }

  /* indicador de estado: shi = selo de sol; hol = olho */
  function estadoGema(o, on, amber) {
    if (o === "shi") return `<svg class="gema" viewBox="0 0 44 44" aria-hidden="true" focusable="false"><circle cx="22" cy="22" r="18" fill="${on ? "url(#fo-sol)" : "#0b0609"}" stroke="${on ? "#f6ece4" : "#b9a89d"}" stroke-width="1.6" ${on ? "" : 'stroke-dasharray="4 3"'}/><circle cx="22" cy="22" r="13" fill="none" stroke="${on ? "#f6ece4" : "#b9a89d"}" stroke-opacity=".5" stroke-width="1"/>${on ? '<path d="M14 18Q22 12 30 18" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>' : ""}</svg>`;
    return `<svg class="gema" viewBox="0 0 48 36" aria-hidden="true" focusable="false"><path d="M3 20Q14 4 24 8Q36 5 45 20Q34 28 24 27Q12 28 3 20Z" fill="${on ? (amber ? "url(#fo-ambar)" : "url(#fo-verm)") : "#0c0710"}" stroke="${on ? (amber ? "#ffe3b8" : "#ffd0d6") : "#b9ac8c"}" stroke-width="1.6" ${on ? "" : 'stroke-dasharray="4 3"'} stroke-linejoin="round"/>${on ? '<path d="M24 9V27" stroke="#15101b" stroke-width="2.4"/>' : '<path d="M8 20Q24 24 40 20" stroke="#b9ac8c" stroke-width="1.4" fill="none"/>'}</svg>`;
  }

  /* ---------- cartas ---------- */
  const esc = (s) => s;
  let cid = 0;
  const infoBtn = (x) => x.full ? `<button class="fc-i" aria-label="Ler o texto completo de ${x.n}" onclick="this.closest('.cwx').querySelector('details').toggleAttribute('open')">i</button>` : "";
  const trava = () => `<span class="fc-trava">${ic("cadeado")}<span class="vh">travada</span></span>`;

  function cartaAcao(x, o, on, i, semPR) {
    const tags = (x.tags || []).map((t) => `<span class="fc-t">${t}</span>`).join("");
    const pr = x.pr ? `<span class="fc-pr"><b>${x.pr}</b> PR</span>` : "";
    return `<div class="cwx fc-wrap" data-orig="${o}"><article class="fc fc-acao${on ? "" : " off"}" style="--i:${i}" aria-label="${x.n}">
  <div class="fc-top"><svg class="fc-art" aria-hidden="true"><use href="#fa-${o}-${i % 3}"/></svg><span class="fc-tipo">${x.tipo}</span>${medalhao(o, x.ic)}${on ? "" : trava()}</div>
  <h4>${x.n}</h4><div class="fc-tags">${pr}${tags}</div><p>${x.p}</p>
  <div class="fc-act"><button class="fc-b${on ? "" : " fraco"}" ${on ? "" : "disabled"}>${/Acerto/.test(x.b) ? '<svg class="ic"><use href="/arte/sprite.svg#ic-dado"/></svg>' : ""}${on ? x.b : "Ligue a forma"}</button>${infoBtn(x)}</div>
  ${o === "shi" ? cantos("shi") : cantosC()}</article>${completoHTML(x.full)}</div>`;
  }
  function cartaUnica(x, o, on) {
    return `<div class="cwx fc-wrap" data-orig="${o}"><article class="fc fc-unica${on ? "" : " off"}" aria-label="${x.n}">
  ${medalhao(o, x.ic)}<div class="fc-un-c"><span class="fc-rot">${x.rot}</span><h4>${x.n}</h4><p>${x.p}</p><span class="fc-cada">${ic("relogio")}${x.cada}</span>${infoBtn(x)}</div>
  ${o === "shi" ? cantos("shi") : cantos("hol")}</article>${completoHTML(x.full)}</div>`;
  }
  const cartaPassiva = (x, o) => `<div class="fc-pas" data-orig="${o}"><span class="fc-pi" aria-hidden="true">${ic(x.ic)}</span><h4>${x.n}</h4><p>${x.p}</p></div>`;

  return { simbolos, arteShi, arteHol, cantos, cantosC, medalhao, estadoGema, ic, disco, kasumi, susuki };
})();

export { VA, TK, FA };

/* Símbolos das faixas de arte das cartas (hanafuda, osso, reishi, Schrift, Vollständig) e decorações. */
export const DEFS_CARTAS = (function () {
  /* estrela de 8 pontas (Sternritter, abstrata) */
  const estrela = (cx, cy, R, r, n) => Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI / n) * i - Math.PI / 2, k = i % 2 ? r : R;
    return (cx + k * Math.cos(a)).toFixed(1) + "," + (cy + k * Math.sin(a)).toFixed(1);
  }).join(" ");
  /* cruz quincy (cruz com braços que abrem nas pontas), centro cx,cy */
  const cruz = (cx, cy, s) => {
    const P = [[-.3, -1], [.3, -1], [.16, -.34], [.9, -.3], [.9, .3], [.16, .34], [.3, 1], [-.3, 1], [-.16, .34], [-.9, .3], [-.9, -.3], [-.16, -.34]];
    return P.map(([x, y]) => (cx + x * s).toFixed(1) + "," + (cy + y * s).toFixed(1)).join(" ");
  };

  /* asa de reishi: penas que saem de (x,y) abrindo em leque; dir = -1 abre para a esquerda */
  const asa = (x, y, dir, n, L) => Array.from({ length: n }, (_, i) => {
    const a = (-80 + (i * 95) / (n - 1)) * Math.PI / 180, l = L * (1 - i * 0.07), ex = x + dir * l * Math.cos(a + 0.9) * 1.0, ey = y + l * Math.sin(a + 0.9) * 0.55 - 6;
    return `M${x} ${y}Q${(x + ex) / 2 + dir * 4} ${y - 14 - i * 2} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }).join("");
  const defs = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  <!-- ===== SHINIGAMI: sol carmesim sobre colina negra com capim (susuki) ===== -->
  <symbol id="art-shi" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice">
    <rect width="400" height="60" fill="#0b0609"/>
    <path d="M0 60V41C30 29 60 47 100 38C132 31 160 46 180 43V60Z" fill="#050203"/><path d="M0 41C30 29 60 47 100 38C132 31 160 46 180 43" fill="none" stroke="#b3122e" stroke-width="1.2"/>
    <g fill="none" stroke="#f6ece4" stroke-opacity=".6" stroke-width="1" stroke-linecap="round"><path d="M40 50C40 38 44 30 52 24M48 52C48 42 54 34 64 30M130 46C132 36 138 30 148 27"/></g>
    <g transform="translate(180 0)">
    <circle cx="168" cy="26" r="17" fill="#b3122e"/>
    <path d="M0 60V43C26 29 52 47 84 39C112 31 142 49 172 41C194 35 208 39 220 37V60Z" fill="#050203"/>
    <path d="M0 43C26 29 52 47 84 39C112 31 142 49 172 41C194 35 208 39 220 37" fill="none" stroke="#b3122e" stroke-width="1.2"/>
    <g fill="none" stroke="#f6ece4" stroke-opacity=".6" stroke-width="1" stroke-linecap="round">
      <path d="M22 50C22 38 26 30 34 24M30 52C30 42 36 34 46 30M104 46C106 34 112 26 122 22M112 47C114 38 122 32 132 30M196 44C196 34 200 28 208 24"/>
    </g>
    </g>
  </symbol>
  <!-- ===== HOLLOW: placas de osso com suturas e máscara fraturada ===== -->
  <symbol id="art-hol" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice">
    <rect width="400" height="60" fill="#1d1226"/>
    <g fill="#ece4d0"><polygon points="0,0 96,0 88,22 58,38 0,32"/><polygon points="0,38 52,42 70,60 0,60"/><polygon points="100,0 176,0 178,26 138,36 92,28"/><polygon points="76,46 138,42 160,60 90,60"/></g>
    <path d="M0 34L16 44L10 54M96 0L90 12L100 22M176 26L160 38" fill="none" stroke="#15101b" stroke-width="1.2"/>
    <g transform="translate(180 0)">
    <g fill="#ece4d0">
      <polygon points="0,0 66,0 58,20 44,34 0,40"/>
      <polygon points="70,0 132,0 140,18 120,34 62,24"/>
      <polygon points="0,44 40,38 56,60 0,60"/>
      <polygon points="62,28 118,38 100,60 60,60"/>
      <polygon points="136,22 150,30 142,60 106,60 124,38"/>
    </g>
    <g fill="#d3c8ae">
      <polygon points="0,0 66,0 62,8 0,14"/>
      <polygon points="62,28 118,38 114,44 62,34"/>
    </g>
    <path d="M168 4C190 4 206 18 206 34C206 47 198 56 188 56L183 50L178 56L173 50L168 56C158 54 150 45 150 34C150 18 156 4 168 4Z" fill="#15101b" stroke="#ece4d0" stroke-width="1.4"/>
    <polygon points="160,26 172,32 160,36" fill="#ece4d0"/>
    <polygon points="196,26 184,32 196,36" fill="#ece4d0"/>
    <path d="M178 8L174 20L180 26L176 38" fill="none" stroke="#ece4d0" stroke-width="1.6"/>
    <circle cx="24" cy="24" r="6" fill="none" stroke="#15101b" stroke-width="2"/>
    <path d="M70 0L64 12L74 20L66 30M0 34L18 38L30 52M112 38L122 28L136 30" fill="none" stroke="#15101b" stroke-width="1.2"/>
    </g>
  </symbol>
  <!-- ===== QUINCY: cruz, estrela e veias de reishi ===== -->
  <symbol id="art-qui" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice">
    <defs>
      <linearGradient id="qg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c1d36"/><stop offset="1" stop-color="#050b16"/></linearGradient>
      <filter id="qb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <rect width="400" height="60" fill="url(#qg)"/>
    <g fill="none" stroke-linecap="round"><path d="M0 40C30 30 50 50 90 38S140 24 190 32M60 44C70 52 80 56 96 60M120 32C124 20 132 12 144 4" stroke="#2f7bff" stroke-width="3" opacity=".45" filter="url(#qb)"/><path d="M0 40C30 30 50 50 90 38S140 24 190 32M60 44C70 52 80 56 96 60M120 32C124 20 132 12 144 4M30 36C34 24 40 14 50 6" stroke="#5cc8ff" stroke-width="1" opacity=".75"/></g>
    <g transform="translate(180 0)">
    <g fill="none" stroke="#2f7bff" stroke-width="3" stroke-linecap="round" opacity=".7" filter="url(#qb)">
      <path d="M72 30C92 18 104 44 126 30S150 26 158 30M100 32C104 46 110 52 120 60M126 30C130 18 136 10 146 4"/>
    </g>
    <g fill="none" stroke="#5cc8ff" stroke-width="1.1" stroke-linecap="round">
      <path d="M72 30C92 18 104 44 126 30S150 26 158 30M100 32C104 46 110 52 120 60M126 30C130 18 136 10 146 4M90 24C94 14 96 8 102 0M112 38C122 40 128 46 132 56"/>
    </g>
    <polygon points="${cruz(46, 30, 24)}" fill="#0a1626" stroke="#8fd8ff" stroke-width="1.4" stroke-linejoin="round"/>
    <polygon points="${estrela(176, 30, 24, 9, 8)}" fill="#0a1626" stroke="#eef6ff" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="176" cy="30" r="4" fill="#5cc8ff"/>
    </g>
  </symbol>
  <!-- ===== QUINCY / VOLLSTÄNDIG: auréola de 8 pontas e asas de reishi ===== -->
  <symbol id="art-voll" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice">
    <rect width="400" height="60" fill="url(#qg)"/>
    <g fill="none" stroke-linecap="round">
      <path d="${asa(318, 36, -1, 6, 150)}" stroke="#2f7bff" stroke-width="3.2" opacity=".5" filter="url(#qb)"/>
      <path d="${asa(318, 36, -1, 6, 150)}" stroke="#5cc8ff" stroke-width="1.1" opacity=".85"/>
      <path d="${asa(318, 36, 1, 4, 70)}" stroke="#5cc8ff" stroke-width="1" opacity=".6"/>
      <ellipse cx="342" cy="14" rx="30" ry="8" stroke="#eef6ff" stroke-width="1.4"/>
      <ellipse cx="342" cy="14" rx="30" ry="8" stroke="#5cc8ff" stroke-width="4" opacity=".35" filter="url(#qb)"/>
    </g>
    <polygon points="${estrela(342, 36, 17, 6, 8)}" fill="#0a1626" stroke="#eef6ff" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="342" cy="36" r="3.4" fill="#5cc8ff"/>
  </symbol>
  <!-- ===== QUINCY / SCHRIFT: cruz em anel, raios e um relâmpago ===== -->
  <symbol id="art-schrift" viewBox="0 0 400 60" preserveAspectRatio="xMaxYMid slice">
    <rect width="400" height="60" fill="url(#qg)"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 22L52 22L40 34L120 34L96 46L190 46L172 58" stroke="#2f7bff" stroke-width="3.4" opacity=".5" filter="url(#qb)"/>
      <path d="M0 22L52 22L40 34L120 34L96 46L190 46L172 58" stroke="#5cc8ff" stroke-width="1.2" opacity=".9"/>
      <circle cx="346" cy="30" r="25" stroke="#8fd8ff" stroke-width="1.2"/>
      <circle cx="346" cy="30" r="21" stroke="#2b5380" stroke-width="1"/>
      <path d="${Array.from({ length: 16 }, (_, i) => { const a = (Math.PI / 8) * i; return `M${(346 + 27 * Math.cos(a)).toFixed(1)} ${(30 + 27 * Math.sin(a)).toFixed(1)}L${(346 + 34 * Math.cos(a)).toFixed(1)} ${(30 + 34 * Math.sin(a)).toFixed(1)}`; }).join("")}" stroke="#5cc8ff" stroke-width="1" opacity=".7"/>
    </g>
    <polygon points="${cruz(346, 30, 17)}" fill="#0a1626" stroke="#eef6ff" stroke-width="1.3" stroke-linejoin="round"/>
    <circle cx="346" cy="30" r="3" fill="#5cc8ff"/>
  </symbol>
  <!-- ===== PAINEL DA VOLLSTÄNDIG: asas largas e auréola ===== -->
  <symbol id="art-asas" viewBox="0 0 900 120" preserveAspectRatio="xMaxYMid slice">
    <rect width="900" height="120" fill="none"/>
    <g fill="none" stroke-linecap="round">
      <path d="${asa(780, 78, -1, 8, 330)}" stroke="#2f7bff" stroke-width="4" opacity=".4" filter="url(#qb)"/>
      <path d="${asa(780, 78, -1, 8, 330)}" stroke="#5cc8ff" stroke-width="1.2" opacity=".8"/>
      <path d="${asa(780, 78, 1, 6, 130)}" stroke="#5cc8ff" stroke-width="1.1" opacity=".65"/>
      <ellipse cx="800" cy="26" rx="52" ry="12" stroke="#eef6ff" stroke-width="1.6"/>
      <ellipse cx="800" cy="26" rx="52" ry="12" stroke="#5cc8ff" stroke-width="6" opacity=".35" filter="url(#qb)"/>
      <path d="M0 96C60 80 90 108 160 92S260 70 330 88" stroke="#5cc8ff" stroke-width="1" opacity=".35"/>
    </g>
    <polygon points="${estrela(790, 78, 30, 11, 8)}" fill="#0a1626" stroke="#eef6ff" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="790" cy="78" r="6" fill="#5cc8ff"/>
  </symbol>
  <!-- ===== decoração do corpo da carta ===== -->
  <symbol id="deco-hol" viewBox="0 0 220 260" preserveAspectRatio="xMaxYMax slice">
    <g fill="none" stroke="#15101b" stroke-linecap="round" stroke-linejoin="round">
      <path d="M220 250L196 230L200 214L178 196L184 178L166 164M200 214L216 204M178 196L160 200L150 188M184 178L204 170" stroke-width="1.3" opacity=".55"/>
      <path d="M0 96L14 104L10 120L26 128" stroke-width="1.1" opacity=".4"/>
    </g>
  </symbol>
  <symbol id="deco-qui" viewBox="0 0 220 260" preserveAspectRatio="xMaxYMax slice">
    <g fill="none" stroke-linecap="round">
      <path d="M214 60C204 80 220 96 208 120S196 150 210 176S204 220 214 260M208 120C196 124 190 134 184 146M210 176C198 180 194 190 188 204" stroke="#2f7bff" stroke-width="3" opacity=".35"/>
      <path d="M214 60C204 80 220 96 208 120S196 150 210 176S204 220 214 260M208 120C196 124 190 134 184 146M210 176C198 180 194 190 188 204" stroke="#5cc8ff" stroke-width="1" opacity=".8"/>
      <path d="M6 150C14 168 2 184 10 206S14 240 6 260" stroke="#5cc8ff" stroke-width="1" opacity=".45"/>
    </g>
  </symbol>
</defs></svg>`;
  return defs;
})();

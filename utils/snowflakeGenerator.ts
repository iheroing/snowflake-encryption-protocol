/**
 * Deterministic snowflake renderer.
 *
 * One high-entropy visual signature produces one coherent arm, then repeats
 * it at 60 degree intervals. That mirrors the six-fold symmetry of real snow
 * crystals while keeping enough continuous parameters for every letter to
 * receive a recognisably different seal.
 */

export interface SnowflakeLevel {
  position: number;
  length: number;
  angle: number;
  split: number;
}

export interface SnowflakeParams {
  branches: 6;
  complexity: number;
  symmetry: 1;
  /** Compatibility seed for callers that only need one deterministic word. */
  seed: number;
  /** 128 bits of deterministic state; do not collapse this for rendering. */
  seedWords: readonly [number, number, number, number];
  seedKey: string;
  coreRadius: number;
  tipLength: number;
  tipAngle: number;
  levels: readonly SnowflakeLevel[];
}

/** Stable 128-bit non-cryptographic expansion for visual generation. */
export function hashStringWords(value: string): [number, number, number, number] {
  let h1 = 1_779_033_703;
  let h2 = 3_144_134_277;
  let h3 = 1_013_904_242;
  let h4 = 2_773_480_762;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    h1 = h2 ^ Math.imul(h1 ^ code, 597_399_067);
    h2 = h3 ^ Math.imul(h2 ^ code, 2_869_860_233);
    h3 = h4 ^ Math.imul(h3 ^ code, 951_274_213);
    h4 = h1 ^ Math.imul(h4 ^ code, 2_716_044_179);
  }

  h1 = Math.imul(h3 ^ (h1 >>> 18), 597_399_067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2_869_860_233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951_274_213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2_716_044_179);
  return [
    (h1 ^ h2 ^ h3 ^ h4) >>> 0,
    (h2 ^ h1) >>> 0,
    (h3 ^ h1) >>> 0,
    (h4 ^ h1) >>> 0,
  ];
}

/** Stable unsigned 32-bit hash for secondary decoration and compatibility. */
export function hashString(value: string): number {
  return hashStringWords(value)[0];
}

class SeededRandom {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor([a, b, c, d]: readonly [number, number, number, number]) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  next(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    const result = (this.a + this.b + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = (this.b ^ (this.b >>> 9)) >>> 0;
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + result) >>> 0;
    return result / 4_294_967_296;
  }
}

function round(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

export function generateSnowflakeParams(text: string, signature = ''): SnowflakeParams {
  const seedSource = signature.trim() || text.trim() || 'snowflake';
  const seedWords = hashStringWords(`snow-whisper:crystal:v2:${seedSource}`);
  const rng = new SeededRandom(seedWords);
  const complexity = 4 + Math.floor(rng.next() * 3);
  const levels: SnowflakeLevel[] = [];

  for (let index = 0; index < complexity; index += 1) {
    const progress = complexity === 1 ? 0 : index / (complexity - 1);
    levels.push({
      position: round(0.22 + progress * 0.57 + (rng.next() - 0.5) * 0.025),
      length: round(0.13 + progress * 0.09 + rng.next() * 0.045),
      angle: round((37 + rng.next() * 18) * Math.PI / 180),
      split: round(0.48 + rng.next() * 0.18),
    });
  }

  return {
    branches: 6,
    complexity,
    symmetry: 1,
    seed: seedWords[0],
    seedWords,
    seedKey: seedWords.map((word) => word.toString(16).padStart(8, '0')).join(''),
    coreRadius: round(0.045 + rng.next() * 0.025),
    tipLength: round(0.12 + rng.next() * 0.05),
    tipAngle: round((40 + rng.next() * 15) * Math.PI / 180),
    levels,
  };
}

function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  opacity = 1,
): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" stroke-width="${round(width)}" opacity="${round(opacity)}"/>`;
}

function generateArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const pieces: string[] = [];
  const trunkStart = center + radius * params.coreRadius * 0.35;
  const tipX = center + radius;
  pieces.push(line(trunkStart, center, tipX, center, stroke));

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const branchLength = radius * level.length;
    const endX = nodeX + Math.cos(level.angle) * branchLength;
    const offsetY = Math.sin(level.angle) * branchLength;
    const sideWidth = stroke * (0.72 - level.position * 0.18);
    pieces.push(line(nodeX, center, endX, center - offsetY, sideWidth, 0.96));
    pieces.push(line(nodeX, center, endX, center + offsetY, sideWidth, 0.96));

    const splitX = nodeX + (endX - nodeX) * level.split;
    const splitY = offsetY * level.split;
    const twigLength = branchLength * (0.25 + (1 - level.position) * 0.12);
    const twigAngle = level.angle * 0.55;
    pieces.push(line(
      splitX,
      center - splitY,
      splitX + Math.cos(twigAngle) * twigLength,
      center - splitY - Math.sin(twigAngle) * twigLength,
      sideWidth * 0.64,
      0.78,
    ));
    pieces.push(line(
      splitX,
      center + splitY,
      splitX + Math.cos(twigAngle) * twigLength,
      center + splitY + Math.sin(twigAngle) * twigLength,
      sideWidth * 0.64,
      0.78,
    ));
  }

  const tipBranchLength = radius * params.tipLength;
  const tipBaseX = center + radius * 0.82;
  const tipXOffset = Math.cos(params.tipAngle) * tipBranchLength;
  const tipYOffset = Math.sin(params.tipAngle) * tipBranchLength;
  pieces.push(line(tipBaseX, center, tipBaseX + tipXOffset, center - tipYOffset, stroke * 0.62, 0.9));
  pieces.push(line(tipBaseX, center, tipBaseX + tipXOffset, center + tipYOffset, stroke * 0.62, 0.9));
  return pieces.join('');
}

function hexagonPoints(center: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return `${round(center + Math.cos(angle) * radius)},${round(center + Math.sin(angle) * radius)}`;
  }).join(' ');
}

export function generateSnowflakeSVG(params: SnowflakeParams, size = 400): string {
  const renderedSize = Number.isFinite(size)
    ? Math.max(64, Math.min(2_048, Math.round(size)))
    : 400;
  const center = renderedSize / 2;
  const radius = renderedSize * 0.43;
  const stroke = Math.max(1.15, renderedSize / 255);
  const coreRadius = radius * params.coreRadius;
  const arm = generateArm(params, center, radius, stroke);
  const rotations = Array.from({ length: params.branches }, (_, index) => (
    `<use href="#snow-arm" transform="rotate(${index * 60} ${round(center)} ${round(center)})"/>`
  )).join('');

  return `
    <svg width="${renderedSize}" height="${renderedSize}" viewBox="0 0 ${renderedSize} ${renderedSize}" xmlns="http://www.w3.org/2000/svg" data-snowflake-version="2" data-seed="${params.seedKey}">
      <defs>
        <linearGradient id="snow-gradient" gradientUnits="userSpaceOnUse" x1="${round(renderedSize * 0.16)}" y1="${round(renderedSize * 0.18)}" x2="${round(renderedSize * 0.84)}" y2="${round(renderedSize * 0.82)}">
          <stop offset="0" stop-color="#7deaff"/>
          <stop offset="0.48" stop-color="#f4fdff"/>
          <stop offset="1" stop-color="#b991ec"/>
        </linearGradient>
        <filter id="snow-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="${round(renderedSize / 250)}"/>
        </filter>
        <g id="snow-arm">${arm}</g>
        <g id="snowflake-geometry">${rotations}</g>
      </defs>
      <g fill="none" stroke="url(#snow-gradient)" stroke-linecap="round" stroke-linejoin="round">
        <use href="#snowflake-geometry" filter="url(#snow-glow)" opacity="0.24" stroke-width="${round(stroke * 2.4)}"/>
        <use href="#snowflake-geometry"/>
        <polygon points="${hexagonPoints(center, coreRadius)}" stroke-width="${round(stroke * 0.78)}" opacity="0.92"/>
        <circle cx="${round(center)}" cy="${round(center)}" r="${round(coreRadius * 0.34)}" stroke-width="${round(stroke * 0.6)}" opacity="0.72"/>
      </g>
    </svg>
  `;
}

export function generateSnowflakeDataURL(text: string, size = 400, signature = ''): string {
  const safeText = (text ?? '').trim() || 'snowflake';
  const params = generateSnowflakeParams(safeText, signature);
  const svg = generateSnowflakeSVG(params, size).trim();

  try {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  } catch {
    const bytes = new TextEncoder().encode(svg);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    const base64 = globalThis.btoa ? globalThis.btoa(binary) : '';
    return base64
      ? `data:image/svg+xml;base64,${base64}`
      : `data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"></svg>')}`;
  }
}

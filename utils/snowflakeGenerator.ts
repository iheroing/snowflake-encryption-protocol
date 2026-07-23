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

export const SNOWFLAKE_FAMILIES = [
  'stellar-dendrite',
  'fern-dendrite',
  'hex-plate',
  'needle-rosette',
  'split-star',
] as const;

export type SnowflakeFamily = typeof SNOWFLAKE_FAMILIES[number];

export interface SnowflakeParams {
  branches: 6;
  complexity: number;
  symmetry: 1;
  family: SnowflakeFamily;
  /** Compatibility seed for callers that only need one deterministic word. */
  seed: number;
  /** 128 bits of deterministic state; do not collapse this for rendering. */
  seedWords: readonly [number, number, number, number];
  seedKey: string;
  coreRadius: number;
  innerRing: number;
  facetWidth: number;
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
  const seedWords = hashStringWords(`snow-whisper:crystal:v3:${seedSource}`);
  const rng = new SeededRandom(seedWords);
  const family = SNOWFLAKE_FAMILIES[Math.floor(rng.next() * SNOWFLAKE_FAMILIES.length)];
  const complexity = 4 + Math.floor(rng.next() * 3);
  const levels: SnowflakeLevel[] = [];

  const familyRange: Record<SnowflakeFamily, { length: [number, number]; angle: [number, number] }> = {
    'stellar-dendrite': { length: [0.13, 0.255], angle: [37, 55] },
    'fern-dendrite': { length: [0.16, 0.285], angle: [31, 47] },
    'hex-plate': { length: [0.09, 0.165], angle: [48, 60] },
    'needle-rosette': { length: [0.065, 0.13], angle: [25, 38] },
    'split-star': { length: [0.14, 0.27], angle: [29, 46] },
  };
  const range = familyRange[family];

  for (let index = 0; index < complexity; index += 1) {
    const progress = complexity === 1 ? 0 : index / (complexity - 1);
    levels.push({
      position: round(0.22 + progress * 0.57 + (rng.next() - 0.5) * 0.025),
      length: round(range.length[0] + progress * (range.length[1] - range.length[0]) * 0.72 + rng.next() * (range.length[1] - range.length[0]) * 0.28),
      angle: round((range.angle[0] + rng.next() * (range.angle[1] - range.angle[0])) * Math.PI / 180),
      split: round(0.48 + rng.next() * 0.18),
    });
  }

  return {
    branches: 6,
    complexity,
    symmetry: 1,
    family,
    seed: seedWords[0],
    seedWords,
    seedKey: seedWords.map((word) => word.toString(16).padStart(8, '0')).join(''),
    coreRadius: round(0.045 + rng.next() * 0.025),
    innerRing: round(0.19 + rng.next() * 0.1),
    facetWidth: round(0.055 + rng.next() * 0.045),
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

function generateStellarArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
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

function generateFernArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const pieces = [line(center + radius * params.coreRadius * 0.25, center, center + radius, center, stroke)];

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const branchLength = radius * level.length;
    const endX = nodeX + Math.cos(level.angle) * branchLength;
    const offsetY = Math.sin(level.angle) * branchLength;
    const width = stroke * (0.62 - level.position * 0.12);
    pieces.push(line(nodeX, center, endX, center - offsetY, width, 0.94));
    pieces.push(line(nodeX, center, endX, center + offsetY, width, 0.94));

    for (const direction of [-1, 1]) {
      for (const fraction of [0.42, 0.7]) {
        const stemX = nodeX + (endX - nodeX) * fraction;
        const stemY = center + direction * offsetY * fraction;
        const twigLength = branchLength * (0.18 + (1 - fraction) * 0.11);
        const twigAngle = level.angle * (0.35 + fraction * 0.18);
        pieces.push(line(
          stemX,
          stemY,
          stemX + Math.cos(twigAngle) * twigLength,
          stemY + direction * Math.sin(twigAngle) * twigLength,
          width * 0.52,
          0.72,
        ));
      }
    }
  }

  return pieces.join('');
}

function generatePlateArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const start = center + radius * params.coreRadius * 0.2;
  const shoulder = center + radius * (0.48 + params.innerRing * 0.2);
  const outer = center + radius * 0.91;
  const halfWidth = radius * params.facetWidth;
  const pieces = [
    `<polygon points="${round(start)},${round(center)} ${round(shoulder)},${round(center - halfWidth)} ${round(outer)},${round(center)} ${round(shoulder)},${round(center + halfWidth)}" stroke-width="${round(stroke * 0.72)}" fill="url(#snow-gradient)" fill-opacity="0.055" opacity="0.92"/>`,
    line(start, center, center + radius, center, stroke * 0.78, 0.92),
  ];

  for (const level of params.levels) {
    const x = center + radius * level.position;
    const rib = radius * level.length * 0.42;
    pieces.push(line(x, center - rib, x, center + rib, stroke * 0.42, 0.58));
  }

  return pieces.join('');
}

function generateNeedleArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const pieces = [
    line(center + radius * params.coreRadius * 0.2, center, center + radius, center, stroke * 0.72, 0.96),
    line(center + radius * 0.18, center - stroke * 1.7, center + radius * 0.92, center - stroke * 0.7, stroke * 0.32, 0.46),
    line(center + radius * 0.18, center + stroke * 1.7, center + radius * 0.92, center + stroke * 0.7, stroke * 0.32, 0.46),
  ];

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const needle = radius * level.length;
    const x = nodeX + Math.cos(level.angle) * needle;
    const y = Math.sin(level.angle) * needle;
    pieces.push(line(nodeX, center, x, center - y, stroke * 0.42, 0.74));
    pieces.push(line(nodeX, center, x, center + y, stroke * 0.42, 0.74));
  }

  return pieces.join('');
}

function generateSplitStarArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const pieces = [line(center + radius * params.coreRadius * 0.2, center, center + radius, center, stroke)];

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const branchLength = radius * level.length;
    const endX = nodeX + Math.cos(level.angle) * branchLength;
    const offsetY = Math.sin(level.angle) * branchLength;
    const width = stroke * (0.68 - level.position * 0.15);
    pieces.push(line(nodeX, center, endX, center - offsetY, width, 0.92));
    pieces.push(line(nodeX, center, endX, center + offsetY, width, 0.92));

    const forkLength = branchLength * 0.36;
    const forkAngle = level.angle * 0.58;
    pieces.push(line(endX, center - offsetY, endX + Math.cos(forkAngle) * forkLength, center - offsetY - Math.sin(forkAngle) * forkLength, width * 0.58, 0.76));
    pieces.push(line(endX, center - offsetY, endX + forkLength, center - offsetY, width * 0.5, 0.64));
    pieces.push(line(endX, center + offsetY, endX + Math.cos(forkAngle) * forkLength, center + offsetY + Math.sin(forkAngle) * forkLength, width * 0.58, 0.76));
    pieces.push(line(endX, center + offsetY, endX + forkLength, center + offsetY, width * 0.5, 0.64));
  }

  return pieces.join('');
}

function generateArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  switch (params.family) {
    case 'fern-dendrite':
      return generateFernArm(params, center, radius, stroke);
    case 'hex-plate':
      return generatePlateArm(params, center, radius, stroke);
    case 'needle-rosette':
      return generateNeedleArm(params, center, radius, stroke);
    case 'split-star':
      return generateSplitStarArm(params, center, radius, stroke);
    default:
      return generateStellarArm(params, center, radius, stroke);
  }
}

function hexagonPoints(center: number, radius: number): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return `${round(center + Math.cos(angle) * radius)},${round(center + Math.sin(angle) * radius)}`;
  }).join(' ');
}

function familyDecoration(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const innerRadius = radius * params.innerRing;
  if (params.family === 'hex-plate') {
    return `
      <polygon points="${hexagonPoints(center, radius * 0.57)}" fill="url(#snow-gradient)" fill-opacity="0.035" stroke-width="${round(stroke * 0.5)}" opacity="0.62"/>
      <polygon points="${hexagonPoints(center, radius * 0.36)}" stroke-width="${round(stroke * 0.42)}" opacity="0.5"/>
    `;
  }
  if (params.family === 'needle-rosette') {
    return `
      <circle cx="${round(center)}" cy="${round(center)}" r="${round(innerRadius * 0.82)}" stroke-width="${round(stroke * 0.44)}" opacity="0.52"/>
      <polygon points="${hexagonPoints(center, innerRadius * 0.46)}" fill="url(#snow-gradient)" fill-opacity="0.08" stroke-width="${round(stroke * 0.38)}" opacity="0.68"/>
    `;
  }
  if (params.family === 'split-star') {
    return `<polygon points="${hexagonPoints(center, innerRadius)}" stroke-width="${round(stroke * 0.48)}" opacity="0.56"/>`;
  }
  if (params.family === 'fern-dendrite') {
    return `<circle cx="${round(center)}" cy="${round(center)}" r="${round(innerRadius * 0.72)}" stroke-width="${round(stroke * 0.36)}" opacity="0.4"/>`;
  }
  return '';
}

function familyPalette(family: SnowflakeFamily): readonly [string, string, string] {
  const palettes: Record<SnowflakeFamily, readonly [string, string, string]> = {
    'stellar-dendrite': ['#79e8ff', '#f4fdff', '#b991ec'],
    'fern-dendrite': ['#8ae4ff', '#f2feff', '#8fc5ff'],
    'hex-plate': ['#a8e9f5', '#ffffff', '#cad7ed'],
    'needle-rosette': ['#6ff0dc', '#efffff', '#8aafff'],
    'split-star': ['#b9a7ff', '#fbfdff', '#6edff4'],
  };
  return palettes[family];
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
  const decoration = familyDecoration(params, center, radius, stroke);
  const palette = familyPalette(params.family);
  const rotations = Array.from({ length: params.branches }, (_, index) => (
    `<use href="#snow-arm" transform="rotate(${index * 60} ${round(center)} ${round(center)})"/>`
  )).join('');

  return `
    <svg width="${renderedSize}" height="${renderedSize}" viewBox="0 0 ${renderedSize} ${renderedSize}" xmlns="http://www.w3.org/2000/svg" data-snowflake-version="3" data-family="${params.family}" data-seed="${params.seedKey}">
      <defs>
        <linearGradient id="snow-gradient" gradientUnits="userSpaceOnUse" x1="${round(renderedSize * 0.16)}" y1="${round(renderedSize * 0.18)}" x2="${round(renderedSize * 0.84)}" y2="${round(renderedSize * 0.82)}">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.48" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
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
        ${decoration}
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

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
  'sectored-plate',
  'stellar-plate',
  'broad-branch',
  'twelve-branch',
  'column',
  'capped-column',
  'bullet-rosette',
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
    'sectored-plate': { length: [0.1, 0.19], angle: [48, 60] },
    'stellar-plate': { length: [0.09, 0.17], angle: [44, 60] },
    'broad-branch': { length: [0.12, 0.22], angle: [30, 45] },
    'twelve-branch': { length: [0.13, 0.255], angle: [37, 55] },
    'column': { length: [0.05, 0.1], angle: [50, 60] },
    'capped-column': { length: [0.06, 0.12], angle: [50, 60] },
    'bullet-rosette': { length: [0.065, 0.13], angle: [25, 38] },
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

/** Rime sparkle: a filled point of light at a branch terminus. */
function dot(x: number, y: number, r: number, opacity = 1): string {
  return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" fill="url(#snow-gradient)" stroke="none" opacity="${round(opacity)}"/>`;
}

/** Translucent crystal facet: luminous interior with a fine edge. */
function facet(
  points: ReadonlyArray<readonly [number, number]>,
  strokeWidth: number,
  fillOpacity: number,
  opacity = 1,
): string {
  const list = points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
  return `<polygon points="${list}" stroke-width="${round(strokeWidth)}" fill="url(#snow-gradient)" fill-opacity="${round(fillOpacity)}" opacity="${round(opacity)}"/>`;
}

/** Small plate facet set along the arm axis, as seen at dendrite junctions. */
function diamond(
  cx: number,
  cy: number,
  along: number,
  across: number,
  strokeWidth: number,
  fillOpacity: number,
  opacity = 1,
): string {
  return facet(
    [
      [cx - along, cy],
      [cx, cy - across],
      [cx + along, cy],
      [cx, cy + across],
    ],
    strokeWidth,
    fillOpacity,
    opacity,
  );
}

function generateStellarArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const pieces: string[] = [];
  const trunkStart = center + radius * params.coreRadius * 0.35;
  const tipX = center + radius;
  pieces.push(line(trunkStart, center, tipX, center, stroke * 1.06));
  pieces.push(line(trunkStart, center, center + radius * 0.93, center, stroke * 0.38, 0.5));

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const branchLength = radius * level.length;
    const endX = nodeX + Math.cos(level.angle) * branchLength;
    const offsetY = Math.sin(level.angle) * branchLength;
    const sideWidth = stroke * (0.72 - level.position * 0.18);
    pieces.push(line(nodeX, center, endX, center - offsetY, sideWidth, 0.96));
    pieces.push(line(nodeX, center, endX, center + offsetY, sideWidth, 0.96));

    pieces.push(diamond(
      nodeX,
      center,
      branchLength * 0.17,
      branchLength * 0.1,
      stroke * 0.36,
      0.1,
      0.85,
    ));

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

    pieces.push(dot(endX, center - offsetY, stroke * 0.5, 0.75));
    pieces.push(dot(endX, center + offsetY, stroke * 0.5, 0.75));
  }

  const tipBranchLength = radius * params.tipLength;
  const tipBaseX = center + radius * 0.82;
  const tipXOffset = Math.cos(params.tipAngle) * tipBranchLength;
  const tipYOffset = Math.sin(params.tipAngle) * tipBranchLength;
  pieces.push(line(tipBaseX, center, tipBaseX + tipXOffset, center - tipYOffset, stroke * 0.62, 0.9));
  pieces.push(line(tipBaseX, center, tipBaseX + tipXOffset, center + tipYOffset, stroke * 0.62, 0.9));
  pieces.push(dot(tipX, center, stroke * 0.7, 0.9));
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
      for (const fraction of [0.3, 0.52, 0.74]) {
        const stemX = nodeX + (endX - nodeX) * fraction;
        const stemY = center + direction * offsetY * fraction;
        const twigLength = branchLength * (0.15 + (1 - fraction) * 0.12);
        const twigAngle = level.angle * (0.35 + fraction * 0.18);
        pieces.push(line(
          stemX,
          stemY,
          stemX + Math.cos(twigAngle) * twigLength,
          stemY + direction * Math.sin(twigAngle) * twigLength,
          width * 0.5,
          0.7,
        ));
      }
    }

    pieces.push(dot(endX, center - offsetY, stroke * 0.42, 0.7));
    pieces.push(dot(endX, center + offsetY, stroke * 0.42, 0.7));
  }

  pieces.push(dot(center + radius, center, stroke * 0.6, 0.85));
  return pieces.join('');
}

function generatePlateArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const start = center + radius * params.coreRadius * 0.3;
  const vertex = center + radius * 0.92;
  const mid = center + radius * 0.55;
  // Adjacent kites nearly tile into one broad hexagonal plate; the narrow
  // gap between them reads as a sector boundary, like a real plate crystal.
  const halfWidth = radius * (0.16 + params.facetWidth * 1.3);
  const pieces = [
    facet(
      [
        [start, center],
        [mid, center - halfWidth],
        [vertex, center],
        [mid, center + halfWidth],
      ],
      stroke * 0.6,
      0.08,
      0.94,
    ),
    line(start, center, center + radius, center, stroke * 0.66, 0.92),
    line(start + (mid - start) * 0.3, center, mid, center - halfWidth * 0.66, stroke * 0.26, 0.45),
    line(start + (mid - start) * 0.3, center, mid, center + halfWidth * 0.66, stroke * 0.26, 0.45),
  ];

  for (const level of params.levels) {
    const x = center + radius * level.position;
    const along = (x - start) / (vertex - start);
    const envelope = along <= 0.5 ? along * 2 : (1 - along) * 2;
    const rib = Math.max(halfWidth * envelope * 0.9, radius * 0.02);
    pieces.push(line(x, center - rib, x, center + rib, stroke * 0.32, 0.5));
  }

  pieces.push(dot(vertex, center, stroke * 0.6, 0.85));

  return pieces.join('');
}

function generateNeedleArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const pieces = [
    line(center + radius * params.coreRadius * 0.2, center, center + radius, center, stroke * 0.72, 0.96),
    line(center + radius * 0.18, center - stroke * 1.7, center + radius * 0.92, center - stroke * 0.7, stroke * 0.3, 0.44),
    line(center + radius * 0.18, center + stroke * 1.7, center + radius * 0.92, center + stroke * 0.7, stroke * 0.3, 0.44),
  ];

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const needle = radius * level.length;
    const x = nodeX + Math.cos(level.angle) * needle;
    const y = Math.sin(level.angle) * needle;
    pieces.push(line(nodeX, center, x, center - y, stroke * 0.42, 0.74));
    pieces.push(line(nodeX, center, x, center + y, stroke * 0.42, 0.74));

    const combX = nodeX + (x - nodeX) * 0.55;
    const combY = y * 0.55;
    const comb = needle * 0.16;
    pieces.push(line(combX, center - combY, combX + comb * 0.4, center - combY - comb, stroke * 0.26, 0.5));
    pieces.push(line(combX, center + combY, combX + comb * 0.4, center + combY + comb, stroke * 0.26, 0.5));

    pieces.push(dot(x, center - y, stroke * 0.4, 0.72));
    pieces.push(dot(x, center + y, stroke * 0.4, 0.72));
  }

  pieces.push(dot(center + radius, center, stroke * 0.62, 0.88));
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

    pieces.push(diamond(nodeX, center, branchLength * 0.14, branchLength * 0.09, stroke * 0.34, 0.09, 0.8));
    pieces.push(dot(endX + forkLength, center - offsetY, stroke * 0.42, 0.66));
    pieces.push(dot(endX + forkLength, center + offsetY, stroke * 0.42, 0.66));
  }

  pieces.push(dot(center + radius, center, stroke * 0.66, 0.88));
  return pieces.join('');
}

/** Sectored plate: a broad fan cut by radial ridges into sectors. */
function generateSectoredPlateArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const start = center + radius * params.coreRadius * 0.3;
  const tip = center + radius * 0.9;
  const halfWidth = radius * (0.18 + params.facetWidth * 1.4);
  const pieces = [
    facet(
      [
        [start, center],
        [tip, center - halfWidth],
        [center + radius * 0.98, center],
        [tip, center + halfWidth],
      ],
      stroke * 0.6,
      0.07,
      0.94,
    ),
    line(start, center, center + radius, center, stroke * 0.68, 0.92),
  ];

  const ridges = 3;
  for (let index = 1; index <= ridges; index += 1) {
    const fraction = index / (ridges + 1);
    const y = halfWidth * fraction;
    pieces.push(line(start + (tip - start) * 0.16, center, tip, center - y, stroke * 0.3, 0.5));
    pieces.push(line(start + (tip - start) * 0.16, center, tip, center + y, stroke * 0.3, 0.5));
  }

  for (const level of params.levels) {
    const x = center + radius * level.position;
    const along = (x - start) / (tip - start);
    const envelope = Math.max(0, Math.min(1, along));
    const rib = halfWidth * envelope * 0.86;
    pieces.push(line(x, center - rib, x, center + rib, stroke * 0.24, 0.4));
  }

  pieces.push(dot(center + radius * 0.98, center, stroke * 0.52, 0.82));
  return pieces.join('');
}

/** Stellar plate: short thick arms, each lifting a small hexagonal plate. */
function generateStellarPlateArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const start = center + radius * params.coreRadius * 0.3;
  const armEnd = center + radius * 0.7;
  const tip = center + radius * 0.95;
  const halfWidth = radius * (0.06 + params.facetWidth * 0.7);
  const pieces = [
    facet(
      [
        [start, center - halfWidth * 0.55],
        [armEnd, center - halfWidth],
        [armEnd, center + halfWidth],
        [start, center + halfWidth * 0.55],
      ],
      stroke * 0.6,
      0.08,
      0.92,
    ),
    line(start, center, tip, center, stroke * 0.68, 0.9),
  ];

  const plateRadius = radius * (0.07 + params.facetWidth * 0.7);
  const plateCx = center + radius * 0.84;
  const platePoints = Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return [plateCx + Math.cos(angle) * plateRadius, center + Math.sin(angle) * plateRadius] as const;
  });
  pieces.push(facet(platePoints, stroke * 0.5, 0.12, 0.9));

  for (const level of params.levels.slice(0, 2)) {
    const x = center + radius * (0.28 + level.position * 0.28);
    pieces.push(line(x, center - halfWidth * 0.72, x, center + halfWidth * 0.72, stroke * 0.3, 0.46));
  }

  pieces.push(dot(plateCx, center, stroke * 0.5, 0.8));
  return pieces.join('');
}

/** Broad branch: a wide tapering blade carrying a few side branches. */
function generateBroadBranchArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const start = center + radius * params.coreRadius * 0.3;
  const tip = center + radius;
  const halfWidth = radius * (0.035 + params.facetWidth * 0.5);
  const pieces = [
    facet(
      [
        [start, center - halfWidth],
        [center + radius * 0.9, center - halfWidth * 0.45],
        [tip, center],
        [center + radius * 0.9, center + halfWidth * 0.45],
        [start, center + halfWidth],
      ],
      stroke * 0.6,
      0.09,
      0.92,
    ),
    line(start, center, tip, center, stroke * 0.68, 0.92),
  ];

  for (const level of params.levels) {
    const nodeX = center + radius * level.position;
    const branchLength = radius * level.length;
    const endX = nodeX + Math.cos(level.angle) * branchLength;
    const offsetY = Math.sin(level.angle) * branchLength;
    pieces.push(line(nodeX, center, endX, center - offsetY, stroke * 0.42, 0.72));
    pieces.push(line(nodeX, center, endX, center + offsetY, stroke * 0.42, 0.72));
    pieces.push(dot(endX, center - offsetY, stroke * 0.36, 0.6));
    pieces.push(dot(endX, center + offsetY, stroke * 0.36, 0.6));
  }

  pieces.push(dot(tip, center, stroke * 0.58, 0.86));
  return pieces.join('');
}

/** Twelve-branch: a full star with a shorter dendrite offset 30° between arms,
    the way two fused crystals grow a twelve-pointed flake. */
function generateTwelveBranchArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const main = generateStellarArm(params, center, radius, stroke);
  const spur = generateStellarArm(params, center, radius * 0.64, stroke * 0.82);
  return `${main}<g transform="rotate(30 ${round(center)} ${round(center)})" opacity="0.8">${spur}</g>`;
}

/** Column: a stubby hexagonal prism seen slightly off its axis. Each sextant
    draws one front edge, its depth-shifted twin, and a connector; six of them
    close into a little 3-D column. */
function generateColumnArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const r = radius * 0.5;
  const dx = radius * 0.17;
  const dy = -radius * 0.12;
  const a1 = -Math.PI / 6;
  const a2 = Math.PI / 6;
  const ax = center + Math.cos(a1) * r;
  const ay = center + Math.sin(a1) * r;
  const bx = center + Math.cos(a2) * r;
  const by = center + Math.sin(a2) * r;
  return [
    line(ax, ay, bx, by, stroke * 0.78, 0.92),
    line(ax + dx, ay + dy, bx + dx, by + dy, stroke * 0.58, 0.6),
    line(ax, ay, ax + dx, ay + dy, stroke * 0.5, 0.58),
    dot(bx, by, stroke * 0.44, 0.72),
  ].join('');
}

/** Capped column (tsuzumi): a column grown a plate at each end, so from above
    it reads as two concentric hexagons joined by radial struts. */
function generateCappedColumnArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const outer = radius * 0.74;
  const inner = radius * 0.34;
  const a1 = -Math.PI / 6;
  const a2 = Math.PI / 6;
  const oax = center + Math.cos(a1) * outer;
  const oay = center + Math.sin(a1) * outer;
  const obx = center + Math.cos(a2) * outer;
  const oby = center + Math.sin(a2) * outer;
  const iax = center + Math.cos(a1) * inner;
  const iay = center + Math.sin(a1) * inner;
  const ibx = center + Math.cos(a2) * inner;
  const iby = center + Math.sin(a2) * inner;
  return [
    facet([[iax, iay], [oax, oay], [obx, oby], [ibx, iby]], stroke * 0.44, 0.05, 0.78),
    line(oax, oay, obx, oby, stroke * 0.72, 0.9),
    line(iax, iay, ibx, iby, stroke * 0.58, 0.82),
    line((oax + obx) / 2, (oay + oby) / 2, (iax + ibx) / 2, (iay + iby) / 2, stroke * 0.4, 0.5),
  ].join('');
}

/** Bullet rosette: several stubby columns radiating from one nucleus, each a
    slender spindle tapering to a point. */
function generateBulletRosetteArm(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const base = center + radius * params.coreRadius * 0.5;
  const shoulder = center + radius * 0.42;
  const tip = center + radius * 0.95;
  const halfWidth = radius * (0.032 + params.facetWidth * 0.4);
  return [
    facet(
      [
        [base, center],
        [shoulder, center - halfWidth],
        [tip - radius * 0.09, center - halfWidth * 0.55],
        [tip, center],
        [tip - radius * 0.09, center + halfWidth * 0.55],
        [shoulder, center + halfWidth],
      ],
      stroke * 0.52,
      0.11,
      0.92,
    ),
    line(base, center, tip, center, stroke * 0.58, 0.9),
    line(shoulder, center - halfWidth, tip - radius * 0.09, center - halfWidth * 0.55, stroke * 0.3, 0.5),
    line(shoulder, center + halfWidth, tip - radius * 0.09, center + halfWidth * 0.55, stroke * 0.3, 0.5),
    dot(tip, center, stroke * 0.5, 0.85),
  ].join('');
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
    case 'sectored-plate':
      return generateSectoredPlateArm(params, center, radius, stroke);
    case 'stellar-plate':
      return generateStellarPlateArm(params, center, radius, stroke);
    case 'broad-branch':
      return generateBroadBranchArm(params, center, radius, stroke);
    case 'twelve-branch':
      return generateTwelveBranchArm(params, center, radius, stroke);
    case 'column':
      return generateColumnArm(params, center, radius, stroke);
    case 'capped-column':
      return generateCappedColumnArm(params, center, radius, stroke);
    case 'bullet-rosette':
      return generateBulletRosetteArm(params, center, radius, stroke);
    default:
      return generateStellarArm(params, center, radius, stroke);
  }
}

function hexagonPoints(center: number, radius: number, rotation = 0): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3 + rotation;
    return `${round(center + Math.cos(angle) * radius)},${round(center + Math.sin(angle) * radius)}`;
  }).join(' ');
}

function familyDecoration(params: SnowflakeParams, center: number, radius: number, stroke: number): string {
  const innerRadius = radius * params.innerRing;
  if (params.family === 'hex-plate') {
    return `
      <polygon points="${hexagonPoints(center, radius * 0.57)}" fill="url(#snow-gradient)" fill-opacity="0.045" stroke-width="${round(stroke * 0.5)}" opacity="0.66"/>
      <polygon points="${hexagonPoints(center, radius * 0.36, Math.PI / 6)}" stroke-width="${round(stroke * 0.4)}" opacity="0.5"/>
    `;
  }
  if (params.family === 'needle-rosette') {
    return `
      <circle cx="${round(center)}" cy="${round(center)}" r="${round(innerRadius * 0.82)}" stroke-width="${round(stroke * 0.44)}" opacity="0.52"/>
      <polygon points="${hexagonPoints(center, innerRadius * 0.46)}" fill="url(#snow-gradient)" fill-opacity="0.1" stroke-width="${round(stroke * 0.38)}" opacity="0.68"/>
    `;
  }
  if (params.family === 'split-star') {
    return `
      <polygon points="${hexagonPoints(center, innerRadius)}" stroke-width="${round(stroke * 0.48)}" opacity="0.56"/>
      <polygon points="${hexagonPoints(center, innerRadius * 0.72, Math.PI / 6)}" stroke-width="${round(stroke * 0.34)}" opacity="0.4"/>
    `;
  }
  if (params.family === 'fern-dendrite') {
    return `<polygon points="${hexagonPoints(center, innerRadius * 0.72)}" stroke-width="${round(stroke * 0.36)}" opacity="0.42"/>`;
  }
  return `<polygon points="${hexagonPoints(center, innerRadius * 0.6, Math.PI / 6)}" fill="url(#snow-gradient)" fill-opacity="0.05" stroke-width="${round(stroke * 0.38)}" opacity="0.5"/>`;
}

/**
 * Refraction spectrum — the soft colours ice throws when light bends through
 * it. Pastel, not neon: every crystal draws a different two-tone pair from the
 * wheel so a collection reads as varied yet harmonious, and the pair is seeded
 * so the same letter always refracts the same way while no two letters match.
 */
const REFRACTION_WHEEL = [
  '#7fd8ff', // ice cyan
  '#84e6cf', // aqua mint
  '#9fc0ff', // periwinkle
  '#b89bf0', // lilac
  '#ff9fc4', // frost rose
  '#ffcf8f', // sun-dog gold
  '#8fe6c0', // spring mint
] as const;

/** Seeded body gradient: a saturated tint → bright core → complementary tint,
    so each crystal visibly refracts its own two colours across the star. */
function refractionStops(params: SnowflakeParams): readonly [string, string, string] {
  const familyOffset = SNOWFLAKE_FAMILIES.indexOf(params.family);
  const start = (params.seedWords[2] + familyOffset) % REFRACTION_WHEEL.length;
  const partner = (start + 3) % REFRACTION_WHEEL.length;
  return [REFRACTION_WHEEL[start], '#f2fbff', REFRACTION_WHEEL[partner]];
}

/**
 * Thin-film interference wheel — the faint rose/gold/mint/sky/lavender shimmer
 * real ice crystals throw when light refracts through their facets. Each seal
 * enters the wheel at a different phase, so no two crystals iridesce alike.
 */
const IRIS_WHEEL = ['#f7d9e6', '#f4e7c6', '#d4f1e2', '#d6e6f8', '#e6dcf6'] as const;

function irisStops(phaseDeg: number): string {
  const start = Math.floor((phaseDeg / 360) * IRIS_WHEEL.length) % IRIS_WHEEL.length;
  const ordered = [...IRIS_WHEEL.slice(start), ...IRIS_WHEEL.slice(0, start)];
  const last = ordered.length - 1;
  return ordered
    .map((color, index) => `<stop offset="${round(index / last)}" stop-color="${color}"/>`)
    .join('');
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
  const palette = refractionStops(params);
  const rotations = Array.from({ length: params.branches }, (_, index) => (
    `<use href="#snow-arm" transform="rotate(${index * 60} ${round(center)} ${round(center)})"/>`
  )).join('');

  // Thin-film iridescence, phased by the seal's own entropy: the shimmer angle
  // and its colour entry point differ for every crystal, so no two seals catch
  // the light the same way. Kept faint so structure still reads as silver ice.
  const irisPhase = params.seedWords[1] % 360;
  const irisRad = (irisPhase * Math.PI) / 180;
  const irisX1 = round(center - Math.cos(irisRad) * radius);
  const irisY1 = round(center - Math.sin(irisRad) * radius);
  const irisX2 = round(center + Math.cos(irisRad) * radius);
  const irisY2 = round(center + Math.sin(irisRad) * radius);
  const irisEdge = IRIS_WHEEL[Math.floor((irisPhase / 360) * IRIS_WHEEL.length) % IRIS_WHEEL.length];

  return `
    <svg width="${renderedSize}" height="${renderedSize}" viewBox="0 0 ${renderedSize} ${renderedSize}" xmlns="http://www.w3.org/2000/svg" data-snowflake-version="5" data-family="${params.family}" data-seed="${params.seedKey}">
      <defs>
        <style>
          @keyframes snow-crystallize {
            0% { transform: scale(0.65) rotate(-15deg); opacity: 0; filter: blur(4px); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; filter: blur(0); }
          }
          .crystal-layer {
            transform-origin: ${round(center)}px ${round(center)}px;
            animation: snow-crystallize 0.8s cubic-bezier(0.1, 0.9, 0.2, 1) both;
          }
        </style>
        <linearGradient id="snow-gradient" gradientUnits="userSpaceOnUse" x1="${round(renderedSize * 0.16)}" y1="${round(renderedSize * 0.18)}" x2="${round(renderedSize * 0.84)}" y2="${round(renderedSize * 0.82)}">
          <stop offset="0" stop-color="${palette[0]}"/>
          <stop offset="0.48" stop-color="${palette[1]}"/>
          <stop offset="1" stop-color="${palette[2]}"/>
        </linearGradient>
        <linearGradient id="snow-iris" gradientUnits="userSpaceOnUse" x1="${irisX1}" y1="${irisY1}" x2="${irisX2}" y2="${irisY2}">
          ${irisStops(irisPhase)}
        </linearGradient>
        <radialGradient id="snow-iris-radial" cx="50%" cy="50%" r="52%">
          <stop offset="0.66" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.9" stop-color="${irisEdge}" stop-opacity="0.32"/>
          <stop offset="1" stop-color="${irisEdge}" stop-opacity="0"/>
        </radialGradient>
        <filter id="snow-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="${round(renderedSize / 220)}"/>
        </filter>
        <g id="snow-arm">${arm}</g>
        <g id="snowflake-geometry">${rotations}</g>
      </defs>
      <g class="crystal-layer">
        <circle cx="${round(center)}" cy="${round(center)}" r="${round(radius * 1.04)}" fill="url(#snow-iris-radial)" opacity="0.7" style="mix-blend-mode:screen"/>
        <g fill="none" stroke="url(#snow-gradient)" stroke-linecap="round" stroke-linejoin="round">
          <use href="#snowflake-geometry" filter="url(#snow-glow)" opacity="0.25" stroke-width="${round(stroke * 2.2)}"/>
          <use href="#snowflake-geometry"/>
          <use href="#snowflake-geometry" stroke="#ffffff" stroke-width="${round(stroke * 0.35)}" opacity="0.85"/>
          ${decoration}
          <polygon points="${hexagonPoints(center, coreRadius)}" fill="url(#snow-gradient)" fill-opacity="0.1" stroke-width="${round(stroke * 0.74)}" opacity="0.92"/>
          <polygon points="${hexagonPoints(center, coreRadius * 0.58, Math.PI / 6)}" stroke-width="${round(stroke * 0.5)}" opacity="0.6"/>
          <circle cx="${round(center)}" cy="${round(center)}" r="${round(coreRadius * 0.16)}" fill="url(#snow-gradient)" stroke="none" opacity="0.85"/>
        </g>
        <g fill="none" stroke="url(#snow-iris)" stroke-linecap="round" stroke-linejoin="round" opacity="0.28" style="mix-blend-mode:screen">
          <use href="#snowflake-geometry"/>
        </g>
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

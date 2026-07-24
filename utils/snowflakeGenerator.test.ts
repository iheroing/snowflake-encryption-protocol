import { describe, expect, it } from 'vitest';
import {
  SNOWFLAKE_FAMILIES,
  generateSnowflakeDataURL,
  generateSnowflakeParams,
  generateSnowflakeSVG,
  hashStringWords,
} from './snowflakeGenerator';

describe('snowflake visual engine', () => {
  it('is deterministic for the same visual signature', () => {
    const first = generateSnowflakeDataURL('private text', 760, 'sg_stable-visual-signature');
    const second = generateSnowflakeDataURL('different unavailable text', 760, 'sg_stable-visual-signature');
    expect(second).toBe(first);
  });

  it('keeps six exact rotations of one coherent crystal arm', () => {
    const svg = generateSnowflakeSVG(generateSnowflakeParams('snow crystal', 'sg_symmetry'), 760);
    const armUses = [...svg.matchAll(/<use href="#snow-arm" transform="rotate\((\d+) /gu)]
      .map((match) => Number(match[1]));
    expect(armUses).toEqual([0, 60, 120, 180, 240, 300]);
    expect(svg).toContain('data-snowflake-version="5"');
    const familyRegex = new RegExp(`data-family="(?:${SNOWFLAKE_FAMILIES.join('|')})"`);
    expect(svg).toMatch(familyRegex);
    expect(svg).not.toMatch(/NaN|Infinity|undefined/u);
  });

  it('covers five distinct crystal families without sacrificing determinism', () => {
    const samples = Array.from({ length: 512 }, (_, index) => (
      generateSnowflakeParams('hidden', `sg_family_sample_${index}`)
    ));
    expect(new Set(samples.map((sample) => sample.family))).toEqual(new Set(SNOWFLAKE_FAMILIES));

    for (const family of SNOWFLAKE_FAMILIES) {
      const sample = samples.find((candidate) => candidate.family === family);
      expect(sample).toBeDefined();
      const svg = generateSnowflakeSVG(sample!, 760);
      expect(svg).toContain(`data-family="${family}"`);
      expect(svg).not.toMatch(/NaN|Infinity|undefined/u);
    }
  });

  it('preserves enough seed space for a large set of distinct seals', () => {
    const signatures = Array.from({ length: 2_048 }, (_, index) => `sg_release_sample_${index}`);
    const seedKeys = signatures.map((signature) => (
      generateSnowflakeParams('hidden', signature).seedKey
    ));
    const wordKeys = signatures.map((signature) => hashStringWords(signature).join(':'));
    expect(new Set(seedKeys)).toHaveLength(signatures.length);
    expect(new Set(wordKeys)).toHaveLength(signatures.length);
  });

  it('constrains every generated crystal to a balanced aesthetic range', () => {
    const ranges = {
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
    } as const;

    for (let index = 0; index < 512; index += 1) {
      const params = generateSnowflakeParams('hidden', `sg_aesthetic_${index}`);
      const range = ranges[params.family];
      expect(params.branches).toBe(6);
      expect(params.symmetry).toBe(1);
      expect(SNOWFLAKE_FAMILIES).toContain(params.family);
      expect(params.complexity).toBeGreaterThanOrEqual(4);
      expect(params.complexity).toBeLessThanOrEqual(6);
      expect(params.innerRing).toBeGreaterThanOrEqual(0.19);
      expect(params.innerRing).toBeLessThanOrEqual(0.29);
      expect(params.facetWidth).toBeGreaterThanOrEqual(0.055);
      expect(params.facetWidth).toBeLessThanOrEqual(0.1);
      expect(params.levels).toHaveLength(params.complexity);
      for (const level of params.levels) {
        expect(level.position).toBeGreaterThanOrEqual(0.2);
        expect(level.position).toBeLessThanOrEqual(0.81);
        expect(level.length).toBeGreaterThanOrEqual(range.length[0]);
        expect(level.length).toBeLessThanOrEqual(range.length[1]);
        expect(level.angle).toBeGreaterThanOrEqual(range.angle[0] * Math.PI / 180 - 0.001);
        expect(level.angle).toBeLessThanOrEqual(range.angle[1] * Math.PI / 180 + 0.001);
      }
    }
  });
});

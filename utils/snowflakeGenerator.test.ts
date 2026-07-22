import { describe, expect, it } from 'vitest';
import {
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
    expect(svg).toContain('data-snowflake-version="2"');
    expect(svg).not.toMatch(/NaN|Infinity|undefined/u);
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
    for (let index = 0; index < 512; index += 1) {
      const params = generateSnowflakeParams('hidden', `sg_aesthetic_${index}`);
      expect(params.branches).toBe(6);
      expect(params.symmetry).toBe(1);
      expect(params.complexity).toBeGreaterThanOrEqual(4);
      expect(params.complexity).toBeLessThanOrEqual(6);
      expect(params.levels).toHaveLength(params.complexity);
      for (const level of params.levels) {
        expect(level.position).toBeGreaterThanOrEqual(0.2);
        expect(level.position).toBeLessThanOrEqual(0.81);
        expect(level.length).toBeGreaterThanOrEqual(0.13);
        expect(level.length).toBeLessThanOrEqual(0.27);
        expect(level.angle).toBeGreaterThanOrEqual(37 * Math.PI / 180 - 0.001);
        expect(level.angle).toBeLessThanOrEqual(55 * Math.PI / 180 + 0.001);
      }
    }
  });
});

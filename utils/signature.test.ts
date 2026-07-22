import { describe, expect, it } from 'vitest';
import {
  createSnowflakeSignature,
  createSnowflakeVisualSalt,
  deriveSnowflakeSignature,
  getSnowflakeId,
} from './signature';

describe('private snowflake visual signatures', () => {
  it('is stable for one private salt and message', async () => {
    const salt = createSnowflakeVisualSalt();
    await expect(deriveSnowflakeSignature('quiet snow', salt)).resolves.toBe(
      await deriveSnowflakeSignature('quiet snow', salt),
    );
  });

  it('changes when the message changes without containing plaintext', async () => {
    const salt = createSnowflakeVisualSalt();
    const first = await deriveSnowflakeSignature('message alpha', salt);
    const second = await deriveSnowflakeSignature('message beta', salt);
    expect(first).not.toBe(second);
    expect(first).not.toContain('message alpha');
    expect(first).toMatch(/^sg_[A-Za-z0-9_-]{32}$/u);
  });

  it('uses cryptographic randomness for blank-state signatures', () => {
    expect(createSnowflakeSignature()).not.toBe(createSnowflakeSignature());
  });

  it('exposes a stable, higher-entropy visual id without plaintext', () => {
    const first = getSnowflakeId('sg_private_visual_signature');
    expect(first).toBe(getSnowflakeId('sg_private_visual_signature'));
    expect(first).toMatch(/^SN-[0-9A-Z]{10}$/u);
    expect(first).not.toContain('private');
    expect(first).not.toBe(getSnowflakeId('sg_another_visual_signature'));
  });
});

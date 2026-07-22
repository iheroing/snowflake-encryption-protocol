import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  createEnvelopeAad,
  createDeleteToken,
  openOneTimeWhisper,
  sealOneTimeWhisper,
  verifyFragmentSecret,
  type OneTimeWhisperEnvelope,
} from './oneTimeWhisper';

const V1_VECTOR = JSON.parse(readFileSync(
  new URL('./vectors/v1.json', import.meta.url),
  'utf8',
)) as {
  plaintext: string;
  fragmentSecret: string;
  aad: string;
  envelope: OneTimeWhisperEnvelope;
};

describe('one-time whisper protocol', () => {
  it('matches and opens the frozen v1 interoperability vector', async () => {
    expect(new TextDecoder().decode(createEnvelopeAad(V1_VECTOR.envelope))).toBe(V1_VECTOR.aad);
    await expect(openOneTimeWhisper(
      V1_VECTOR.envelope,
      V1_VECTOR.fragmentSecret,
    )).resolves.toBe(V1_VECTOR.plaintext);
  });

  it('opens the original message with the fragment secret', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'Meet me where the snow is quiet.',
      ttlSeconds: 60 * 60,
      signature: 'L',
    });

    await expect(openOneTimeWhisper(
      sealed.envelope,
      sealed.fragmentSecret,
    )).resolves.toBe('Meet me where the snow is quiet.');
  });

  it('rejects a wrong fragment secret before plaintext is available', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'Only the URL fragment can open this.',
      ttlSeconds: 60 * 60,
    });
    const wrongSecret = createDeleteToken();

    await expect(verifyFragmentSecret(
      sealed.envelope,
      wrongSecret,
    )).resolves.toBe(false);
  });

  it('does not open ciphertext with a wrong fragment secret', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'This must stay sealed.',
      ttlSeconds: 60 * 60,
    });
    const wrongSecret = createDeleteToken();

    await expect(openOneTimeWhisper(
      sealed.envelope,
      wrongSecret,
    )).rejects.toThrow();
  });

  it('rejects an envelope when authenticated metadata is changed', async () => {
    const sealed = await sealOneTimeWhisper({
      message: 'AAD binds this note to its metadata.',
      ttlSeconds: 60 * 60,
      signature: 'before',
    });
    const tampered = {
      ...sealed.envelope,
      signature: 'after',
    };

    await expect(verifyFragmentSecret(
      tampered,
      sealed.fragmentSecret,
    )).resolves.toBe(false);
  });
});

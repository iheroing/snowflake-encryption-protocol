import { randomBase64Url, sha256Base64Url } from '../protocol/oneTimeWhisper';
import { hashStringWords } from './snowflakeGenerator';

export function createSnowflakeSignature(): string {
  return `sg_${randomBase64Url(16)}`;
}

export function createSnowflakeVisualSalt(): string {
  return randomBase64Url(32);
}

/** Produces a visual seed without exposing an unsalted plaintext hash. */
export async function deriveSnowflakeSignature(message: string, privateSalt: string): Promise<string> {
  const digest = await sha256Base64Url(`snow-whisper:visual:v1:${privateSalt}:${message}`);
  return `sg_${digest.slice(0, 32)}`;
}

export function getSnowflakeId(signature: string): string {
  const [high, low] = hashStringWords(`snowflake::${signature}`);
  const numeric = (BigInt(high) << 32n) | BigInt(low);
  return `SN-${numeric.toString(36).toUpperCase().padStart(13, '0').slice(-10)}`;
}

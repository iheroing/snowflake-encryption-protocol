import {
  generateSnowflakeParams,
  SNOWFLAKE_FAMILIES,
  type SnowflakeFamily,
} from './snowflakeGenerator';
import { getSnowflakeId } from './signature';

export type KeepsakeOrigin = 'sent' | 'received';

export interface SnowflakeKeepsake {
  version: 1;
  id: string;
  signature: string;
  family: SnowflakeFamily;
  origin: KeepsakeOrigin;
  collectedAt: number;
}

const STORAGE_KEY = 'snowflake:keepsakes:v1';
const CHANGE_EVENT = 'snowflake:keepsakes-changed';
const MAX_KEEPSAKES = 120;
let memoryValue = '';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(): string {
  try {
    const local = storage();
    return local ? local.getItem(STORAGE_KEY) ?? '' : memoryValue;
  } catch {
    return memoryValue;
  }
}

function writeRaw(value: string): void {
  memoryValue = value;
  try {
    storage()?.setItem(STORAGE_KEY, value);
  } catch {
    // The in-memory fallback still keeps this browser session usable.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT));
}

function isKeepsake(value: unknown): value is SnowflakeKeepsake {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<SnowflakeKeepsake>;
  return candidate.version === 1
    && typeof candidate.id === 'string'
    && /^SN-[A-Z0-9]{10}$/u.test(candidate.id)
    && typeof candidate.signature === 'string'
    && /^sg_[A-Za-z0-9_-]{16,64}$/u.test(candidate.signature)
    && SNOWFLAKE_FAMILIES.includes(candidate.family as SnowflakeFamily)
    && ['sent', 'received'].includes(candidate.origin ?? '')
    && typeof candidate.collectedAt === 'number'
    && Number.isFinite(candidate.collectedAt);
}

export function getKeepsakes(): SnowflakeKeepsake[] {
  const raw = readRaw();
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    return parsed
      .filter(isKeepsake)
      .filter((item) => {
        if (seen.has(item.signature)) return false;
        seen.add(item.signature);
        return true;
      })
      .sort((a, b) => b.collectedAt - a.collectedAt)
      .slice(0, MAX_KEEPSAKES);
  } catch {
    return [];
  }
}

export function hasKeepsake(signature: string): boolean {
  return getKeepsakes().some((item) => item.signature === signature);
}

export function collectKeepsake(signature: string, origin: KeepsakeOrigin): SnowflakeKeepsake {
  const existing = getKeepsakes().find((item) => item.signature === signature);
  if (existing) return existing;

  const keepsake: SnowflakeKeepsake = {
    version: 1,
    id: getSnowflakeId(signature),
    signature,
    family: generateSnowflakeParams(signature, signature).family,
    origin,
    collectedAt: Date.now(),
  };
  writeRaw(JSON.stringify([keepsake, ...getKeepsakes()].slice(0, MAX_KEEPSAKES)));
  return keepsake;
}

export function removeKeepsake(signature: string): void {
  writeRaw(JSON.stringify(getKeepsakes().filter((item) => item.signature !== signature)));
}

export function clearKeepsakes(): void {
  memoryValue = '';
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable storage; the in-memory value is already cleared.
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT));
}

export const KEEPSAKE_CHANGE_EVENT = CHANGE_EVENT;

// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RevealView from './RevealView';

const playMock = vi.fn();

vi.mock('../contexts/I18nContext', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('../contexts/SoundContext', () => ({
  useSound: () => ({ play: playMock }),
}));
vi.mock('../utils/haptics', () => ({ playHaptic: vi.fn() }));
vi.mock('../utils/snowflakeGenerator', () => ({
  generateSnowflakeDataURL: () => 'data:image/svg+xml,test',
  generateSnowflakeParams: () => ({ family: 'hex-plate' }),
}));
vi.mock('../utils/signature', () => ({ getSnowflakeId: () => 'TEST' }));
vi.mock('./Icon', () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock('./LanguageToggleButton', () => ({ default: () => null }));
vi.mock('./SoundToggleButton', () => ({ default: () => null }));

type RafCallback = (time: number) => void;

let now = 0;
let nextRafId = 1;
let rafCallbacks = new Map<number, RafCallback>();
let reducedMotion = false;

function installMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: reducedMotion,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function advanceRaf(milliseconds: number) {
  now += milliseconds;
  const pending = [...rafCallbacks.values()];
  rafCallbacks.clear();
  pending.forEach((callback) => callback(now));
}

function renderReveal(onClose = vi.fn()) {
  const result = render(
    <RevealView
      message="test message"
      signature="test-signature"
      displaySeconds={1}
      onClose={onClose}
      onExport={vi.fn()}
      isCollected={false}
      onCollect={vi.fn()}
    />,
  );
  return { ...result, onClose };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(0);
  now = 0;
  nextRafId = 1;
  rafCallbacks = new Map();
  reducedMotion = false;
  playMock.mockClear();
  installMatchMedia();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = nextRafId++;
    rafCallbacks.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    rafCallbacks.delete(id);
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('RevealView lifecycle', () => {
  it('finishes the melt animation after countdown expiry and closes exactly once', () => {
    const { onClose } = renderReveal();

    act(() => vi.advanceTimersByTime(1_000));
    expect(onClose).not.toHaveBeenCalled();
    expect(rafCallbacks.size).toBe(1);

    act(() => advanceRaf(2_500));
    expect(onClose).not.toHaveBeenCalled();
    act(() => advanceRaf(2_500));
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event('pagehide'));
      advanceRaf(1_000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the same close-once guard for manual and lifecycle exits', () => {
    const { getByRole, onClose } = renderReveal();

    fireEvent.click(getByRole('button', { name: 'common.close' }));
    act(() => window.dispatchEvent(new Event('pagehide')));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans timers, RAF callbacks and lifecycle listeners on unmount', () => {
    const { unmount, onClose } = renderReveal();
    unmount();

    act(() => {
      vi.advanceTimersByTime(10_000);
      advanceRaf(10_000);
      window.dispatchEvent(new Event('pagehide'));
    });

    expect(rafCallbacks.size).toBe(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('skips the RAF melt animation when reduced motion is requested', () => {
    reducedMotion = true;
    installMatchMedia();
    const { onClose } = renderReveal();

    act(() => vi.advanceTimersByTime(1_000));
    expect(rafCallbacks.size).toBe(0);
    act(() => vi.advanceTimersByTime(1));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

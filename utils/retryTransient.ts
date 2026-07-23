export async function retryTransient<T>(
  operation: () => Promise<T>,
  attemptDelaysMs: readonly number[] = [0, 450, 1_200],
  pause: (milliseconds: number) => Promise<void> = (
    milliseconds,
  ) => new Promise((resolve) => window.setTimeout(resolve, milliseconds)),
): Promise<T> {
  let lastError: unknown = new Error('No retry attempts configured');

  for (const delayMs of attemptDelaysMs) {
    if (delayMs > 0) await pause(delayMs);
    try {
      return await operation();
    } catch (caught) {
      lastError = caught;
    }
  }

  throw lastError;
}

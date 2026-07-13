/**
 * Wraps a promise in a timeout. Rejects if the promise does not resolve within the specified timeout.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("সার্ভার রেসপন্স করছে না (Timeout)")), timeoutMs)
    ),
  ]);
}

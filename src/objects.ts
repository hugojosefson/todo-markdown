/**
 * Creates a function that returns the value of the given key of the given object.
 * @param key The key to get the value of.
 * @returns A function that returns the value of the given key of the given object.
 */
export function prop<T, K extends keyof T>(key: K): (x: T) => T[K] {
  return (x) => x[key];
}

/**
 * Compose functions from right to left
 * @param fns the functions to compose
 */
export function pipe<T>(...fns: ((x: T) => T)[]): (x: T) => T {
  return (x) => fns.reduce((acc, fn) => fn(acc), x);
}

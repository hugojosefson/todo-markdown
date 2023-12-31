/**
 * Compose functions from right to left. This function takes in a variable number of functions
 * and returns a new function that applies these functions from right to left.
 * @param fns the functions to compose
 * @returns a function that applies the input functions from right to left
 */
export function pipe<T>(...fns: ((x: T) => T)[]): (x: T) => T {
  return (x) => fns.reduce((acc, fn) => fn(acc), x);
}

/**
 * Compose async functions from right to left. This function takes in a̶ ̶v̶a̶r̶i̶a̶b̶l̶e̶ ̶n̶u̶m̶b̶e̶r̶ ̶o̶f̶ **3** async functions
 * and returns a new async function that applies these async functions from right to left.
 * @returns an async function that applies the input async functions from right to left
 * @note This function only supports exactly 3 input functions.
 */
export function pipeAsync3<A, B, C, D>(
  fnA: (args: A) => B | Promise<B>,
  fnB: (args: B) => C | Promise<C>,
  fnC: (args: C) => D | Promise<D>,
): (args: A) => Promise<D> {
  return async (args) => fnC(await fnB(await fnA(args)));
}

/**
 * Negates a boolean function. This function takes in a function that returns a boolean,
 * and returns a new function that negates the result of the input function.
 * @param fn the function to negate
 * @returns a function that negates the result of the input function
 */
export function not<T>(fn: (x: T) => boolean): (x: T) => boolean {
  return (x) => !fn(x);
}

/**
 * Returns true if all given functions return true. This function takes in a variable number of functions,
 * and returns a new function that returns true if all input functions return true.
 * @param fns the functions to check
 * @returns a function that returns true if all input functions return true
 */
export function and<T>(...fns: ((x: T) => boolean)[]): (x: T) => boolean {
  return (x) => fns.every((fn) => fn(x));
}

/**
 * Returns true if any given function returns true. This function takes in a variable number of functions,
 * and returns a new function that returns true if any input function returns true.
 * @param fns the functions to check
 * @returns a function that returns true if any input function returns true
 */
export function or<T>(...fns: ((x: T) => boolean)[]): (x: T) => boolean {
  return (x) => fns.some((fn) => fn(x));
}

/**
 * Converts a function's return value to a boolean. This function takes in a function that returns a value,
 * and returns a new function that converts the result of the input function to a boolean.
 * @param fn the function whose return value is to be converted to a boolean
 * @returns a function that converts the result of the input function to a boolean
 */
export function boolify<T>(fn: (x: T) => unknown): (x: T) => boolean {
  return (x) => !!fn(x);
}

/**
 * Use this with `Promise.prototype.catch` to swallow errors of a specific type.
 * @example
 * ```ts
 * const contents: string|undefined = await Deno.readTextFile("foo.txt").catch(swallow(Deno.errors.NotFound));
 * ```
 * @example
 * ```ts
 * const contents: string = await Deno.readTextFile("foo.txt").catch(swallow(Deno.errors.NotFound, "Sorry :( no file found"));
 * ```
 * @param errorType the type of error to swallow
 * @param defaultValue the value to return if the error is swallowed
 */
export function swallow<
  E extends Error,
  T,
  A extends unknown[] = unknown[],
>(
  errorType: new (...args: A) => E,
  defaultValue: T = undefined as unknown as T,
): (reason: Error | unknown) => Promise<T> {
  return (reason) => {
    if (reason instanceof errorType) {
      return Promise.resolve(defaultValue);
    }
    return Promise.reject(reason);
  };
}

export function isFunction<T extends (...args: unknown[]) => unknown>(
  value: unknown,
  // deno-lint-ignore ban-types
): value is T & Function {
  return typeof value === "function";
}

export function always<T>(value: T): () => T {
  return () => value;
}

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
 * Reduces a list of numbers to the largest number. This function takes in an accumulator and a number,
 * and returns the larger of the two.
 * @param acc the accumulator, which is the current largest number
 * @param x the current number
 * @returns the larger of the accumulator and the current number
 */
export function reduceToLargestNumber(acc: number, x: number): number {
  return Math.max(acc, x);
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

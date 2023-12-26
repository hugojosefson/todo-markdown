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

import { Text } from "npm:@types/mdast";

/**
 * Returns a function that extracts the first match of a regex from a string.
 * @param regex the regex to match
 * @returns a function that extracts the first match of a regex from a string
 * @example
 * ```ts
 * const extractAbc = extractA(/abc/);
 * // extractAbc is a function that extracts the first match of /abc/ from a string
 * const result = extractAbc("The abc you are looking for is here.");
 * // result is "abc"
 * ```
 */
export const extractA: <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends T | undefined = T | undefined,
>(regex: RegExp) => (x: X) => R = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends T | undefined = T | undefined,
>(regex: RegExp): (x: X) => R =>
(x: X): R => {
  const match = regex.exec(typeof x === "string" ? x : x.value);
  if (match === null) {
    return undefined as R;
  }
  const [result] = match;
  return result as R;
};

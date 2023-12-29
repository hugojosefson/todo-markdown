import merge from "npm:regex-merge";
import { pipe } from "../fn.ts";

/**
 * Prefixes a regex with `^`, so that it only matches the start of a string.
 * @param regex the regex to prefix
 * @example
 * ```ts
 * const regex = startWith(/a/);
 * // regex is /^a/
 * ```
 */
export const startWith = <R extends RegExp>(regex: R): R =>
  sequence(/^/, regex);

/**
 * Suffices a regex with `$`, so that it only matches the end of a string.
 * @param regex the regex to suffix
 * @example
 * ```ts
 * const regex = endWith(/a/);
 * // regex is /a$/
 * ```
 */
export const endWith: <R extends RegExp>(regex: R) => R = <R extends RegExp>(
  regex: R,
): R => sequence(regex, /$/);

/**
 * Surrounds a regex with `^` and `$`, so that it only matches the entire string.
 */
export const only = pipe(startWith, endWith);

/**
 * Returns a regex that matches any of the given regexes.
 * @param firstRegex the first regex
 * @param restRegexes the rest of the regexes
 * @returns a regex that matches any of the given regexes
 */
export function or<A extends RegExp, B extends RegExp>(
  firstRegex: A | string,
  ...restRegexes: Array<B | string>
): A | B {
  if (restRegexes.length === 0) {
    return sequence(firstRegex);
  }
  const [next, ...rest] = restRegexes;
  const restOred = or(next, ...rest);
  return merge(firstRegex, /|/, restOred);
}

/**
 * Returns a regex that matches all given regexes in sequence.
 * @param firstRegex the first regex
 * @param restRegexes the rest of the regexes
 * @returns a regex that matches all given regexes in sequence
 * @example
 * ```ts
 * const regex = sequence(/a/, /b/, /c/);
 * // regex is /abc/
 *
 * const regex = sequence(/a/, "*b*", /c/);
 * // regex is /a\*b\*c/
 * ```
 */
export function sequence<A extends RegExp, B extends RegExp>(
  firstRegex: A | string,
  ...restRegexes: Array<B | string>
): A & B {
  return merge(firstRegex, ...restRegexes);
}

/**
 * Returns a regex with the global flag set.
 * @param regex the regex to make global
 * @returns a regex with the global flag set
 * @example
 * ```ts
 * const regex = global(/a/);
 * // regex is /a/g
 * ```
 */
export function global<R extends RegExp>(regex: R): R {
  return new RegExp(regex.source, `${regex.flags}g`) as R;
}

/**
 * Wraps a regex in a named capture group.
 * @param groupName name to give the capture group
 * @param regex the regex to capture
 * @returns a regex with a named capture group
 * @example
 * ```ts
 * const regex = sequence(capture("a", /a/), capture("b", /b/), capture("c", /c/));
 * // regex is /(?<a>a)(?<b>b)(?<c>c)/
 * ```
 */
export function capture<G extends string, R extends RegExp>(
  groupName: G,
  regex: R,
): R & { groups: { [K in G]: string } } {
  return new RegExp(`(?<${groupName}>${regex.source})`, regex.flags) as
    & R
    & {
      groups: { [K in G]: string };
    };
}

/**
 * Extracts the captured groups from the args of a replacer function used with
 * {@link String.prototype.replace}.
 * @param args the args you receive in a replacer function
 * @example
 * ```ts
 * const regex = sequence(capture("a", /a/), capture("b", /b/), capture("c", /c/)); // /(?<a>a)(?<b>b)(?<c>c)/
 * const result = "abc".replace(regex, (match, ...args) => {
 *  const { a, b, c } = groups(args);
 *  return `${a}-${b}-${c}`;
 *  // returns "a-b-c"
 *  // match is "abc"
 *  // args is ["a", "b", "c", 0, "abc"]
 *  // groups(args) is { a: "a", b: "b", c: "c" }
 * });
 * ```
 */
export function groups<K extends string>(args: unknown[]): Record<K, string> {
  return args.at(-1) as Record<K, string>;
}

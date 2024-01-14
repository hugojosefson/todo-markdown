import merge from "npm:regex-merge";
import { pipe } from "../fn.ts";
import { isString } from "./is-string.ts";
import { StringParenthesized } from "./string-types.ts";

export type RegexSequence<A extends RegExp, B extends RegExp> =
  & A
  & B
  & { source: `${A["source"]}${B["source"]}` }
  & { flags: `${A["flags"]}${B["flags"]}` };

/**
 * Prefixes a regex with `^`, so that it only matches the start of a string.
 * @param regex the regex to prefix
 * @example
 * ```ts
 * const regex = startWith(/a/);
 * // regex is /^a/
 * ```
 */
export const startWith: <R extends RegExp>(
  regex: R,
) => RegexSequence<RegExp & { source: "^" }, R> = <R extends RegExp>(
  regex: R,
): RegexSequence<RegExp & { source: "^" }, R> =>
  sequence(/^/, regex) as RegexSequence<RegExp & { source: "^" }, R>;

/**
 * Suffices a regex with `$`, so that it only matches the end of a string.
 * @param regex the regex to suffix
 * @example
 * ```ts
 * const regex = endWith(/a/);
 * // regex is /a$/
 * ```
 */
export const endWith: <R extends RegExp>(
  regex: R,
) => RegexSequence<R, RegExp & { source: "$" }> = <R extends RegExp>(
  regex: R,
): RegexSequence<R, RegExp & { source: "$" }> =>
  sequence(regex, /$/) as RegexSequence<R, RegExp & { source: "$" }>;

/**
 * Surrounds a regex with `^` and `$`, so that it only matches the entire string.
 */
export const only: <R extends RegExp>(
  x: R,
) => R & { source: `^${R["source"]}$` } = pipe(startWith, endWith) as <
  R extends RegExp,
>(x: R) => R & { source: `^${R["source"]}$` };

export type RegexOr<A extends RegExp, B extends RegExp> =
  & A
  & B
  & { source: `${A["source"]}|${B["source"]}` }
  & { flags: `${A["flags"]}${B["flags"]}` };

/**
 * Returns a regex that matches any of the given regexes.
 * @param firstRegex the first regex
 * @param restRegexes the rest of the regexes
 * @returns a regex that matches any of the given regexes
 */
export function or<A extends RegExp, B extends RegExp>(
  firstRegex: A | string,
  ...restRegexes: Array<B | string>
): RegexOr<A, B> {
  if (restRegexes.length === 0) {
    return sequence(firstRegex) as RegexOr<A, B>;
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
): RegexSequence<A, B> {
  if (restRegexes.length === 0 && !isString(firstRegex)) {
    // fast-path for when there's only one regex
    return firstRegex as RegexSequence<A, B>;
  }
  return merge(firstRegex, ...restRegexes);
}

export type RegexParenthesized<A extends RegExp | string> = A extends string
  ? (RegExp & { source: `(${A})` })
  : A extends RegExp ? (A & { source: `(${A["source"]})` })
  : never;

export type RegexOptional<A extends RegExp | string> = A extends string
  ? (RegExp & { source: `(${A})?` })
  : A extends RegExp ? (A & { source: `(${A["source"]})?` })
  : never;

export function optional<
  R extends RegExp,
  A extends (R | string),
>(regex: A): RegexOptional<R> {
  const isFromString = isString(regex);
  const source = isFromString ? sequence(regex).source : regex.source;
  const flags = isFromString ? "" : regex.flags;
  return new RegExp(`${parenthesize(source)}?`, flags) as RegexOptional<R>;
}

/**
 * Adds parentheses around a regex if it doesn't already have them.
 * @param regex the regex to parenthesize
 */
export function parenthesize<R extends string>(
  regex: R,
): StringParenthesized<R> {
  if (regex.startsWith("(") && regex.endsWith(")")) {
    return regex as StringParenthesized<R>;
  }
  return `(${regex})` as StringParenthesized<R>;
}

export type RegexGlobal<A extends RegExp> =
  & RegExp
  & { source: `${A["source"]}` }
  & { flags: `${A["flags"]}g` };

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
export function global<R extends RegExp>(regex: R): RegexGlobal<R> {
  return new RegExp(regex.source, `${regex.flags}g`) as RegexGlobal<R>;
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

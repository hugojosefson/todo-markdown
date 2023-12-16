import merge from "npm:regex-merge";
import { pipe } from "./fn.ts";

export function startsWith(regex: RegExp): RegExp {
  return sequence(/^/, regex);
}

export function endsWith(regex: RegExp): RegExp {
  return sequence(regex, /$/);
}

/**
 * Surrounds a regex with ^ and $, so that it only matches the entire string.
 */
export const only = pipe(startsWith, endsWith);

/**
 * Returns a type guard that checks if a string matches a regex.
 * @param regex the regex to match
 */
export function isA<T extends string>(regex: RegExp): TypeGuard<T> {
  return (x: string): x is T => only(regex).test(x);
}

export type StringContaining<T extends string> = `{string}${T}{string}`;

export type TypeGuard<T extends string> = (x: string) => x is T;
export type TypeGuardContaining<T extends string> = TypeGuard<
  StringContaining<T>
>;

/**
 * Returns a type guard that checks if a string contains something that matches a regex.
 * @param regex the regex to match
 * @returns a type guard that checks if a string contains something that matches a regex
 */
export const containsA: <T extends string>(
  regex: RegExp,
) => TypeGuardContaining<T> =
  <T extends string>(regex: RegExp): TypeGuardContaining<T> =>
  (x: string): x is StringContaining<T> => regex.test(x);

/**
 * Returns a regex that matches any of the given regexes.
 * @param firstRegex the first regex
 * @param restRegexes the rest of the regexes
 * @returns a regex that matches any of the given regexes
 */
export function or(firstRegex: RegExp, ...restRegexes: RegExp[]): RegExp {
  if (restRegexes.length === 0) {
    return firstRegex;
  }
  const [next, ...rest] = restRegexes;
  const restOred = or(next, ...rest);
  return merge(firstRegex, /|/, restOred);
}

/**
 * Returns a regex that matches all of the given regexes in sequence.
 * @param firstRegex the first regex
 * @param restRegexes the rest of the regexes
 * @returns a regex that matches all of the given regexes in sequence
 */
export function sequence(firstRegex: RegExp, ...restRegexes: RegExp[]): RegExp {
  return merge(firstRegex, ...restRegexes);
}

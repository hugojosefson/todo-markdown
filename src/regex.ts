import merge from "npm:regex-merge";
import { pipe } from "./fn.ts";

export function startsWith(regex: RegExp): RegExp {
  return merge(/^/, regex);
}

export function endsWith(regex: RegExp): RegExp {
  return merge(regex, /$/);
}

/**
 * Surrounds a regex with ^ and $, so that it only matches the entire string.
 */
export const only = pipe(startsWith, endsWith);

/**
 * Returns a type guard that checks if a string matches a regex.
 * @param regex the regex to match
 */
export function isA<T extends string>(regex: RegExp): (x: string) => x is T {
  return function (x: string): x is T {
    return only(regex).test(x);
  };
}

export type StringContaining<T extends string> = `{string}${T}{string}`;

export type TypeGuard<T extends string> = (x: string) => x is T;
export type TypeGuardContaining<T extends string> = (
  x: string,
) => x is StringContaining<T>;

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

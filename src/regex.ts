import { Text } from "npm:@types/mdast";
import merge from "npm:regex-merge";
import { pipe } from "./fn.ts";

export type StartsWith<T extends string> = `${T}${string}`;

export const startWith = <R extends RegExp>(regex: R): R =>
  sequence(/^/, regex);

export const startsWithA = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(regex: RegExp): TypeGuard<T, X, R> => {
  const effectiveRegex = startWith(regex);
  return Object.assign(
    (x: X): R => effectiveRegex.test(typeof x === "string" ? x : x.value) as R,
    { regex: effectiveRegex },
  );
};

export const endWith = <R extends RegExp>(regex: R): R => sequence(regex, /$/);

/**
 * Surrounds a regex with ^ and $, so that it only matches the entire string.
 */
export const only = pipe(startWith, endWith);

/**
 * Returns a type guard that checks if a string matches a regex.
 * @param regex the regex to match
 */
export const isA = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(regex: RegExp): TypeGuard<T, X, R> => {
  const effectiveRegex = only(regex);
  return Object.assign(
    (x: X): R => effectiveRegex.test(typeof x === "string" ? x : x.value) as R,
    { regex: effectiveRegex },
  );
};

export type StringContaining<T extends string> = `{string}${T}{string}`;

/**
 * TypeGuard is a function that takes an argument `x` of type `string | Text`.
 * If the `x` is a `string`, the function returns `x is T`.
 * If the `x` is a `Text`, the function returns `x is Text & { value: T }`.
 */
export type TypeGuard<
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
> =
  & ((x: X) => R)
  & { regex: RegExp };

export type TypeGuardContaining<
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
> = TypeGuard<
  StringContaining<T>,
  X,
  R
>;

/**
 * Returns a type guard that checks if a string contains something that matches a regex.
 * @param regex the regex to match
 * @returns a type guard that checks if a string contains something that matches a regex
 */
export const containsA: <T extends string>(
  regex: RegExp,
) => TypeGuardContaining<T> = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(regex: RegExp): TypeGuardContaining<T, X, R> => {
  return Object.assign(
    (x: X): R => regex.test(typeof x === "string" ? x : x.value) as R,
    { regex },
  );
};

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
 */
export function global<R extends RegExp>(regex: R): R {
  return new RegExp(regex.source, `${regex.flags}g`) as R;
}

/**
 * Wraps a regex in a named capture group.
 * @param groupName name to give the capture group
 * @param regex the regex to capture
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
 * {$@link String.prototype.replace}.
 * @param args the args you receive in a replacer function
 */
export function groups<K extends string>(args: unknown[]): Record<K, string> {
  return args.at(-1) as Record<K, string>;
}

import { Text } from "npm:@types/mdast";
import { TypeGuard } from "../model/type-guard.ts";
import { isString } from "./is-string.ts";
import { only, sequence, startWith } from "./regex.ts";
import { StringContaining } from "./string-types.ts";

/**
 * TextTypeGuard is a function that takes an argument `x` of type `string | Text`.
 * If the `x` is a `string`, the function returns `x is V`.
 * If the `x` is a `Text`, the function returns `x is Text & { value: V }`.
 * It also has a property `regex` that is the regex that the function uses to
 * check if `x` is of type `V`.
 */
export type TextTypeGuard<
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
> =
  & ((x: X) => R)
  & { regex: RegExp };

/**
 * A {@link TextTypeGuard} that checks if a string contains a specific string.
 */
export type TextTypeGuardContaining<
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
> = TextTypeGuard<
  StringContaining<T>,
  X,
  R
>;

/**
 * Returns a {@link TextTypeGuard} that checks if a string matches a regex, and has no other characters.
 * @param regex the regex to match
 * @returns a type guard that checks if a string matches a regex
 * @example
 * ```ts
 * const isAbc = isOnlyA(/abc/);
 * // isAbc is a type guard that checks if a string is only "abc"
 *
 * const isAbc = isOnlyA("abc");
 * // isAbc is a type guard that checks if a string is only "abc"
 * ```
 */
export const isOnlyA = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(regex: RegExp | T): TextTypeGuard<T, X, R> => {
  return matchesA(only(sequence(regex))) as TextTypeGuard<T, X, R>;
};

export const isOnly = <
  T extends string,
>(value: RegExp | T): StringTypeGuard<T> => {
  return matches(only(sequence(value))) as StringTypeGuard<T>;
};

/**
 * Returns a {@link TextTypeGuard} that checks if a string contains something that matches a regex.
 * @param regex the regex to match
 * @returns a type guard that checks if a string contains something that matches a regex
 */
export const containsA: <T extends string>(
  regex: RegExp,
) => TextTypeGuardContaining<`${string}${T}${string}`> = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(
  regex: RegExp | T,
): TextTypeGuardContaining<`${string}${T}${string}`, X, R> => {
  return matchesA(sequence(regex)) as TextTypeGuardContaining<
    `${string}${T}${string}`,
    X,
    R
  >;
};

export const contains: <T extends string>(
  prefix: RegExp | T,
) => StringTypeGuard<`${string}${T}${string}`> = <
  T extends string,
>(prefix: RegExp | T): StringTypeGuard<`${string}${T}${string}`> => {
  return matches(sequence(prefix)) as StringTypeGuard<`${string}${T}${string}`>;
};

/**
 * Returns a {@link TextTypeGuard} that checks if a string starts with something that matches a regex.
 * @param regex the regex to match
 * @returns a type guard that checks if a string starts with something that matches a regex
 * @example
 * ```ts
 * const startsWithAbc = startsWithA(/abc/);
 * // startsWithAbc is a type guard that checks if a string matches /^abc/
 * const result = startsWithAbc("abc is here.");
 * // result is true
 */
export const startsWithA = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: `${T}${string}` } ? true : false),
>(regex: RegExp): TextTypeGuard<`${T}${string}`, X, R> => {
  return matchesA(startWith(regex)) as TextTypeGuard<`${T}${string}`, X, R>;
};

export const startsWith: <T extends string>(
  prefix: RegExp | T,
) => StringTypeGuard<`${T}${string}`> = <
  T extends string,
>(prefix: RegExp | T): StringTypeGuard<`${T}${string}`> => {
  return matches(startWith(sequence(prefix))) as StringTypeGuard<
    `${T}${string}`
  >;
};

export type StringTypeGuard<
  T extends string,
> = TypeGuard<T> & { regex: RegExp };

export function matches<T extends string>(
  regex: RegExp | T,
): StringTypeGuard<T> {
  const effectiveRegex = sequence(regex);
  return Object.assign(
    (x: unknown): boolean => isString(x) && effectiveRegex.test(x),
    { regex: effectiveRegex },
  ) as StringTypeGuard<T>;
}

export function matchesA<
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(
  regex: RegExp | T,
): TextTypeGuard<T, X, R> {
  const effectiveRegex = sequence(regex);
  return Object.assign(
    (x: X): R => effectiveRegex.test(isString(x) ? x : x.value) as R,
    { regex: effectiveRegex },
  );
}

import { Text } from "npm:@types/mdast";
import { isString } from "@hugojosefson/fns/string/is-string";
import { only, sequence, startWith } from "@hugojosefson/fns/string/regex";
import { StringContaining } from "@hugojosefson/fns/string/string-type-guard";

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

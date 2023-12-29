import { Text } from "npm:@types/mdast";
import { only, startWith } from "./regex.ts";
import { StringContaining } from "./string-types.ts";

/**
 * TextTypeGuard is a function that takes an argument `x` of type `string | Text`.
 * If the `x` is a `string`, the function returns `x is T`.
 * If the `x` is a `Text`, the function returns `x is Text & { value: T }`.
 * It also has a property `regex` that is the regex that the function uses to
 * check if `x` is of type `T`.
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
>(regex: RegExp): TextTypeGuard<T, X, R> => {
  const effectiveRegex = only(regex);
  return Object.assign(
    (x: X): R => effectiveRegex.test(typeof x === "string" ? x : x.value) as R,
    { regex: effectiveRegex },
  );
};

/**
 * Returns a {@link TextTypeGuard} that checks if a string contains something that matches a regex.
 * @param regex the regex to match
 * @returns a type guard that checks if a string contains something that matches a regex
 */
export const containsA: <T extends string>(
  regex: RegExp,
) => TextTypeGuardContaining<T> = <
  T extends string,
  X extends (string | Text) = (string | Text),
  R extends boolean = X extends string ? (X extends T ? true : false)
    : (X extends Text & { value: T } ? true : false),
>(regex: RegExp): TextTypeGuardContaining<T, X, R> => {
  return Object.assign(
    (x: X): R => regex.test(typeof x === "string" ? x : x.value) as R,
    { regex },
  );
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
    : (X extends Text & { value: T } ? true : false),
>(regex: RegExp): TextTypeGuard<T, X, R> => {
  const effectiveRegex: RegExp = startWith(regex);
  return Object.assign(
    (x: X): R => effectiveRegex.test(typeof x === "string" ? x : x.value) as R,
    { regex: effectiveRegex },
  );
};

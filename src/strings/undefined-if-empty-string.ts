/**
 * Returns `undefined` if the given string is empty. Otherwise, returns the given string.
 * @param s The string to return if it is not empty.
 * @returns `undefined` if the given string is empty. Otherwise, returns the given string.
 */
export function undefinedIfEmptyString<T extends string>(
  s: T,
): T extends "" ? undefined : T {
  if (s === "") {
    return undefined as T extends "" ? undefined : T;
  }
  return s as T extends "" ? undefined : T;
}

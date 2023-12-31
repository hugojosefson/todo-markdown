/**
 * A type guard for `T`.
 */
export type TypeGuard<T> = (value: unknown) => value is T;

export function isArrayOf<T>(itemTypeGuard: TypeGuard<T>): TypeGuard<T[]> {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(itemTypeGuard);
  };
}

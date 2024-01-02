import { isFunction } from "../fn.ts";
import { isString } from "../strings/is-string.ts";
import { isOnly } from "../strings/text-type-guard.ts";
import { TypeGuard } from "./type-guard.ts";

export function isNonNullObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createIsRecord<K extends string, V>(
  keyTypeGuard: TypeGuard<K> | K,
  valueTypeGuard: TypeGuard<V> | V,
): TypeGuard<Record<K, V>> {
  return (value: unknown): value is Record<K, V> => {
    if (!isNonNullObject(value)) {
      return false;
    }

    const effectiveKeyTypeGuard: TypeGuard<K> =
      isFunction<TypeGuard<K>>(keyTypeGuard)
        ? keyTypeGuard as TypeGuard<K>
        : isOnly(keyTypeGuard);

    const effectiveValueTypeGuard: TypeGuard<V> =
      isFunction<TypeGuard<V>>(valueTypeGuard)
        ? valueTypeGuard as TypeGuard<V>
        : isString(valueTypeGuard)
        ? isOnly(valueTypeGuard)
        : (x: unknown): x is V => valueTypeGuard === x;

    // check that at least some key(s) match. use Array.some
    const matchingKeys = Object.keys(value).filter(effectiveKeyTypeGuard);
    if (matchingKeys.length === 0) {
      return false;
    }

    // for the keys that match, check that the values match
    const valuesToMatch: unknown[] = matchingKeys.map((key) => value[key]);
    return valuesToMatch.every(effectiveValueTypeGuard);
  };
}

/**
 * Creates a type guard for {@link Record}.
 * @param key Name of the property.
 * @param valueTypeGuard Type guard for the property value.
 * @returns A type guard for {@link Record}.
 */
export function createIsRecordWithProperty<K extends string, V>(
  key: K,
  valueTypeGuard: TypeGuard<V> | V,
): TypeGuardForObjectWithPropertyOfType<K, V> {
  return createIsRecord(
    key,
    valueTypeGuard,
  );
}

export type TypeGuardForObjectWithPropertyOfType<K extends string, V> =
  TypeGuard<
    Record<K, V>
  >;

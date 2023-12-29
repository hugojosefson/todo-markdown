/**
 * A string that starts with a specific string.
 */
export type StringStartingWith<T extends string> = `${T}${string}`;
/**
 * A string that contains a specific string.
 */
export type StringContaining<T extends string> = `{string}${T}{string}`;
/**
 * A string that ends with a specific string.
 */
export type StringEndingWith<T extends string> = `${string}${T}`;

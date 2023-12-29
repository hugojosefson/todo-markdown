/**
 * Sorts strings, and removes any duplicates.
 * @param strings The strings to sort and remove duplicates from.
 * @returns The sorted strings, with duplicates removed.
 */
export function sortUnique(strings: string[]): string[] {
  return [...(new Set(strings)).values()].sort();
}

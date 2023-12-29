/**
 * Returns true if the given link is only a fragment.
 * @param link The link to check.
 * @returns True if the given link is only a fragment.
 */
export function isFragment(link: string): link is `#${string}` {
  return /^#/.test(link);
}

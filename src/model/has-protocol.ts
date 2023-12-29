/**
 * Returns true if the given link has a protocol.
 * @param link The link to check.
 * @returns True if the given link has a protocol.
 */
export function hasProtocol(link: string): link is `${string}:${string}` {
  return /^[a-z]+:/.test(link);
}

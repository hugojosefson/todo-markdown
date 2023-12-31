import { hasProtocol } from "../model/has-protocol.ts";
import { isAFragment } from "../model/fragment.ts";
import { resolveAbsoluteTarget } from "../strings/resolve-absolute-target.ts";
import { resolveRelative } from "../strings/resolve-relative.ts";

/**
 * Updates the given link, so that it points to the correct path.
 * @param basePathOfLink The path of the markdown file that the link is from.
 * @param link The link to update.
 * @param linkUpdates A map from paths to update, to their new path.
 */
export function updateLink(
  basePathOfLink: string,
  link: string,
  linkUpdates: Map<string, string>,
): string {
  // 1. Cases when we don't need to update the link, and can return it as-is:
  //   - The link has a protocol
  //   - The link is only a fragment
  // 2. We then need to calculate the absolute path of the link, relative to the input markdown file
  // 3. We then need to check if the absolute path of the link is in the map of paths to update
  // 4. If it is, then we need to update the link
  // 5. If it is not, then we can return the link as-is

  if (hasProtocol(link)) {
    return link;
  }

  if (isAFragment(link)) {
    return link;
  }

  const resolvedAbsoluteTarget = resolveAbsoluteTarget(basePathOfLink, link);
  const targetWasRenamed = linkUpdates.has(resolvedAbsoluteTarget);

  if (targetWasRenamed) {
    const newAbsoluteTarget = linkUpdates.get(resolvedAbsoluteTarget)!;
    return resolveRelative(basePathOfLink, newAbsoluteTarget);
  }

  return link;
}

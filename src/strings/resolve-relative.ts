/**
 * Returns the link, relative to the input markdown file.
 * @param basePath The path of the markdown file that the link is from.
 * @param absoluteTarget The absolute path of the link, relative to the input markdown file.
 * @returns The link, relative to the input markdown file.
 */
export function resolveRelative(
  basePath: string,
  absoluteTarget: string,
): string {
  const basePathDirectory = basePath.replace(/\/[^\/]+$/, "");
  return absoluteTarget
    .replace(basePathDirectory, "")
    .replace(/^\//, "");
}

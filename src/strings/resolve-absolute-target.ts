/**
 * Returns the absolute path of the link, relative to the input markdown file.
 * @param basePath The path of the markdown file that the link is from.
 * @param link The link to get the absolute path of.
 * @returns The absolute path of the link, relative to the input markdown file.
 */
export function resolveAbsoluteTarget(basePath: string, link: string): string {
  const basePathDirectory = basePath.replace(/\/[^\/]+$/, "");
  return `${basePathDirectory}/${link}`;
}

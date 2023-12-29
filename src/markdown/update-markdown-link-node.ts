import { Link } from "npm:@types/mdast";
import { isText } from "../ast/types.ts";
import { sequence } from "../regex.ts";
import { basename } from "std/path/basename.ts";
import { extname } from "std/path/extname.ts";
import { updateLink } from "./update-link.ts";

/**
 * Updates the given Markdown link node, so that it points to the correct path.
 * @param path The path of the markdown file that the link is from.
 * @param linkNode The link node to update.
 * @param pathUpdatesMap A map of paths to update, and their new paths.
 * @returns The updated link node.
 */
export function updateMarkdownLinkNode<T extends Link>(
  path: string,
  linkNode: T,
  pathUpdatesMap: Map<string, string>,
): T {
  const url = decodeURI((linkNode.url as string).replace(/#.*$/, ""));
  const fragment = (linkNode.url as string).replace(/^[^#]*/, "");
  const updatedUrl = updateLink(path, url, pathUpdatesMap);
  if (updatedUrl === url) {
    return linkNode;
  }
  const uriEncodedUpdatedUrl = encodeURI(updatedUrl) + fragment;

  // If the link node only has one child, and that child is a text node.
  if (linkNode.children.length === 1) {
    const child = linkNode.children[0];
    if (isText(child)) {
      // text contains the filename of the url, without the extension
      const extLessUrlBasename = basename(url, extname(url));
      const extLessUpdatedUrlBasename = basename(
        updatedUrl,
        extname(updatedUrl),
      );
      const extLessUrlBasenameRegex = sequence(extLessUrlBasename);
      if (extLessUrlBasenameRegex.test(child.value)) {
        const updatedText = child.value.replace(
          extLessUrlBasenameRegex,
          extLessUpdatedUrlBasename,
        );
        return {
          ...linkNode,
          url: uriEncodedUpdatedUrl,
          children: [
            {
              ...child,
              value: updatedText,
            },
          ],
        };
      }
    }
  }

  // Otherwise, we can just update the link node's url.
  return {
    ...linkNode,
    url: uriEncodedUpdatedUrl,
  };
}

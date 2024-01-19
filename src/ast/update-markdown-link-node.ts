import { Link } from "npm:@types/mdast";
import { isText } from "./node-types.ts";
import { sequence } from "../strings/regex.ts";
import { updateLink } from "../markdown/update-link.ts";
import {
  INPUT_PATH_FILENAME_REGEX,
  INPUT_PATH_INDEX_MD_REGEX,
} from "./transform-input-ast-to-output-commands.ts";

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
      const extLessUrlBasename = taskFileBasename(url);
      const extLessUpdatedUrlBasename = taskFileBasename(updatedUrl);
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

function taskFileBasename(url: string): string {
  const match: RegExpExecArray | null = INPUT_PATH_INDEX_MD_REGEX.exec(url);
  if (match?.groups?.name) {
    return match.groups?.name;
  }

  const match2: RegExpExecArray | null = INPUT_PATH_FILENAME_REGEX.exec(url);
  if (match2?.groups?.name) {
    return match2.groups?.name;
  }

  throw new Error(`Invalid path: ${url}`);
}

import { Heading, Nodes } from "npm:@types/mdast";
import { toString } from "npm:mdast-util-to-string";
import { selectAll } from "npm:unist-util-select";
import { startsWithABox } from "../model/box.ts";
import { undefinedIfEmptyString } from "../strings/undefined-if-empty-string.ts";

/**
 * Extracts the first top-level heading string from the given AST.
 * This is useful for getting the title of a document.
 * @param ast The AST to extract the first top-level heading string from.
 * @returns The first top-level heading string from the given AST.
 */
export function extractFirstTopLevelHeadingString(
  ast: Nodes,
): string | undefined {
  const headings: Heading[] = selectAll(
    "heading",
    ast,
  ) as Heading[];
  const topLevelHeadings: Heading[] = headings.filter((heading) =>
    heading.depth === 1
  );
  const s = toString(topLevelHeadings.at(0))
    .replace(startsWithABox.regex, "")
    .trim();

  return undefinedIfEmptyString(s);
}

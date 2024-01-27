import { Heading, Nodes } from "npm:@types/mdast";
import { toString } from "npm:mdast-util-to-string";
import { selectAll } from "npm:unist-util-select";
import { and } from "../fn.ts";
import { createBoxAndTaskIdRegex, startsWithABox } from "../model/box.ts";
import { ProjectId } from "../model/project-id.ts";
import { createIsRecordWithProperty } from "../model/record.ts";
import { TypeGuard } from "../model/type-guard.ts";
import { startWith } from "../strings/regex.ts";
import { startsWithA } from "../strings/text-type-guard.ts";
import { undefinedIfEmptyString } from "../strings/undefined-if-empty-string.ts";
import { isHeading } from "./node-types.ts";

export type TopLevelHeading = Heading & { depth: 1 };
export const isTopLevelHeading: TypeGuard<TopLevelHeading> = and(
  isHeading,
  createIsRecordWithProperty("depth", 1),
) as TypeGuard<TopLevelHeading>;

/**
 * Extracts the first top-level heading string from the given AST.
 * This is useful for getting the title of a document.
 * @param ast The AST to extract the first top-level heading string from.
 * @returns The first top-level heading string from the given AST.
 */
export function extractFirstTopLevelHeadingString(
  ast: Nodes,
): string | undefined {
  const firstTopLevelHeading: TopLevelHeading | undefined =
    extractFirstTopLevelHeading(ast);
  const s = toString(firstTopLevelHeading)
    .replace(startsWithABox.regex, "")
    .trim();

  return undefinedIfEmptyString(s);
}

export function createExtractHeadingString<PI extends ProjectId>(
  projectId: PI,
): (heading: Heading) => string {
  const boxAndTaskId = startWith(createBoxAndTaskIdRegex(projectId));
  return (heading: Heading) =>
    toString(heading)
      .replace(boxAndTaskId, "")
      .trim();
}

/**
 * Extracts the first top-level heading from the given AST.
 * This is useful for getting the title of a document, and for finding any {@link Box} that it may have.
 * @param ast The AST to extract the first top-level heading from.
 * @returns The first top-level heading from the given AST.
 * @see extractFirstTopLevelHeadingString
 * @see hasABox
 */
export function extractFirstTopLevelHeading(
  ast: Nodes,
): TopLevelHeading | undefined {
  const headings: Heading[] = selectAll(
    "heading",
    ast,
  ) as Heading[];
  const topLevelHeadings: TopLevelHeading[] = headings.filter(
    isTopLevelHeading,
  );
  return topLevelHeadings.at(0);
}

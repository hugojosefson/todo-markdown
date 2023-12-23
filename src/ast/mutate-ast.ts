import { isString } from "https://deno.land/x/run_simple@2.2.0/src/fn.ts";
import { Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";
import { and, boolify, not, reduceToLargestNumber } from "../fn.ts";
import { startsWithA } from "../regex.ts";
import { ProjectId } from "../strings/project-id.ts";
import { extractTaskIdNumber } from "../strings/task-id-number.ts";
import { createTaskIdPlaceholderRegex } from "../strings/task-id-placeholder.ts";
import { createExtractTaskId, createTaskIdRegex } from "../strings/task-id.ts";

/**
 * Finds the maximum identifier number in the given tree.
 * @param projectId The project identifier to search for.
 * @param tree The tree to search.
 * @returns The maximum identifier number in the given tree.
 */
export function getMaxIdentifierNumber<PI extends ProjectId = ProjectId>(
  projectId: PI,
  tree: Nodes,
): number {
  const texts: Text[] = selectAll("text", tree) as Text[];
  return texts
    .map(createExtractTaskId(projectId))
    .filter(isString)
    .map((x) => x!)
    .map(extractTaskIdNumber)
    .filter(isString)
    .map((x) => x!)
    .map((taskIdNumber) => parseInt(taskIdNumber, 10))
    .reduce(reduceToLargestNumber, 0);
}

/**
 * Mutates the given tree, giving each task a unique identifier.
 * @param projectId
 * @param tree
 */
export function mutateAst<PI extends ProjectId = ProjectId>(
  projectId: PI,
  tree: Nodes,
): void {
  const taskIdRegex = createTaskIdRegex(projectId);
  const taskIdPlaceholderRegex = createTaskIdPlaceholderRegex(projectId);
  const startsWithTaskIdPlaceholder = startsWithA(taskIdPlaceholderRegex);
  const startsWithTaskId = startsWithA(taskIdRegex);

  let maxIdentifierNumber = getMaxIdentifierNumber(projectId, tree);
  const nextIdentifierNumber = () => ++maxIdentifierNumber;

  const texts: Text[] = selectAll("text", tree) as Text[];

  const listItemParagraphTexts: Text[] = selectAll(
    "listItem > paragraph text",
    tree,
  ) as Text[];
  const headingTexts: Text[] = selectAll("heading text", tree) as Text[];

  const withTaskIdPlaceholder: Text[] = [
    ...listItemParagraphTexts,
    ...headingTexts,
  ]
    .filter(startsWithTaskIdPlaceholder);

  const withoutTaskId: Text[] = listItemParagraphTexts
    .filter(and(
      not(boolify(startsWithTaskIdPlaceholder)),
      not(boolify(startsWithTaskId)),
    ));

  for (const textNode of texts) {
    if (withTaskIdPlaceholder.includes(textNode)) {
      textNode.value = textNode.value
        .replace(
          taskIdPlaceholderRegex,
          () => `${projectId}-${nextIdentifierNumber()}`,
        );
    }
    if (withoutTaskId.includes(textNode)) {
      textNode.value =
        `${projectId}-${nextIdentifierNumber()} ${textNode.value}`;
    }
  }
}

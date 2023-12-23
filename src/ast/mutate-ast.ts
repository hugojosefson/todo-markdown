import { isString } from "https://deno.land/x/run_simple@2.2.0/src/fn.ts";
import { Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";
import { boolify, not, reduceToLargestNumber } from "../fn.ts";
import { ProjectId } from "../strings/project-id.ts";
import { extractTaskIdNumber } from "../strings/task-id-number.ts";
import { createTaskIdPlaceholderRegex } from "../strings/task-id-placeholder.ts";
import { createExtractTaskId } from "../strings/task-id.ts";

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
  const extractTaskId = createExtractTaskId(projectId);
  const extractTaskIdPlaceholder = createExtractTaskId(projectId);
  const taskIdPlaceholderRegex = createTaskIdPlaceholderRegex(projectId);

  let maxIdentifierNumber = getMaxIdentifierNumber(projectId, tree);
  const nextIdentifierNumber = () => ++maxIdentifierNumber;

  const listItemParagraphTexts: Text[] = selectAll(
    "listItem > paragraph text",
    tree,
  ) as Text[];
  const headingTexts: Text[] = selectAll("heading text", tree) as Text[];

  const textNodesWithTaskIdPlaceholder: Text[] = [
    ...listItemParagraphTexts
      .filter(extractTaskIdPlaceholder),
    ...headingTexts
      .filter(extractTaskIdPlaceholder),
  ];
  const textNodesWithoutTaskId: Text[] = listItemParagraphTexts
    .filter(not(boolify(extractTaskId)));

  textNodesWithTaskIdPlaceholder.forEach((textNode) => {
    textNode.value = textNode.value
      .replace(
        taskIdPlaceholderRegex,
        () => `${projectId}-${nextIdentifierNumber()}`,
      );
  });

  textNodesWithoutTaskId.forEach((textNode) => {
    textNode.value = `${projectId}-${nextIdentifierNumber()} ${textNode.value}`;
  });
}

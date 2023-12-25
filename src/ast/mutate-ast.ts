import { isString } from "run_simple/src/fn.ts";
import { ListItem, Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";
import { reduceToLargestNumber } from "../fn.ts";
import { groups, startsWithA } from "../regex.ts";
import {
  BOX_REGEX,
  createBoxAndTaskIdPlaceholderRegex,
  createBoxAndTaskIdRegex,
} from "../strings/box.ts";
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
  const startsWithTaskId = startsWithA(createTaskIdRegex(projectId));
  const startsWithTaskIdPlaceholder = startsWithA(
    createTaskIdPlaceholderRegex(projectId),
  );
  const startsWithBoxAndTaskId = startsWithA(
    createBoxAndTaskIdRegex(projectId),
  );
  const startsWithBoxAndTaskIdPlaceholder = startsWithA(
    createBoxAndTaskIdPlaceholderRegex(
      projectId,
    ),
  );
  const startsWithBox = startsWithA(BOX_REGEX);

  let maxIdentifierNumber = getMaxIdentifierNumber(projectId, tree);
  const nextIdentifierNumber = () => ++maxIdentifierNumber;

  const allTextNodes = selectAll("text", tree) as Text[];
  const allListItemNodes = selectAll("listItem", tree) as ListItem[];
  const allTextNodesInsideAHeadingNode = selectAll(
    "heading text",
    tree,
  ) as Text[];

  const isHeading = (textNode: Text) =>
    allTextNodesInsideAHeadingNode.includes(textNode);
  const findListItemWithTextNode = (textNode: Text) =>
    allListItemNodes.find((listItem: ListItem) =>
      selectAll("paragraph text", listItem).includes(textNode)
    );

  const processHeading = (textNode: Text): void => {
    // if heading meant as a task, should look like this:
    // {value: "[ ] TODO-123 This is a task"}

    if (startsWithBoxAndTaskId(textNode)) {
      // if heading has both box and proper task id, return
      return;
    }

    if (startsWithBoxAndTaskIdPlaceholder(textNode)) {
      // if heading has box, and unidentified placeholder task id, replace with new task id
      textNode.value = textNode.value.replace(
        startsWithBoxAndTaskIdPlaceholder.regex,
        (...args) =>
          `${groups<"box">(args).box} ${projectId}-${nextIdentifierNumber()}`,
      );
      return;
    }

    if (startsWithTaskId(textNode)) {
      // if heading already has task id, but no box, add box
      textNode.value = textNode.value.replace(
        startsWithTaskId.regex,
        (...args) => `[ ] ${groups<"taskId">(args).taskId}`,
      );
      return;
    }

    if (startsWithTaskIdPlaceholder(textNode)) {
      // if heading has unidentified placeholder task id, replace with new task id, and add box
      textNode.value = textNode.value.replace(
        startsWithTaskIdPlaceholder.regex,
        () => `[ ] ${projectId}-${nextIdentifierNumber()}`,
      );
      return;
    }

    if (startsWithBox(textNode)) {
      // if heading has box, but no task id, add task id
      textNode.value = textNode.value.replace(
        startsWithBox.regex,
        (...args) =>
          `${groups<"box">(args).box} ${projectId}-${nextIdentifierNumber()}`,
      );
      return;
    }
  };

  const processListItem = (textNode: Text, listItem: ListItem): void => {
    // if list item meant as a task, should look like this:
    // {checked: true|false, value: "TODO-123 This is a task"}

    // if it is not meant as a task, it should look like this:
    // {checked: null, value: "This is not a task"}

    // whether it's meant as a task, is determined by whether it starts with a task id, placeholder, or a box.

    if (listItem.checked === true || listItem.checked === false) {
      // list item has a box!
      if (startsWithTaskId(textNode)) {
        // if list item has box, and proper task id, return
        return;
      }
      if (startsWithTaskIdPlaceholder(textNode)) {
        // if list item has box, and unidentified placeholder task id, replace with new task id
        textNode.value = textNode.value.replace(
          startsWithTaskIdPlaceholder.regex,
          () => `${projectId}-${nextIdentifierNumber()}`,
        );
        return;
      }
      // if list item has box, but no task id, add task id
      textNode.value =
        `${projectId}-${nextIdentifierNumber()} ${textNode.value}`;
      return;
    }

    // list item has no box!
    if (startsWithTaskId(textNode)) {
      // if list item has no box, but proper task id, add box
      listItem.checked = false;
      return;
    }
    if (startsWithTaskIdPlaceholder(textNode)) {
      // if list item has no box, but unidentified placeholder task id, replace with new task id, and add box
      textNode.value = textNode.value.replace(
        startsWithTaskIdPlaceholder.regex,
        () => `${projectId}-${nextIdentifierNumber()}`,
      );
      listItem.checked = false;
      return;
    }
    // if list item has no box, and no task id, it's not meant as a task
  };

  for (const textNode of allTextNodes) {
    if (isHeading(textNode)) {
      processHeading(textNode);
    }
    const listItem = findListItemWithTextNode(textNode);
    if (listItem) {
      processListItem(textNode, listItem);
    }
  }
}

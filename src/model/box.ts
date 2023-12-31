import { Heading, ListItem, PhrasingContent } from "npm:@types/mdast";
import { isHeading, isListItem, isText } from "../ast/node-types.ts";
import { capture, sequence } from "../strings/regex.ts";
import { StringStartingWith } from "../strings/string-types.ts";
import {
  isOnlyA,
  startsWithA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import { PROJECT_ID_REGEX, ProjectId } from "./project-id.ts";
import {
  createTaskIdPlaceholderRegex,
  TaskIdPlaceholder,
} from "./task-id-placeholder.ts";
import { createTaskIdRegex, TaskId } from "./task-id.ts";

export type BoxContents = " " | "x";
export const BOX_CONTENTS_REGEX = /(?<boxContents>[ x])/;
export const isABoxContents: TextTypeGuard<BoxContents> = isOnlyA<BoxContents>(
  BOX_CONTENTS_REGEX,
);

export type Box = `^[${BoxContents}]`;
export const BOX_REGEX = capture(
  "box",
  sequence("[", BOX_CONTENTS_REGEX, "]"),
);
export const isABox: TextTypeGuard<Box> = isOnlyA<Box>(BOX_REGEX);

export type BoxAndTaskId<PI extends ProjectId = ProjectId> = `${Box} ${TaskId<
  PI
>}`;
export type BoxAndTaskIdPlaceholder<PI extends ProjectId = ProjectId> =
  `${Box} ${TaskIdPlaceholder<PI>}`;
export function createBoxAndTaskIdRegex<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return sequence(BOX_REGEX, " ", createTaskIdRegex(projectId));
}
export function createBoxAndTaskIdPlaceholderRegex<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return sequence(BOX_REGEX, " ", createTaskIdPlaceholderRegex(projectId));
}

export function createIsABoxAndTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): TextTypeGuard<BoxAndTaskId<PI>> {
  return isOnlyA<BoxAndTaskId<PI>>(
    createBoxAndTaskIdRegex(projectId),
  );
}

/**
 * A {@link TextTypeGuard} that checks if a string starts with a box.
 */
export const startsWithABox: TextTypeGuard<StringStartingWith<Box>> =
  startsWithA(BOX_REGEX);

/**
 * Returns true if the given {@link ListItem} has a box.
 * @param listItem The list item to check.
 */
export function hasABox(
  listItem: ListItem,
): listItem is ListItem & { checked: boolean };
/**
 * Returns true if the given {@link Heading} has a box in its first child.
 * @param heading The heading to check.
 */
export function hasABox(
  heading: Heading,
): heading is Heading & {
  children: [
    { type: "text"; value: StringStartingWith<Box> },
    ...PhrasingContent[],
  ];
};
/**
 * Returns true if the given {@link ListItem} or {@link Heading} has a box.
 * @param node The node to check.
 */
export function hasABox<T extends ListItem | Heading>(node: T): boolean {
  if (isHeading(node)) {
    return hasHeadingABox(node);
  }
  if (isListItem(node)) {
    return hasListItemABox(node);
  }
  return false;
}

/**
 * Type-guard for {@link ListItem} that definitely has a box.
 * @param listItem The list item to check.
 */
function hasListItemABox(
  listItem: ListItem,
): listItem is ListItem & { checked: boolean } {
  return listItem.checked === true || listItem.checked === false;
}

/**
 * Returns true if the given heading has a first child that is a text node, and that starts with a box.
 * @param heading The heading to check.
 */
function hasHeadingABox(
  heading: Heading,
): heading is Heading & {
  children: [
    { type: "text"; value: StringStartingWith<Box> },
    ...PhrasingContent[],
  ];
} {
  return isText(heading.children[0]) && startsWithABox(heading.children[0]);
}

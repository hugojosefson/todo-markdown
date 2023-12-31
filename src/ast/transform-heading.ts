import { Heading } from "npm:@types/mdast";
import { groups } from "../strings/regex.ts";
import {
  Box,
  BOX_REGEX,
  BoxAndTaskId,
  BoxAndTaskIdPlaceholder,
  createBoxAndTaskIdPlaceholderRegex,
  createBoxAndTaskIdRegex,
} from "../model/box.ts";
import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import {
  createTaskIdPlaceholderRegex,
  TaskIdPlaceholder,
} from "../model/task-id-placeholder.ts";
import { createTaskIdRegex, TaskId } from "../model/task-id.ts";
import { StringStartingWith } from "../strings/string-types.ts";
import { startsWithA, TextTypeGuard } from "../strings/text-type-guard.ts";
import { transformNodeReplaceFirstChildTextValue } from "./transform-node-replace-first-child-text-value.ts";

import { isWithFirstChildText } from "./with-first-child.ts";

/**
 * Transforms a {@link Heading}.
 * @param projectId The project identifier to use.
 * @param nextIdentifierNumberGetter The function to use to get the next identifier number.
 * @param heading The heading to transform.
 * @returns The transformed heading.
 */
export function transformHeading<
  T extends Heading,
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumberGetter: NextIdentifierNumberGetter,
  heading: T,
): T {
  if (heading.children.length === 0) {
    // if heading has no children, return as is
    return heading;
  }

  if (!isWithFirstChildText(heading)) {
    // if heading doesn't start with text, return as is
    return heading;
  }
  const startsWithABoxAndTaskId: TextTypeGuard<
    StringStartingWith<BoxAndTaskId<PI>>
  > = startsWithA(
    createBoxAndTaskIdRegex(projectId),
  );
  if (startsWithABoxAndTaskId(heading.children[0])) {
    // if heading has both box and proper task id, return as is
    return heading;
  }

  const startsWithABoxAndTaskIdPlaceholder: TextTypeGuard<
    StringStartingWith<BoxAndTaskIdPlaceholder<PI>>
  > = startsWithA(
    createBoxAndTaskIdPlaceholderRegex(
      projectId,
    ),
  );
  if (startsWithABoxAndTaskIdPlaceholder(heading.children[0])) {
    // if heading has box, and unidentified placeholder task id, replace with new task id
    return transformNodeReplaceFirstChildTextValue(
      heading,
      startsWithABoxAndTaskIdPlaceholder.regex,
      (...args) =>
        `${
          groups<"box">(args).box
        } ${projectId}-${nextIdentifierNumberGetter()}`,
    );
  }

  const startsWithATaskId: TextTypeGuard<StringStartingWith<TaskId<PI>>> =
    startsWithA(createTaskIdRegex(projectId));
  if (startsWithATaskId(heading.children[0])) {
    // if heading already has task id, but no box, add box
    return transformNodeReplaceFirstChildTextValue(
      heading,
      startsWithATaskId.regex,
      (...args) => `[ ] ${groups<"taskId">(args).taskId}`,
    );
  }

  const startsWithATaskIdPlaceholder: TextTypeGuard<
    StringStartingWith<TaskIdPlaceholder<PI>>
  > = startsWithA(
    createTaskIdPlaceholderRegex(projectId),
  );
  if (startsWithATaskIdPlaceholder(heading.children[0])) {
    // if heading has unidentified placeholder task id, replace with new task id, and add box
    return transformNodeReplaceFirstChildTextValue(
      heading,
      startsWithATaskIdPlaceholder.regex,
      () => `[ ] ${projectId}-${nextIdentifierNumberGetter()}`,
    );
  }

  const startsWithABox: TextTypeGuard<StringStartingWith<Box>> = startsWithA(
    BOX_REGEX,
  );
  if (startsWithABox(heading.children[0])) {
    // if heading has box, but no task id, add task id
    return transformNodeReplaceFirstChildTextValue(
      heading,
      startsWithABox.regex,
      (...args) =>
        `${
          groups<"box">(args).box
        } ${projectId}-${nextIdentifierNumberGetter()}`,
    );
  }

  return heading;
}

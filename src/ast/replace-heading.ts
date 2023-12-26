import { Heading } from "npm:@types/mdast";
import { groups, startsWithA } from "../regex.ts";
import {
  BOX_REGEX,
  createBoxAndTaskIdPlaceholderRegex,
  createBoxAndTaskIdRegex,
} from "../strings/box.ts";
import { ProjectId } from "../strings/project-id.ts";
import { NextIdentifierNumberGetter } from "../strings/task-id-number.ts";
import { createTaskIdPlaceholderRegex } from "../strings/task-id-placeholder.ts";
import { createTaskIdRegex } from "../strings/task-id.ts";
import { replaceFirstChildTextValue } from "./replace-first-child-text-value.ts";
import { isWithFirstChildText } from "./types.ts";

export function replaceHeading<
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
  const startsWithBoxAndTaskId = startsWithA(
    createBoxAndTaskIdRegex(projectId),
  );
  if (startsWithBoxAndTaskId(heading.children[0])) {
    // if heading has both box and proper task id, return as is
    return heading;
  }

  const startsWithBoxAndTaskIdPlaceholder = startsWithA(
    createBoxAndTaskIdPlaceholderRegex(
      projectId,
    ),
  );
  if (startsWithBoxAndTaskIdPlaceholder(heading.children[0])) {
    // if heading has box, and unidentified placeholder task id, replace with new task id
    return replaceFirstChildTextValue(
      heading,
      startsWithBoxAndTaskIdPlaceholder.regex,
      (...args) =>
        `${
          groups<"box">(args).box
        } ${projectId}-${nextIdentifierNumberGetter()}`,
    );
  }

  const startsWithTaskId = startsWithA(createTaskIdRegex(projectId));
  if (startsWithTaskId(heading.children[0])) {
    // if heading already has task id, but no box, add box
    return replaceFirstChildTextValue(
      heading,
      startsWithTaskId.regex,
      (...args) => `[ ] ${groups<"taskId">(args).taskId}`,
    );
  }

  const startsWithTaskIdPlaceholder = startsWithA(
    createTaskIdPlaceholderRegex(projectId),
  );
  if (startsWithTaskIdPlaceholder(heading.children[0])) {
    // if heading has unidentified placeholder task id, replace with new task id, and add box
    return replaceFirstChildTextValue(
      heading,
      startsWithTaskIdPlaceholder.regex,
      () => `[ ] ${projectId}-${nextIdentifierNumberGetter()}`,
    );
  }

  const startsWithBox = startsWithA(BOX_REGEX);
  if (startsWithBox(heading.children[0])) {
    // if heading has box, but no task id, add task id
    return replaceFirstChildTextValue(
      heading,
      startsWithBox.regex,
      (...args) =>
        `${
          groups<"box">(args).box
        } ${projectId}-${nextIdentifierNumberGetter()}`,
    );
  }

  return heading;
}

import { extractA } from "../strings/extract-a.ts";
import {
  isOnly,
  StringContaining,
} from "@hugojosefson/fns/string/string-type-guard";
import { TypeGuard } from "@hugojosefson/fns/type-guard/type-guard";
import { PROJECT_ID_REGEX, type ProjectId } from "./project-id.ts";
import { capture, sequence } from "@hugojosefson/fns/string/regex";
import { TASK_ID_NUMBER_REGEX, TaskIdNumber } from "./task-id-number.ts";
import { Text } from "npm:@types/mdast";
import { isString } from "@hugojosefson/fns/string/is-string";
import { and } from "@hugojosefson/fns/fn/and";
import {
  containsA,
  isOnlyA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";

export function createTaskIdRegex<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): RegExp {
  return capture(
    "taskId",
    sequence(
      projectId,
      /-/,
      TASK_ID_NUMBER_REGEX,
    ),
  );
}
export type TaskId<PI extends ProjectId = ProjectId> = `${PI}-${TaskIdNumber}`;

export function createIsATaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): TextTypeGuard<TaskId<PI>> {
  return isOnlyA<TaskId<PI>>(createTaskIdRegex(projectId));
}

export function createContainsTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
) {
  return containsA<TaskId<PI>>(createTaskIdRegex(projectId));
}

export type ExtractTaskId<PI extends ProjectId = ProjectId> = (
  text: StringContaining<TaskId<PI>> | Text,
) => TaskId<PI> | undefined;

export function createExtractTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): ExtractTaskId<PI> {
  return extractA<TaskId<PI>>(createTaskIdRegex(projectId));
}

export function createIsTaskId<PI extends ProjectId = ProjectId>(
  projectId: PI | RegExp = PROJECT_ID_REGEX,
): TypeGuard<TaskId<PI>> {
  return and(
    isString,
    isOnly<TaskId<PI>>(createTaskIdRegex(projectId)),
  ) as TypeGuard<TaskId<PI>>;
}

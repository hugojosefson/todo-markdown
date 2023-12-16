import { PROJECT_ID_REGEX, type ProjectId } from "./project-id.ts";
import { containsA, isA, sequence, TypeGuard } from "./regex.ts";
import { TASK_ID_NUMBER_REGEX, TaskIdNumber } from "./task-id-number.ts";

export const TASK_ID_REGEX = sequence(
  PROJECT_ID_REGEX,
  /-/,
  TASK_ID_NUMBER_REGEX,
);
export type TaskId = `${ProjectId}-${TaskIdNumber}`;
export const isTaskId: TypeGuard<TaskId> = isA<TaskId>(TASK_ID_REGEX);

export const containsTaskId = containsA<TaskId>(TASK_ID_REGEX);

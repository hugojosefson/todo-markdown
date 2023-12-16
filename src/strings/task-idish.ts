import { containsA, isA, or, TypeGuard } from "../regex.ts";
import {
  TASK_ID_PLACEHOLDER_REGEX,
  TaskIdPlaceholder,
} from "./task-id-placeholder.ts";
import { TASK_ID_REGEX, TaskId } from "./task-id.ts";

export type TaskIdish = TaskId | TaskIdPlaceholder;
export const TASK_IDISH_REGEX = or(TASK_ID_REGEX, TASK_ID_PLACEHOLDER_REGEX);
export const isTaskIdish: TypeGuard<TaskIdish> = isA<TaskIdish>(
  TASK_IDISH_REGEX,
);
export const containsTaskIdish = containsA<TaskIdish>(TASK_IDISH_REGEX);

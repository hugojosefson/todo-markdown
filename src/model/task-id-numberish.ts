import { or } from "../strings/regex.ts";
import {
  containsA,
  isOnlyA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import {
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
  TaskIdNumberPlaceholder,
} from "./task-id-number-placeholder.ts";
import { TASK_ID_NUMBER_REGEX, TaskIdNumber } from "./task-id-number.ts";

export type TaskIdNumberish = TaskIdNumber | TaskIdNumberPlaceholder;
export const TASK_ID_NUMBERISH_REGEX = or(
  TASK_ID_NUMBER_REGEX,
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);
export const isTaskIdNumberish: TextTypeGuard<TaskIdNumberish> = isOnlyA<
  TaskIdNumberish
>(
  TASK_ID_NUMBERISH_REGEX,
);
export const containsTaskIdNumberish = containsA<TaskIdNumberish>(
  TASK_ID_NUMBERISH_REGEX,
);

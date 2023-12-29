import { isOnlyA, TextTypeGuard } from "../strings/text-type-guard.ts";
import { TASK_ID_NUMBER_PLACEHOLDER_REGEX } from "./task-id-number-placeholder.ts";

export type TaskIdNumberPlaceholderChar = "x" | "X" | "n" | "N" | "?";
export const isTaskIdNumberPlaceholderChar: TextTypeGuard<
  TaskIdNumberPlaceholderChar
> = isOnlyA<TaskIdNumberPlaceholderChar>(TASK_ID_NUMBER_PLACEHOLDER_REGEX);

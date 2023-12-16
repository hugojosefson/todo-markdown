import { isA, TypeGuard } from "../regex.ts";
import { TASK_ID_NUMBER_PLACEHOLDER_REGEX } from "./task-id-number-placeholder.ts";

export type TaskIdNumberPlaceholderChar = "x" | "X" | "n" | "N" | "?";
export const isTaskIdNumberPlaceholderChar: TypeGuard<
  TaskIdNumberPlaceholderChar
> = isA<TaskIdNumberPlaceholderChar>(TASK_ID_NUMBER_PLACEHOLDER_REGEX);

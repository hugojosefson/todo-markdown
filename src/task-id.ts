import { containsA, isA, or, sequence, TypeGuard } from "./regex.ts";
import { PROJECT_ID_REGEX, type ProjectId } from "./project-id.ts";
export const TASK_ID_NUMBER_REGEX = /(?<taskIdNumber>\d+)/u;
export const TASK_ID_NUMBER_PLACEHOLDER_REGEX =
  /(?<taskIdNumberPlaceholder>\?+\b|x+\b|X+\b|n+\b|N+\b)/u;
export const TASK_ID_REGEX = sequence(
  PROJECT_ID_REGEX,
  /-/,
  TASK_ID_NUMBER_REGEX,
);
export const TASK_ID_PLACEHOLDER_REGEX = sequence(
  PROJECT_ID_REGEX,
  /-/,
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);
export type TaskIdNumber = `{number}`;
export type TaskIdNumberPlaceholderChar = "x" | "X" | "n" | "N" | "?";
export const isTaskIdNumber: TypeGuard<TaskIdNumber> = isA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);
export const isTaskIdNumberPlaceholderChar: TypeGuard<
  TaskIdNumberPlaceholderChar
> = isA<TaskIdNumberPlaceholderChar>(TASK_ID_NUMBER_PLACEHOLDER_REGEX);
export type TaskIdNumberPlaceholder = `${string}`;
export type TaskId = `${ProjectId}-${TaskIdNumber}`;
export type TaskIdPlaceholder = `${ProjectId}-${TaskIdNumberPlaceholder}`;
export const isTaskId: TypeGuard<TaskId> = isA<TaskId>(TASK_ID_REGEX);
export const isTaskIdPlaceholder: TypeGuard<TaskIdPlaceholder> = isA<
  TaskIdPlaceholder
>(TASK_ID_PLACEHOLDER_REGEX);
export type TaskIdNumberish = TaskIdNumber | TaskIdNumberPlaceholder;
export type TaskIdish = TaskId | TaskIdPlaceholder;

export const TASK_ID_NUMBERISH_REGEX = or(
  TASK_ID_NUMBER_REGEX,
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);

export const TASK_IDISH_REGEX = or(TASK_ID_REGEX, TASK_ID_PLACEHOLDER_REGEX);
export const isTaskIdNumberish: TypeGuard<TaskIdNumberish> = isA<
  TaskIdNumberish
>(
  TASK_ID_NUMBERISH_REGEX,
);
export const isTaskIdish: TypeGuard<TaskIdish> = isA<TaskIdish>(
  TASK_IDISH_REGEX,
);
export const containsTaskIdNumberish = containsA<TaskIdNumberish>(
  TASK_ID_NUMBERISH_REGEX,
);
export const containsTaskIdish = containsA<TaskIdish>(TASK_IDISH_REGEX);
export const containsTaskId = containsA<TaskId>(TASK_ID_REGEX);
export const containsTaskIdPlaceholder = containsA<TaskIdPlaceholder>(
  TASK_ID_PLACEHOLDER_REGEX,
);
export const containsTaskIdNumber = containsA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);
export const containsTaskIdNumberPlaceholder = containsA<
  TaskIdNumberPlaceholder
>(
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);

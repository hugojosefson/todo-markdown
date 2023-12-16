import { containsA } from "../regex.ts";

export const TASK_ID_NUMBER_PLACEHOLDER_REGEX =
  /(?<taskIdNumberPlaceholder>\?+\b|x+\b|X+\b|n+\b|N+\b)/u;
export type TaskIdNumberPlaceholder = `${string}`;
export const containsTaskIdNumberPlaceholder = containsA<
  TaskIdNumberPlaceholder
>(
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);

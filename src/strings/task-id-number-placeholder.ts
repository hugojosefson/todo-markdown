import { capture, containsA, or } from "../regex.ts";

export const TASK_ID_NUMBER_PLACEHOLDER_REGEX = capture(
  "taskIdNumberPlaceholder",
  or(
    /\?+/u,
    /x+/u,
    /X+/u,
    /n+/u,
    /N+/u,
  ),
);
export type TaskIdNumberPlaceholder = `${string}`;
export const containsTaskIdNumberPlaceholder = containsA<
  TaskIdNumberPlaceholder
>(
  TASK_ID_NUMBER_PLACEHOLDER_REGEX,
);

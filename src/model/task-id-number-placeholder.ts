import { capture, or } from "@hugojosefson/fns/string/regex";
import { containsA } from "../strings/text-type-guard.ts";

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

import { containsA, extractA, isA, TypeGuard } from "../regex.ts";

export const TASK_ID_NUMBER_REGEX = /(?<taskIdNumber>\d+)/u;
export type TaskIdNumber = `{number}`;
export const isTaskIdNumber: TypeGuard<TaskIdNumber> = isA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);
export const containsTaskIdNumber = containsA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);
export const extractTaskIdNumber = extractA<TaskIdNumber>(
  TASK_ID_NUMBER_REGEX,
);

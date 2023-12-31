import { isString } from "../strings/is-string.ts";
import { startsWith } from "../strings/text-type-guard.ts";
import { createIsRecord } from "./record.ts";
import { TypeGuard } from "./type-guard.ts";

/**
 * Record of absolute input file paths, and their Markdown source contents.
 */
export type Inputs = Record<string, string>;

export const isInputs: TypeGuard<Inputs> = createIsRecord(
  startsWith("/"),
  isString,
);

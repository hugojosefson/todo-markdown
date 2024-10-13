import { isString } from "@hugojosefson/fns/string/is-string";
import { startsWith } from "@hugojosefson/fns/string/string-type-guard";
import { createIsRecord } from "@hugojosefson/fns/object/is-record";
import { TypeGuard } from "@hugojosefson/fns/type-guard/type-guard";

/**
 * Record of absolute input file paths, and their Markdown source contents.
 */
export type Inputs = Record<string, string>;

export const isInputs: TypeGuard<Inputs> = createIsRecord(
  startsWith("/"),
  isString,
);

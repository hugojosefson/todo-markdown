import { Nodes } from "npm:@types/mdast";
import { isParent } from "../ast/node-types.ts";
import { startsWith } from "@hugojosefson/fns/string/string-type-guard";
import { createIsRecord } from "@hugojosefson/fns/object/is-record";
import { TypeGuard } from "@hugojosefson/fns/type-guard/type-guard";

/**
 * Record of absolute input file paths, and their Markdown ASTs.
 */
export type InputAsts = Record<string, Nodes>;

/**
 * Type guard for {@link InputAsts}.
 */
export const isInputAsts: TypeGuard<InputAsts> = createIsRecord(
  startsWith("/"),
  isParent,
) as TypeGuard<InputAsts>;

import { Nodes } from "npm:@types/mdast";
import { isParent } from "../ast/node-types.ts";
import { startsWith } from "../strings/text-type-guard.ts";
import { createIsRecord } from "./record.ts";
import { TypeGuard } from "./type-guard.ts";

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

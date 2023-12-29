import { Nodes } from "npm:@types/mdast";

/**
 * Record of absolute input file paths, and their Markdown ASTs.
 */
export type InputAsts = Record<string, Nodes>;

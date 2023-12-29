import { Nodes } from "npm:@types/mdast";
import { markdownToAst } from "../ast/markdown-to-ast.ts";

export function getInputAsts(
  inputs: Record<string, string>,
): Record<string, Nodes> {
  return Object.fromEntries(
    Object.entries(inputs).map(([inputPath, input]) => [
      inputPath,
      markdownToAst(input),
    ]),
  );
}

import { markdownToAst } from "./markdown-to-ast.ts";
import { InputAsts } from "../model/input-asts.ts";

import { Inputs } from "../model/inputs.ts";

/**
 * Converts an {@link Inputs} record of Markdown text files to an {@link InputAsts} record of ASTs.
 * @param inputs the Markdown to convert into ASTs
 * @returns the ASTs of the given Markdown
 */
export function inputsToInputAsts(
  inputs: Inputs,
): InputAsts {
  return Object.fromEntries(
    Object.entries(inputs).map(([inputPath, input]) => [
      inputPath,
      markdownToAst(input),
    ]),
  );
}

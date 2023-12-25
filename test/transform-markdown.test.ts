import { describe, it } from "std/testing/bdd.ts";
import { selectAll } from "npm:unist-util-select";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";
import { Code } from "npm:@types/mdast";
import { expectInputToOutput } from "./expect-input-to-output.ts";

describe("transformMarkdown", () => {
  it("should handle examples in the README", async () => {
    const readmeSource = await Deno.readTextFile(
      (new URL("../README.md", import.meta.url)).pathname,
    );
    const readmeAst = markdownToAst(readmeSource);
    const [inputCodeBlock, outputCodeBlock] = selectAll(
      "code",
      readmeAst,
    ) as Code[];
    await expectInputToOutput(inputCodeBlock.value, outputCodeBlock.value)();
  });
});

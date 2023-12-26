import { assertEquals } from "std/assert/assert_equals.ts";
import { mapValues } from "std/collections/map_values.ts";
import { mapKeys } from "std/collections/map_keys.ts";
import { transformMarkdown } from "../mod.ts";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";
import {
  DELETE_FILE,
  transformMarkdownDirectory,
} from "../src/markdown/transform-markdown.ts";
import { ProjectId } from "../src/strings/project-id.ts";
import { isString } from "../src/ast/types.ts";

export function expectInputToOutput(
  input: string,
  expectedOutput: string,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const inputAst = markdownToAst(input.trim() + "\n");
    const result = await transformMarkdown(projectId, inputAst);
    assertEquals(result, expectedOutput.trim() + "\n");
  };
}

export function expectInputDirectoryToOutputs(
  inputDirectory: string,
  expectedOutputs: Record<string, string>,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const actualOutputs = await transformMarkdownDirectory(
      projectId,
      inputDirectory.trim(),
    );
    const actualOutputsWithRelativePaths = mapKeys(
      actualOutputs,
      removeLeadingCharacters(inputDirectory.length + 1),
    );

    const trimmedExpectedOutputs = mapValues(
      expectedOutputs,
      (v: string | typeof DELETE_FILE) => isString(v) ? v.trim() + "\n" : v,
    );
    const expectedOutputsWithRelativePaths = mapKeys(
      trimmedExpectedOutputs,
      removeLeadingCharacters(inputDirectory.length + 2),
    );

    assertEquals(
      actualOutputsWithRelativePaths,
      {
        ...mapValues(actualOutputsWithRelativePaths, () => DELETE_FILE),
        ...expectedOutputsWithRelativePaths,
      },
    );
  };
}

function removeLeadingCharacters(n: number): (s: string) => string {
  return (s: string) => s.replace(new RegExp(`^.{${n}}`, "gm"), "");
}

import { sortBy } from "std/collections/sort_by.ts";
import { assertEquals } from "std/assert/assert_equals.ts";
import { transformAstToMarkdown } from "../mod.ts";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";
import { DeleteOrWriteFile } from "../src/commands/output-command.ts";
import { getMarkdownFilePathsInDirectory } from "../src/io/get-markdown-file-paths-in-directory.ts";
import { readTextFilesToInputs } from "../src/io/read-text-files-to-inputs.ts";
import { inputsToInputAsts } from "../src/markdown/inputs-to-input-asts.ts";

import { transformAstsToOutputCommands } from "../src/markdown/transform-asts-to-output-commands.ts";
import { ProjectId } from "../src/strings/project-id.ts";

export function expectInputToOutput(
  input: string,
  expectedOutput: string,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const inputAst = markdownToAst(input.trim() + "\n");
    const result = await transformAstToMarkdown(projectId, inputAst);
    assertEquals(result, expectedOutput.trim() + "\n");
  };
}

export function expectInputDirectoryToOutputs(
  inputDirectory: string,
  expectedOutputs: DeleteOrWriteFile[],
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const inputPaths = await getMarkdownFilePathsInDirectory(
      inputDirectory.trim(),
    );
    const inputPathsWithRelativePaths = inputPaths
      .map((inputPath) => inputPath.replace(inputDirectory, ""));

    const inputs = await readTextFilesToInputs(inputPaths);
    const inputAsts = inputsToInputAsts(inputs);

    const actualOutputs = await transformAstsToOutputCommands(
      projectId,
      inputAsts,
    );
    const actualOutputsWithRelativePaths = actualOutputs
      .map((actualOutput) => ({
        ...actualOutput,
        path: actualOutput.path.replace(inputDirectory, ""),
      }));

    const outputDirectory = inputDirectory.replace(/input$/, "output");
    const expectedOutputsWithRelativePaths = expectedOutputs
      .map((expectedOutput) => ({
        ...expectedOutput,
        path: expectedOutput.path.replace(
          outputDirectory,
          "",
        ),
      }));

    const map: Map<string, DeleteOrWriteFile> = new Map([
      ...inputPathsWithRelativePaths.map((inputPath) =>
        [inputPath, { action: "delete", path: inputPath }] as const
      ),
      ...expectedOutputsWithRelativePaths.map((actualOutput) =>
        [actualOutput.path, actualOutput] as const
      ),
    ]);
    const andDeletingAllInputFilesFirstOnlyIfTheyAreNotLaterWrittenTo:
      DeleteOrWriteFile[] = [...map.values()];

    assertEquals(
      sortBy(actualOutputsWithRelativePaths, selector),
      sortBy(
        andDeletingAllInputFilesFirstOnlyIfTheyAreNotLaterWrittenTo,
        selector,
      ),
    );
  };
}

function selector(x: DeleteOrWriteFile): string {
  return JSON.stringify({ action: x.action, path: x.path });
}

import { assertEquals } from "std/assert/assert_equals.ts";
import { sortBy } from "std/collections/sort_by.ts";
import { transformInputAstToMarkdown } from "../mod.ts";
import { inputsToInputAsts } from "../src/ast/inputs-to-input-asts.ts";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";

import { transformInputAstsToOutputCommands } from "../src/ast/transform-input-asts-to-output-commands.ts";
import { not, or } from "../src/fn.ts";
import { getMarkdownFilePathsInDirectory } from "../src/io/get-markdown-file-paths-in-directory.ts";
import { readTextFilesToInputs } from "../src/io/read-text-files-to-inputs.ts";
import {
  DeleteOrWriteFile,
  isDeleteFile,
  isWriteFile,
} from "../src/model/output-command.ts";
import { ProjectId } from "../src/model/project-id.ts";

export function expectInputToOutput(
  input: string,
  expectedOutput: string,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const inputAst = markdownToAst(input.trim() + "\n");
    const result = await transformInputAstToMarkdown(projectId, inputAst);
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

    const outputDirectory = inputDirectory.replace(/input$/, "output");
    const actualOutputs = await transformInputAstsToOutputCommands(
      projectId,
      inputDirectory,
      inputAsts,
    );
    const actualOutputsWithRelativePaths = actualOutputs
      .map((actualOutput) => ({
        ...actualOutput,
        path: actualOutput.path.replace(inputDirectory, ""),
      }));
    const inputsWithRelativePaths = Object.fromEntries(
      Object.entries(inputs)
        .map(([inputPath, input]) => [
          inputPath.replace(inputDirectory, ""),
          input,
        ]),
    );

    const isUnnecessaryWriteFile = (expectedOutput: DeleteOrWriteFile) =>
      isWriteFile(expectedOutput) &&
      expectedOutput.content === inputsWithRelativePaths[expectedOutput.path];
    const isUnnecessaryDeleteFile = (expectedOutput: DeleteOrWriteFile) =>
      isDeleteFile(expectedOutput) &&
      !inputsWithRelativePaths[expectedOutput.path];
    const isUnnecessaryOutput = or(
      isUnnecessaryWriteFile,
      isUnnecessaryDeleteFile,
    );
    const isNecessaryOutput = not(isUnnecessaryOutput);

    const expectedOutputsWithRelativePaths = expectedOutputs
      .map((expectedOutput) => ({
        ...expectedOutput,
        path: expectedOutput.path.replace(
          outputDirectory,
          "",
        ),
      }));

    const andDeletingAllInputFilesFirstOnlyIfTheyAreNotLaterWrittenTo:
      DeleteOrWriteFile[] = [...new Map([
        ...inputPathsWithRelativePaths
          .map((inputPath) =>
            [inputPath, { action: "delete", path: inputPath }] as const
          ),
        ...expectedOutputsWithRelativePaths
          .map((actualOutput) => [actualOutput.path, actualOutput] as const),
      ]).values()]
        .filter(isNecessaryOutput);

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

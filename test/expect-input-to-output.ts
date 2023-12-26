import { assertEquals } from "std/assert/assert_equals.ts";
import { mapValues } from "std/collections/map_values.ts";
import { mapKeys } from "std/collections/map_keys.ts";
import { transformMarkdown } from "../mod.ts";
import { transformMarkdownDirectory } from "../src/markdown/transform-markdown.ts";
import { ProjectId } from "../src/strings/project-id.ts";

export function expectInputToOutput(
  input: string,
  expectedOutput: string,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const result = await transformMarkdown(projectId, input.trim() + "\n");
    assertEquals(result, expectedOutput.trim() + "\n");
  };
}

export function expectInputDirectoryToOutputs(
  inputDirectory: string,
  expectedOutputs: Record<string, string>,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const trimmedExpectedOutputs = mapValues(
      expectedOutputs,
      (v: string) => v.trim() + "\n",
    );
    const outputs = await transformMarkdownDirectory(
      projectId,
      inputDirectory.trim(),
      false,
    );
    assertEquals(
      mapKeys(
        outputs,
        removeLeadingCharacters(inputDirectory.length + 1),
      ),
      mapKeys(
        trimmedExpectedOutputs,
        removeLeadingCharacters(inputDirectory.length + 2),
      ),
    );
  };
}

function removeLeadingCharacters(n: number): (s: string) => string {
  return (s: string) => s.replace(new RegExp(`^.{${n}}`, "gm"), "");
}

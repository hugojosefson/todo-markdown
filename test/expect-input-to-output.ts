import { assertEquals } from "std/assert/assert_equals.ts";
import { transformMarkdown } from "../mod.ts";
import { ProjectId } from "../src/strings/project-id.ts";

export function expectInputToOutput(
  input: string,
  expectedOutput: string,
  projectId: ProjectId = "TODO",
): () => Promise<void> {
  return async () => {
    const result = await transformMarkdown(projectId, input.trim());
    assertEquals(result, expectedOutput.trim());
  };
}

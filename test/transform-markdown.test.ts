import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { transformMarkdown } from "../src/transform-markdown.ts";
import { selectAll } from "npm:unist-util-select";
import { markdownToAst } from "../src/markdown-to-ast.ts";
import { Code } from "npm:@types/mdast";

Deno.test("transformMarkdown should assign identifiers to new tasks", async () => {
  const inputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-? Implement feature B
- [ ] TODO-? Implement feature C
- [ ] Implement feature D
`.trim();

  const expectedOutputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-2 Implement feature B
- [ ] TODO-3 Implement feature C
- [ ] TODO-4 Implement feature D
`.trim();

  const result = await transformMarkdown(inputMarkdown);
  assertEquals(result, expectedOutputMarkdown);
});

Deno.test("transformMarkdown should not change identifiers of old tasks", async () => {
  const inputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-2 Implement feature B
- [ ] TODO-3 Implement feature C
`.trim();

  const expectedOutputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-2 Implement feature B
- [ ] TODO-3 Implement feature C
`.trim();

  const result = await transformMarkdown(inputMarkdown);
  assertEquals(result, expectedOutputMarkdown);
});

Deno.test("transformMarkdown should handle examples in the README", async () => {
  const readmeSource = await Deno.readTextFile(
    (new URL("../README.md", import.meta.url)).pathname,
  );
  const readmeAst = markdownToAst(readmeSource);
  const [inputCodeBlock, outputCodeBlock] = selectAll(
    "code",
    readmeAst,
  ) as Code[];
  const inputExample = inputCodeBlock.value.trim();
  const expectedOutputExample = outputCodeBlock.value.trim();
  const result = await transformMarkdown(inputExample);
  assertEquals(result, expectedOutputExample);
});

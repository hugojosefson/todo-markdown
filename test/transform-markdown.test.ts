import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { transformMarkdown } from "../src/transform-markdown.ts";

Deno.test("transformMarkdown should assign identifiers to new tasks", async () => {
  const inputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-? Implement feature B
- [ ] TODO-? Implement feature C
- [ ] Implement feature D
`;

  const expectedOutputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-2 Implement feature B
- [ ] TODO-3 Implement feature C
- [ ] TODO-4 Implement feature D
`;

  const result = await transformMarkdown(inputMarkdown);
  assertEquals(result, expectedOutputMarkdown);
});

Deno.test("transformMarkdown should not change identifiers of old tasks", async () => {
  const inputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-2 Implement feature B
- [ ] TODO-3 Implement feature C
`;

  const expectedOutputMarkdown = `
# Project

- [ ] TODO-1 Implement feature A
- [ ] TODO-2 Implement feature B
- [ ] TODO-3 Implement feature C
`;

  const result = await transformMarkdown(inputMarkdown);
  assertEquals(result, expectedOutputMarkdown);
});

Deno.test("transformMarkdown should handle examples in the README", async () => {
  const readme = await Deno.readTextFile(
    new URL("../README.md", import.meta.url),
  );
  const exampleSection = readme.split(/^## .*example/i)[1].split(/^## /)[0];
  const inputExample =
    exampleSection.split(/^### .*input/i)[1].split(/^### /)[0];
  const expectedOutputExample =
    exampleSection.split(/^### .*output/i)[1].split(/^### /)[0];
  const result = await transformMarkdown(inputExample);
  assertEquals(result, expectedOutputExample);
});

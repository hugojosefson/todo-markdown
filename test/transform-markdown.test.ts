import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";
import { transformMarkdown } from "../src/transform-markdown.ts";

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
  const inputExample = `# My TODO:s

## Urgent

- [x] TODO-2 Pay bills
- [ ] TODO-1 Buy milk
- [x] TODO-3 Call mom
- [ ] TODO-5 Buy eggs

## Later

- [ ] TODO-? Buy bread
- [ ] TODO-7 Eat it all

## Other

- [ ] Do something else
- [ ] TODO-xx Do something even elser
`.trim();
  const expectedOutputExample = `# My TODO:s

## Urgent

- [x] TODO-2 Pay bills
- [ ] TODO-1 Buy milk
- [x] TODO-3 Call mom
- [ ] TODO-5 Buy eggs

## Later

- [ ] TODO-8 Buy bread
- [ ] TODO-7 Eat it all

## Other

- [ ] TODO-9 Do something else
- [ ] TODO-10 Do something even elser
`.trim();
  const result = await transformMarkdown(inputExample);
  assertEquals(result, expectedOutputExample);
});

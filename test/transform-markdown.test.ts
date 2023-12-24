import { describe, it } from "std/testing/bdd.ts";
import { assertEquals } from "std/assert/assert_equals.ts";
import { transformMarkdown } from "../src/markdown/transform-markdown.ts";
import { selectAll } from "npm:unist-util-select";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";
import { Code } from "npm:@types/mdast";
describe("transformMarkdown", () => {
  it("should assign identifiers to new tasks", async () => {
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

    const result = await transformMarkdown("TODO", inputMarkdown);
    assertEquals(result, expectedOutputMarkdown);
  });

  it("should not change identifiers of old tasks", async () => {
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

    const result = await transformMarkdown("TODO", inputMarkdown);
    assertEquals(result, expectedOutputMarkdown);
  });

  it("should handle examples in the README", async () => {
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
    const result = await transformMarkdown("TODO", inputExample);
    assertEquals(result, expectedOutputExample);
  });

  it("should add identifier only at the checkbox level, as the first thing there", async () => {
    const inputMarkdown = `
- [x] \`createMemo\` instead of \`createEffect\`?
- [x] this is a task
  - clarification-
- [x] find the right color
  - NCS S5040-Y80R
  - 2 times using Pinja Protect from Alcro
- [x] buy the right paint
  - colorama m-f 9-18, sa 10-13
- [x] manually rclone
- [x] schedule rclone
  - [x] snoozed until 18.30
  - [x] check host2 syslog
        https://host2.example.com:8006/#v1:0:=node%2Fhost1:4:25:=contentIso::::11:5
- [x] find part numbers for the table / plugs
  - https://www.ikea.com/se/sv/p/brimnes-avlastningsbord-vit-10234942/
  - https://www.ikea.com/se/sv/assembly_instructions/brimnes-avlastningsbord-vit__AA-1850775-5.pdf
  - 107519 / 107938
- [x] [Link description](https://www.example.com/)
`.trim();

    const expectedOutputMarkdown = `
- [x] TODO-1 \`createMemo\` instead of \`createEffect\`?
- [x] TODO-2 this is a task
  - clarification-
- [x] TODO-3 find the right color
  - NCS S5040-Y80R
  - 2 times using Pinja Protect from Alcro
- [x] TODO-4 buy the right paint
  - colorama m-f 9-18, sa 10-13
- [x] TODO-5 manually rclone
- [x] TODO-6 schedule rclone
  - [x] TODO-7 snoozed until 18.30
  - [x] TODO-8 check host2 syslog
        https://host2.example.com:8006/#v1:0:=node%2Fhost1:4:25:=contentIso::::11:5
- [x] TODO-9 find part numbers for the table / plugs
  - https://www.ikea.com/se/sv/p/brimnes-avlastningsbord-vit-10234942/
  - https://www.ikea.com/se/sv/assembly_instructions/brimnes-avlastningsbord-vit__AA-1850775-5.pdf
  - 107519 / 107938
- [x] TODO-10 [Link description](https://www.example.com/)
`.trim();

    const result = await transformMarkdown("TODO", inputMarkdown);
    assertEquals(result, expectedOutputMarkdown);
  });
});

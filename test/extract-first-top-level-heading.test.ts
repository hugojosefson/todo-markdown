import { assertEquals } from "std/assert/assert_equals.ts";
import { describe, it } from "std/testing/bdd.ts";
import { extractFirstTopLevelHeadingString } from "../src/ast/extract-first-top-level-heading.ts";

import { markdownToAst } from "../src/ast/markdown-to-ast.ts";

function expectHeadingExtractionToBe(
  markdown: string,
  expected: string | undefined,
): void {
  const ast = markdownToAst(markdown);
  const result = extractFirstTopLevelHeadingString(ast);
  assertEquals(result, expected);
}

function expectHeading(
  markdown: string,
  expected: string | undefined,
): () => void {
  return () => expectHeadingExtractionToBe(markdown, expected);
}

describe("extractFirstTopLevelHeadingString", () => {
  it(
    "should extract the first top level heading string",
    expectHeading(
      `# this is the first top level heading`,
      "this is the first top level heading",
    ),
  );
  it(
    "should extract the top level heading string",
    expectHeading(
      `# this is the top level heading
## this is the second level heading`,
      "this is the top level heading",
    ),
  );
  it(
    "should extract the first top level heading string, without any box",
    expectHeading(
      `# [ ] this is the first top level heading`,
      "this is the first top level heading",
    ),
  );
  it(
    "should choose the first top level heading string, even if there are multiple",
    expectHeading(
      `# this is the first top level heading
# this is the second top level heading`,
      "this is the first top level heading",
    ),
  );
  it(
    "should only choose a top-level heading, even if there is a second-level heading before it",
    expectHeading(
      `## this is the second level heading
# this is the first top level heading`,
      "this is the first top level heading",
    ),
  );
  it(
    "should not include any formatting",
    expectHeading(
      `# this is the first top level heading **with [bold](https://example.com/) formatting**`,
      "this is the first top level heading with bold formatting",
    ),
  );
  it(
    "should return undefined if there is no top-level heading",
    expectHeading(
      `## this is the second level heading`,
      undefined,
    ),
  );
  it(
    "should return undefined if there is no heading",
    expectHeading(
      ``,
      undefined,
    ),
  );
  it(
    "should return undefined if there is no markdown",
    expectHeading(
      undefined as unknown as string,
      undefined,
    ),
  );
});

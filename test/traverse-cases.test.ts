import { describe, it } from "@std/testing/bdd";
import { expect, Expected } from "@std/expect/expect";
import {
  expectInputDirectoryToOutputs,
  expectInputToOutput,
} from "./expect-input-to-output.ts";
import {
  buildCaseAndWriteAst,
  Case,
  isDescribe,
  isItRunDirectory,
  isItRunFile,
  isItSkip,
} from "./traverse-cases.ts";

function doCase(c: Case): void {
  if (isDescribe(c)) {
    const fn: typeof describe.skip | typeof describe = c.skip
      ? describe.skip
      : describe;
    fn(c.description, () => c.cases.forEach(doCase));
    return;
  }

  if (isItSkip(c)) {
    return it.skip(c.description, () => {});
  }
  if (isItRunFile(c)) {
    return it(c.description, expectInputToOutput(c.input, c.output));
  }
  if (isItRunDirectory(c)) {
    return it(
      c.description,
      expectInputDirectoryToOutputs(c.inputDirectory, c.outputs),
    );
  }
  throw new Error(`Unexpected case: ${JSON.stringify(c)}`);
}
const c: Case = await buildCaseAndWriteAst(
  new URL("cases", import.meta.url).pathname,
);

describe("traverse-cases", () => {
  it("should be implemented", async () => {
    const c: Case = await buildCaseAndWriteAst(
      new URL("cases", import.meta.url).pathname,
    );
    const expected: Expected = expect(c);
    expected.not.toBeUndefined();
  });
  doCase(c);
});

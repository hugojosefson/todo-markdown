import { describe, it } from "std/testing/bdd.ts";
import { expect, Expected } from "std/expect/expect.ts";
import { expectInputToOutput } from "./expect-input-to-output.ts";
import {
  buildCaseAndWriteAst,
  Case,
  isDescribe,
  isItRun,
  isItSkip,
} from "./traverse-cases.ts";

function doCase(c: Case): void {
  if (isDescribe(c)) {
    const fn = c.skip ? describe.skip : describe;
    fn(c.description, () => Promise.all(c.cases.map(doCase)));
    return;
  }

  if (isItRun(c)) {
    it(c.description, expectInputToOutput(c.input, c.output));
  } else if (isItSkip(c)) {
    it.skip(c.description, () => {});
  }
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

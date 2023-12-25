import { Nodes } from "npm:@types/mdast";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";

/**
 * Corresponds to a directory with test cases in it.
 *
 * Used to generate a `describe(...)` block in the test runner.
 */
export type Describe = {
  skip: boolean;
  description: string;
  cases: Case[];
};

/**
 * These things are always available in a test case.
 */
export type CaseInput = {
  skip: boolean;
  description: string;
  inputFile: string;
  inputAstFile: string;
  input: string;
  inputAst: Nodes;
};

/**
 * A test case we skip, because it lacks an expected output file.
 *
 * Used to generate an `it.skip(...)` block in the test runner.
 */
export type ItSkip =
  & CaseInput
  & { skip: true };

/**
 * A test case we run, because it has an expected output file.
 *
 * Used to generate an `it(...)` block in the test runner.
 */
export type ItRun =
  & CaseInput
  & {
    skip: false;
    outputFile: string;
    output: string;
  };

export type It =
  | ItSkip
  | ItRun;

export type Case =
  | Describe
  | It;

export function isDescribe(c: Case): c is Describe {
  return "cases" in c;
}

export function isItRun(c: Case): c is ItRun {
  return !isDescribe(c) && !c.skip;
}

export function isItSkip(c: Case): c is ItSkip {
  return !isDescribe(c) && c.skip;
}

export function isIt(c: Case): c is It {
  return isItRun(c) || isItSkip(c);
}

/**
 * Build a {@link Case} object from a path.
 */
export async function buildCaseAndWriteAst(path: string): Promise<Case> {
  const stat = await Deno.stat(path);
  if (stat.isDirectory) {
    return buildDescribe(path);
  } else {
    return buildItAndWriteAst(path);
  }
}

const REGEX_ENDS_WITH_SKIP = /\bskip$/;

export async function buildDescribe(path: string): Promise<Describe> {
  const skip = REGEX_ENDS_WITH_SKIP.test(path);
  const description = getDescription(path);
  const cases: Case[] = [];
  for await (const entry of Deno.readDir(path)) {
    if (entry.isFile && !entry.name.endsWith(".input.md")) {
      continue;
    }
    const inputFile = `${path}/${entry.name}`;
    cases.push(await buildCaseAndWriteAst(inputFile));
  }
  return { skip, description, cases };
}

/**
 * Parses the filename to get the description.
 *
 * Keeps only the basename, and removes the `.input.md` suffix.
 * Translates dashes to spaces, and underscores to commas.
 */
function getDescription(inputFile: string): string {
  const basename = inputFile.split("/").pop()!;
  return basename
    .replace(REGEX_ENDS_WITH_SKIP, "")
    .replace(/\.input\.md$/, "")
    .replace(/-/g, " ")
    .replace(/_/g, ",");
}

/**
 * Given an input file, build a {@link Case} object, taking care to only include the expected output, if such a file actually exists.
 */
export async function buildItAndWriteAst(inputFile: string): Promise<It> {
  const description = getDescription(inputFile);
  const inputAstFile = inputFile.replace(/\.input\.md$/, ".input-ast.json");
  const outputFile = inputFile.replace(/\.input\.md$/, ".output.md");

  const input = await Deno.readTextFile(inputFile);
  const inputAst = markdownToAst(input);

  await Deno.writeTextFile(
    inputAstFile,
    JSON.stringify(inputAst, null, 2) + "\n",
  );

  try {
    const output = await Deno.readTextFile(outputFile);
    return {
      skip: false,
      description,
      inputFile,
      inputAstFile,
      outputFile,
      input,
      inputAst,
      output,
    };
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return {
        skip: true,
        description,
        inputFile,
        inputAstFile,
        input,
        inputAst,
      };
    }
    throw e;
  }
}

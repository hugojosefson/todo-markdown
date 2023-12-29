import { walk, WalkEntry } from "std/fs/walk.ts";
import { Nodes } from "npm:@types/mdast";
import { markdownToAst } from "../src/ast/markdown-to-ast.ts";
import { InputAsts } from "../src/model/input-asts.ts";
import { DeleteOrWriteFile } from "../src/model/output-command.ts";

import { Inputs } from "../src/model/inputs.ts";

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
export type CaseInputCommon = {
  skip: boolean;
  description: string;
};

/**
 * These things are always available in a test case regarding a file.
 */
export type CaseInputFile =
  & CaseInputCommon
  & {
    inputFile: string;
    inputAstFile: string;
    input: string;
    inputAst: Nodes;
  };

/**
 * These things are always available in a test case regarding a directory.
 */
export type CaseInputDirectory =
  & CaseInputCommon
  & {
    inputDirectory: string;
    inputs: Inputs;
    inputAsts: InputAsts;
  };

/**
 * These things are always available in a test case.
 */
export type CaseInput =
  | CaseInputFile
  | CaseInputDirectory;

/**
 * A test case we skip, because it lacks an expected output file.
 *
 * Used to generate an `it.skip(...)` block in the test runner.
 */
export type ItSkip =
  & CaseInput
  & { skip: true };

export type ItRunFile =
  & CaseInputFile
  & {
    skip: false;
    outputFile: string;
    output: string;
  };

export type ItFile =
  | ItSkip
  | ItRunFile;

export type ItRunDirectory =
  & CaseInputDirectory
  & {
    skip: false;
    outputDirectory: string;
    outputs: DeleteOrWriteFile[];
  };

export type ItDirectory =
  | ItSkip
  | ItRunDirectory;

/**
 * A test case we run, because it has an expected output file/directory.
 *
 * Used to generate an `it(...)` block in the test runner.
 */
export type ItRun =
  | ItRunFile
  | ItRunDirectory;

export type It =
  | ItSkip
  | ItRun;

export type Case =
  | Describe
  | It;

export function isDescribe(c: Case): c is Describe {
  return "cases" in c;
}

export function isItSkip(c: Case): c is ItSkip {
  return !isDescribe(c) && c.skip;
}

export function isItRun(c: Case): c is ItRun {
  return !isDescribe(c) && !c.skip;
}

export function isItRunFile(c: Case): c is ItRunFile {
  return isItRun(c) && "outputFile" in c;
}

export function isItRunDirectory(c: Case): c is ItRunDirectory {
  return isItRun(c) && "outputDirectory" in c;
}

export function isIt(c: Case): c is It {
  return isItRun(c) || isItSkip(c);
}

/**
 * Build a {@link Case} object from a path.
 */
export async function buildCaseAndWriteAst(path: string): Promise<Case> {
  if (await isDirectory(`${path}/input`)) {
    return buildItDirectoryAndWriteAst(path);
  }
  if (await isDirectory(path)) {
    return buildDescribe(path);
  }
  return buildItFileAndWriteAst(path);
}

export async function isDirectory(path: string): Promise<boolean> {
  if (path === "") {
    throw new Error(`Empty path is not a directory`);
  }
  if (path === "/") {
    return true;
  }
  if (path === ".") {
    return true;
  }
  if (!await isDirectory(parent(path))) {
    return false;
  }
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return false;
    }
    throw e;
  }
}

export function parent(path: string): string {
  const segments = path.split("/");
  if (segments.length <= 2 && segments[0] === "") {
    return "/";
  }
  return segments.slice(0, -1).join("/");
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
export async function buildItFileAndWriteAst(
  inputFile: string,
): Promise<ItFile> {
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

export async function* recursiveEntries(
  path: string,
): AsyncGenerator<Deno.DirEntry> {
  if (!(await isDirectory(path))) {
    return [];
  }
  for await (const entry of Deno.readDir(path)) {
    if (entry.isFile) {
      yield entry;
    } else if (entry.isDirectory) {
      yield* recursiveEntries(`${path}/${entry.name}`);
    }
  }
}

/**
 * Given an input directory, build a {@link Case} object, taking care to only include the expected output, if such a directory actually exists.
 */
export async function buildItDirectoryAndWriteAst(
  baseDirectory: string,
): Promise<ItDirectory> {
  const description = getDescription(baseDirectory);
  const inputDirectory = `${baseDirectory}/input`;
  /** map of path to file, and its contents */
  const inputs: Inputs = {};
  /** map of path to file, and its contents' ast */
  const inputAsts: InputAsts = {};
  for await (
    const entry of walk(inputDirectory, {
      includeDirs: false,
      match: [/\.md$/],
    })
  ) {
    const inputPath = (entry as WalkEntry).path;

    const contents = await Deno.readTextFile(inputPath);
    inputs[inputPath] = contents;

    const astPath = inputPath.replace(/\.md$/, ".ast.json");
    inputAsts[astPath] = markdownToAst(contents);
  }

  // write ast:s to their own files
  for (const [astPath, ast] of Object.entries(inputAsts)) {
    await Deno.writeTextFile(
      astPath,
      JSON.stringify(ast, null, 2) + "\n",
    );
  }

  const outputDirectory = `${baseDirectory}/output`;
  if (!await isDirectory(outputDirectory)) {
    return {
      skip: true,
      description,
      inputDirectory,
      inputs,
      inputAsts,
    };
  }

  /** map of path to file, and its contents */
  const outputs: DeleteOrWriteFile[] = [];
  for await (const entry of recursiveEntries(outputDirectory)) {
    const path = `${outputDirectory}/${entry.name}`;
    const content = await Deno.readTextFile(path);
    outputs.push({ action: "write", path, content });
  }

  return {
    skip: false,
    description,
    inputDirectory,
    inputs,
    inputAsts,
    outputDirectory,
    outputs,
  };
}

import { Nodes } from "npm:@types/mdast";
import { OutputCommand } from "../model/output-command.ts";
import { ProjectId } from "../model/project-id.ts";
import { sequence } from "../strings/regex.ts";
import { astToMarkdown } from "./ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "./extract-first-top-level-heading.ts";
import { transformNode } from "./transform-node.ts";
import { capture } from "../strings/regex.ts";

export async function transformInputAstToOutputCommands<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  basePath: string,
  nextIdentifierNumberGetter: () => number,
  inputPath: string,
  inputAst: Nodes,
): Promise<OutputCommand[]> {
  const outputAst = transformNode(
    projectId,
    nextIdentifierNumberGetter,
    inputAst,
  );
  const headingString = extractFirstTopLevelHeadingString(outputAst);
  const outputPath = calculateOutputPath(basePath, inputPath, headingString);

  const output = await astToMarkdown(outputAst);
  if (inputPath === outputPath) {
    // writing to the same file
    return [
      {
        action: "write",
        path: outputPath,
        content: output,
        ast: outputAst,
      },
    ];
  } else {
    // writing to a different file, deleting the old file
    return [
      {
        action: "delete",
        path: inputPath,
      },
      {
        action: "write",
        path: outputPath,
        content: output,
        ast: outputAst,
      },
      {
        action: "update-links",
        fromPath: inputPath,
        toPath: outputPath,
      },
    ];
  }
}

/** Matches directory name, and the filename "index.md" */
export const INPUT_PATH_INDEX_MD_REGEX = sequence(
  /(^|\/)/,
  capture("name", /[^/]+/),
  "/index.md",
  /$/,
);

/** Matches the markdown filename */
export const INPUT_PATH_FILENAME_REGEX = sequence(
  /(^|\/)/,
  capture("name", /[^/]+/),
  ".md",
  /$/,
);

/**
 * Calculates the output path for the given input path, and heading string.
 * @param basePath The root directory to use as the base path.
 * @param inputPath The path of an input file.
 * @param headingString Any heading string to use for the output path.
 */
function calculateOutputPath(
  basePath: string,
  inputPath: string,
  headingString?: string,
): string {
  if (!headingString) {
    return inputPath;
  }

  // if the input path is the index.md file in the basePath directory, leave it alone
  if (inputPath === `${basePath}/index.md`) {
    return inputPath;
  }

  if (INPUT_PATH_INDEX_MD_REGEX.test(inputPath)) {
    return inputPath.replace(
      INPUT_PATH_INDEX_MD_REGEX,
      `/${headingString}/index.md`,
    );
  }

  return inputPath.replace(
    INPUT_PATH_FILENAME_REGEX,
    `/${headingString}.md`,
  );
}

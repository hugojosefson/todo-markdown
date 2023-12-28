import { Nodes } from "npm:@types/mdast";
import { astToMarkdown } from "./ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "./extract-first-top-level-heading.ts";
import { transformNode } from "./transform-node.ts";
import { OutputCommand } from "../model/output-command.ts";
import { ProjectId } from "../model/project-id.ts";

export async function transformInputAstToOutputCommands<
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumberGetter: () => number,
  inputPath: string,
  inputAst: Nodes,
): Promise<OutputCommand[]> {
  const outputAst = transformNode(
    projectId,
    nextIdentifierNumberGetter,
    inputAst,
  );
  const headingString = extractFirstTopLevelHeadingString(
    outputAst,
  );
  const outputPath = headingString
    ? inputPath.replace(
      /\/([^\/]+)\.md$/,
      `/${headingString}.md`,
    )
    : inputPath;

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

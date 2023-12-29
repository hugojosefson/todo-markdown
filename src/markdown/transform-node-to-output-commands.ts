import { Nodes } from "npm:@types/mdast";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { extractFirstTopLevelHeadingString } from "../ast/extract-first-top-level-heading.ts";
import { transformNode } from "../ast/transform-node.ts";
import { OutputCommand } from "../commands/output-command.ts";
import { ProjectId } from "../strings/project-id.ts";

export async function transformNodeToOutputCommands<
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
      },
      {
        action: "update-links",
        fromPath: inputPath,
        toPath: outputPath,
      },
    ];
  }
}

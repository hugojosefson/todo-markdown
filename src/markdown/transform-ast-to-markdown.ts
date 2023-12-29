import { Nodes } from "npm:@types/mdast";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { transformNode } from "../ast/transform-node.ts";
import { ProjectId } from "../model/project-id.ts";
import { createNextIdentifierNumberGetter } from "../model/task-id-number.ts";

/**
 * Transforms a single AST, and outputs the result as markdown.
 * @param projectId The project ID to use for identifying and generating task IDs.
 * @param ast The AST to transform.
 * @param otherAstsToConsiderForIdentifierNumbers Other ASTs to consider when generating task IDs. This is useful when you want to generate task IDs that are unique across multiple files.
 */
export async function transformAstToMarkdown<PI extends ProjectId = ProjectId>(
  projectId: PI,
  ast: Nodes,
  otherAstsToConsiderForIdentifierNumbers: Nodes[] = [],
): Promise<string> {
  const nextIdentifierNumberGetter = createNextIdentifierNumberGetter(
    projectId,
    [ast, ...otherAstsToConsiderForIdentifierNumbers],
  );
  return await astToMarkdown(
    transformNode(
      projectId,
      nextIdentifierNumberGetter,
      ast,
    ),
  );
}

import { transformNodeReplaceFirstChildTextValue } from "./transform-node-replace-first-child-text-value.ts";

import {
  EligibleParentNodes,
  WithFirstChildParagraphWithText,
} from "./with-first-child.ts";

export function transformNodeReplaceFirstChildParagraphTextValue<
  T extends WithFirstChildParagraphWithText<EligibleParentNodes>,
>(
  node: T,
  find: string | RegExp,
  replacer: string | ((substring: string, ...args: unknown[]) => string),
): T {
  const paragraph = node.children[0];
  const replacedParagraph = transformNodeReplaceFirstChildTextValue(
    paragraph,
    find,
    replacer,
  );

  return {
    ...node,
    children: [
      replacedParagraph,
      ...node.children.slice(1),
    ],
  };
}

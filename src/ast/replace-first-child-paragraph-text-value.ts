import { replaceFirstChildTextValue } from "./replace-first-child-text-value.ts";
import {
  EligibleParentNodes,
  WithFirstChildParagraphWithText,
} from "./types.ts";

export function replaceFirstChildParagraphTextValue<
  T extends WithFirstChildParagraphWithText<EligibleParentNodes>,
>(
  node: T,
  find: string | RegExp,
  replacer: string | ((substring: string, ...args: unknown[]) => string),
): T {
  const paragraph = node.children[0];
  const replacedParagraph = replaceFirstChildTextValue(
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

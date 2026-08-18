import { isString } from "@hugojosefson/fns/string/is-string";

import { EligibleParentNodes, WithFirstChildText } from "./with-first-child.ts";

export function transformNodeReplaceFirstChildTextValue<
  T extends WithFirstChildText<EligibleParentNodes>,
>(
  node: T,
  find: string | RegExp,
  replacer: string | ((substring: string, ...args: unknown[]) => string),
): T {
  return {
    ...node,
    children: [
      {
        ...node.children[0],
        value: node.children[0].value.replace(
          find,
          isString(replacer) ? (() => replacer) : replacer,
        ),
      },
      ...node.children.slice(1),
    ],
  };
}

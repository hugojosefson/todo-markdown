import {
  Heading,
  ListItem,
  Node,
  Nodes,
  Paragraph,
  Parent,
  PhrasingContent,
  Text,
} from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";
import { isString } from "run_simple/src/fn.ts";
import { reduceToLargestNumber } from "../fn.ts";
import { groups, StartsWith, startsWithA } from "../regex.ts";
import {
  Box,
  BOX_REGEX,
  createBoxAndTaskIdPlaceholderRegex,
  createBoxAndTaskIdRegex,
} from "../strings/box.ts";
import { ProjectId } from "../strings/project-id.ts";
import { extractTaskIdNumber } from "../strings/task-id-number.ts";
import { createTaskIdPlaceholderRegex } from "../strings/task-id-placeholder.ts";
import { createExtractTaskId, createTaskIdRegex } from "../strings/task-id.ts";

/**
 * Finds the maximum identifier number in the given tree.
 * @param projectId The project identifier to search for.
 * @param trees The trees to search in.
 * @returns The maximum identifier number in the given tree.
 */
export function getMaxIdentifierNumber<PI extends ProjectId = ProjectId>(
  projectId: PI,
  trees: Nodes[],
): number {
  const texts: Text[] = trees.flatMap((tree) =>
    selectAll("text", tree) as Text[]
  );
  return texts
    .map(createExtractTaskId(projectId))
    .filter(isString)
    .map((x) => x!)
    .map(extractTaskIdNumber)
    .filter(isString)
    .map((x) => x!)
    .map((taskIdNumber) => parseInt(taskIdNumber, 10))
    .reduce(reduceToLargestNumber, 0);
}

export type NextIdentifierNumber = () => number;

export function generateNextIdentifierNumber<PI extends ProjectId = ProjectId>(
  projectId: PI,
  trees: Nodes[],
): NextIdentifierNumber {
  let maxIdentifierNumber = getMaxIdentifierNumber(projectId, trees);
  return () => ++maxIdentifierNumber;
}

function isParent(node: Node): node is Parent {
  return "children" in node && Array.isArray(node.children);
}

function isText(node: Node): node is Text {
  return node.type === "text";
}

function isHeading<N extends Node>(node: N): node is N & Heading {
  return node.type === "heading";
}

function isListItem(node: Node): node is ListItem {
  return node.type === "listItem";
}

function hasListItemBox(
  listItem: ListItem,
): listItem is ListItem & { checked: boolean } {
  return listItem.checked === true || listItem.checked === false;
}
const startsWithBox = startsWithA(BOX_REGEX);

/**
 * Returns true if the given heading has a first child that is a text node, and that starts with a box.
 * @param heading
 */
function hasHeadingBox(
  heading: Heading,
): heading is Heading & {
  children: [{ type: "text"; value: StartsWith<Box> }, ...PhrasingContent[]];
} {
  return isText(heading.children[0]) && startsWithBox(heading.children[0]);
}

function hasBox(
  listItem: ListItem,
): listItem is ListItem & { checked: boolean };
function hasBox(
  heading: Heading,
): heading is Heading & {
  children: [{ type: "text"; value: StartsWith<Box> }, ...PhrasingContent[]];
};
function hasBox<T extends ListItem | Heading>(node: T): boolean {
  if (isHeading(node)) {
    return hasHeadingBox(node);
  }
  if (isListItem(node)) {
    return hasListItemBox(node);
  }
  return false;
}

export function replaceNode<N extends Node, PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumber: NextIdentifierNumber,
  node: N,
): N {
  if (isHeading(node)) {
    return replaceParent(
      projectId,
      nextIdentifierNumber,
      replaceHeading(projectId, nextIdentifierNumber, node),
    ) as unknown as N;
  }

  if (isListItem(node)) {
    return replaceParent(
      projectId,
      nextIdentifierNumber,
      replaceListItem(projectId, nextIdentifierNumber, node),
    ) as unknown as N;
  }

  if (isParent(node)) {
    return replaceParent(projectId, nextIdentifierNumber, node);
  }
  return node;
}

function replaceHeading<T extends Heading, PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumber: NextIdentifierNumber,
  heading: T,
): T {
  if (heading.children.length === 0) {
    // if heading has no children, return as is
    return heading;
  }

  if (!isWithFirstChildText(heading)) {
    // if heading doesn't start with text, return as is
    return heading;
  }
  const startsWithBoxAndTaskId = startsWithA(
    createBoxAndTaskIdRegex(projectId),
  );
  if (startsWithBoxAndTaskId(heading.children[0])) {
    // if heading has both box and proper task id, return as is
    return heading;
  }

  const startsWithBoxAndTaskIdPlaceholder = startsWithA(
    createBoxAndTaskIdPlaceholderRegex(
      projectId,
    ),
  );
  if (startsWithBoxAndTaskIdPlaceholder(heading.children[0])) {
    // if heading has box, and unidentified placeholder task id, replace with new task id
    return replaceFirstChildTextValue(
      heading,
      startsWithBoxAndTaskIdPlaceholder.regex,
      (...args) =>
        `${groups<"box">(args).box} ${projectId}-${nextIdentifierNumber()}`,
    );
  }

  const startsWithTaskId = startsWithA(createTaskIdRegex(projectId));
  if (startsWithTaskId(heading.children[0])) {
    // if heading already has task id, but no box, add box
    return replaceFirstChildTextValue(
      heading,
      startsWithTaskId.regex,
      (...args) => `[ ] ${groups<"taskId">(args).taskId}`,
    );
  }

  const startsWithTaskIdPlaceholder = startsWithA(
    createTaskIdPlaceholderRegex(projectId),
  );
  if (startsWithTaskIdPlaceholder(heading.children[0])) {
    // if heading has unidentified placeholder task id, replace with new task id, and add box
    return replaceFirstChildTextValue(
      heading,
      startsWithTaskIdPlaceholder.regex,
      () => `[ ] ${projectId}-${nextIdentifierNumber()}`,
    );
  }

  const startsWithBox = startsWithA(BOX_REGEX);
  if (startsWithBox(heading.children[0])) {
    // if heading has box, but no task id, add task id
    return replaceFirstChildTextValue(
      heading,
      startsWithBox.regex,
      (...args) =>
        `${groups<"box">(args).box} ${projectId}-${nextIdentifierNumber()}`,
    );
  }

  return heading;
}

type WithFirstChild<
  T extends EligibleParentNodes,
  C extends EligibleNodes,
> =
  & T
  & {
    children: [
      C,
      ...(T["children"])[],
    ];
  };

type EligibleParentNodes = Heading | ListItem | Paragraph;
type EligibleNodes = EligibleParentNodes | Text;
type WithFirstChildText<T extends EligibleParentNodes> = WithFirstChild<
  T,
  Text
>;

function isWithFirstChildText<T extends EligibleParentNodes>(
  node: T,
): node is WithFirstChildText<T> {
  return isText(node.children[0]);
}

type WithFirstChildParagraphWithText<T extends EligibleParentNodes> =
  WithFirstChild<
    T,
    WithFirstChild<Paragraph, Text>
  >;

function isWithFirstChildParagraphWithText<T extends EligibleParentNodes>(
  node: T,
): node is WithFirstChildParagraphWithText<T> {
  return isParagraph(node.children[0]) && isText(node.children[0].children[0]);
}

function isParagraph(node: Node): node is Paragraph {
  return node.type === "paragraph";
}

function replaceFirstChildTextValue<
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

function replaceFirstChildParagraphTextValue<
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

function replaceListItem<T extends ListItem, PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumber: NextIdentifierNumber,
  listItem: T,
): T {
  const startsWithTaskId = startsWithA(createTaskIdRegex(projectId));
  const startsWithTaskIdPlaceholder = startsWithA(
    createTaskIdPlaceholderRegex(projectId),
  );

  if (isWithFirstChildText(listItem)) {
    // if list item has text...

    if (hasBox(listItem)) {
      // ...and has a box...

      if (startsWithTaskId(listItem.children[0])) {
        // ...and starts with a proper task id, return as is
        return listItem;
      }

      if (startsWithTaskIdPlaceholder(listItem.children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id
        return replaceFirstChildTextValue(
          listItem,
          startsWithTaskIdPlaceholder.regex,
          () => `${projectId}-${nextIdentifierNumber()}`,
        );
      }

      // ...and doesn't start with a task id, add task id
      return replaceFirstChildTextValue(
        listItem,
        /^/,
        () => `${projectId}-${nextIdentifierNumber()} `,
      );
    } else {
      // ...and doesn't have a box...

      if (startsWithTaskId(listItem.children[0])) {
        // ...and starts with a proper task id, add a box
        return {
          ...listItem,
          checked: false,
        };
      }

      if (startsWithTaskIdPlaceholder(listItem.children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id, and add box
        return {
          ...replaceFirstChildTextValue(
            listItem,
            startsWithTaskIdPlaceholder.regex,
            () => `${projectId}-${nextIdentifierNumber()}`,
          ),
          checked: false,
        };
      }

      return listItem;
    }
  } else if (isWithFirstChildParagraphWithText(listItem)) {
    // if list item has paragraph with text...

    if (hasBox(listItem)) {
      // ...and has a box...

      if (startsWithTaskId(listItem.children[0].children[0])) {
        // ...and starts with a proper task id, return as is
        return listItem;
      }

      if (startsWithTaskIdPlaceholder(listItem.children[0].children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id
        return replaceFirstChildParagraphTextValue(
          listItem,
          startsWithTaskIdPlaceholder.regex,
          () => `${projectId}-${nextIdentifierNumber()}`,
        );
      }

      // ...and doesn't start with a task id, add task id
      return replaceFirstChildParagraphTextValue(
        listItem,
        /^/,
        () => `${projectId}-${nextIdentifierNumber()} `,
      );
    } else {
      // ...and doesn't have a box...

      if (startsWithTaskId(listItem.children[0].children[0])) {
        // ...and starts with a proper task id, add a box
        return {
          ...listItem,
          checked: false,
        };
      }

      if (startsWithTaskIdPlaceholder(listItem.children[0].children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id, and add box
        return {
          ...replaceFirstChildParagraphTextValue(
            listItem,
            startsWithTaskIdPlaceholder.regex,
            () => `${projectId}-${nextIdentifierNumber()}`,
          ),
          checked: false,
        };
      }

      return listItem;
    }
  } else {
    // if list item doesn't start with paragraph or text...

    if (hasBox(listItem)) {
      // ...and has a box...

      if (isParagraph(listItem.children[0])) {
        // ...and starts with a paragraph, but no text, add text to paragraph's children
        return {
          ...listItem,
          children: [
            {
              ...listItem.children[0],
              children: [
                {
                  type: "text",
                  value: `${projectId}-${nextIdentifierNumber()} `,
                },
                ...listItem.children[0].children,
              ],
            },
            ...listItem.children.slice(1),
          ],
        };
      }
      // ...inject identifier first
      return {
        ...listItem,
        children: [
          {
            type: "text",
            value: `${projectId}-${nextIdentifierNumber()} `,
          },
          ...listItem.children,
        ],
      };
    } else {
      // ...and has no box, return as is
      return listItem;
    }
  }
}

function replaceParent<
  T extends Parent,
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumber: NextIdentifierNumber,
  parent: T,
): T {
  return {
    ...parent,
    children: parent.children.map((child) =>
      replaceNode(projectId, nextIdentifierNumber, child)
    ),
  };
}

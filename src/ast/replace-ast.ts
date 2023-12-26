import { Heading, ListItem, Node } from "npm:@types/mdast";
import { isString } from "run_simple/src/fn.ts";
import { groups, startsWithA } from "../regex.ts";
import {
  BOX_REGEX,
  createBoxAndTaskIdPlaceholderRegex,
  createBoxAndTaskIdRegex,
} from "../strings/box.ts";
import { ProjectId } from "../strings/project-id.ts";
import { NextIdentifierNumberGetter } from "../strings/task-id-number.ts";
import { createTaskIdPlaceholderRegex } from "../strings/task-id-placeholder.ts";
import { createTaskIdRegex } from "../strings/task-id.ts";
import { replaceParent } from "./replace-parent.ts";
import {
  EligibleParentNodes,
  hasBox,
  isHeading,
  isListItem,
  isParagraph,
  isParent,
  isWithFirstChildParagraphWithText,
  isWithFirstChildText,
  WithFirstChildParagraphWithText,
  WithFirstChildText,
} from "./types.ts";

export function replaceNode<N extends Node, PI extends ProjectId = ProjectId>(
  projectId: PI,
  nextIdentifierNumber: NextIdentifierNumberGetter,
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
  nextIdentifierNumber: NextIdentifierNumberGetter,
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
  nextIdentifierNumber: NextIdentifierNumberGetter,
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

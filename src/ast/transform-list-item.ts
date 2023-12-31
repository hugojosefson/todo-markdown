import { ListItem } from "npm:@types/mdast";
import { hasABox } from "../model/box.ts";
import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import {
  createTaskIdPlaceholderRegex,
  TaskIdPlaceholder,
} from "../model/task-id-placeholder.ts";
import { createTaskIdRegex } from "../model/task-id.ts";
import { StringStartingWith } from "../strings/string-types.ts";
import { startsWithA, TextTypeGuard } from "../strings/text-type-guard.ts";
import { transformNodeReplaceFirstChildParagraphTextValue } from "./transform-node-replace-first-child-paragraph-text-value.ts";
import { transformNodeReplaceFirstChildTextValue } from "./transform-node-replace-first-child-text-value.ts";
import { isParagraph } from "./node-types.ts";
import {
  isWithFirstChildParagraphWithText,
  isWithFirstChildText,
} from "./with-first-child.ts";

/**
 * Transforms a {@link ListItem}.
 * @param projectId The project identifier to use.
 * @param nextIdentifierNumberGetter The function to use to get the next identifier number.
 * @param listItem The list item to transform.
 * @returns The transformed list item.
 */
export function transformListItem<
  T extends ListItem,
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumberGetter: NextIdentifierNumberGetter,
  listItem: T,
): T {
  const startsWithATaskId: TextTypeGuard<StringStartingWith<PI>> = startsWithA(
    createTaskIdRegex(projectId),
  );
  const startsWithATaskIdPlaceholder: TextTypeGuard<
    StringStartingWith<TaskIdPlaceholder<PI>>
  > = startsWithA(
    createTaskIdPlaceholderRegex(projectId),
  );

  if (isWithFirstChildText(listItem)) {
    // if list item has text...

    if (hasABox(listItem)) {
      // ...and has a box...

      if (startsWithATaskId(listItem.children[0])) {
        // ...and starts with a proper task id, return as is
        return listItem;
      }

      if (startsWithATaskIdPlaceholder(listItem.children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id
        return transformNodeReplaceFirstChildTextValue(
          listItem,
          startsWithATaskIdPlaceholder.regex,
          () => `${projectId}-${nextIdentifierNumberGetter()}`,
        );
      }

      // ...and doesn't start with a task id, add task id
      return transformNodeReplaceFirstChildTextValue(
        listItem,
        /^/,
        () => `${projectId}-${nextIdentifierNumberGetter()} `,
      );
    } else {
      // ...and doesn't have a box...

      if (startsWithATaskId(listItem.children[0])) {
        // ...and starts with a proper task id, add a box
        return {
          ...listItem,
          checked: false,
        };
      }

      if (startsWithATaskIdPlaceholder(listItem.children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id, and add box
        return {
          ...transformNodeReplaceFirstChildTextValue(
            listItem,
            startsWithATaskIdPlaceholder.regex,
            () => `${projectId}-${nextIdentifierNumberGetter()}`,
          ),
          checked: false,
        };
      }

      return listItem;
    }
  } else if (isWithFirstChildParagraphWithText(listItem)) {
    // if list item has paragraph with text...

    if (hasABox(listItem)) {
      // ...and has a box...

      if (startsWithATaskId(listItem.children[0].children[0])) {
        // ...and starts with a proper task id, return as is
        return listItem;
      }

      if (startsWithATaskIdPlaceholder(listItem.children[0].children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id
        return transformNodeReplaceFirstChildParagraphTextValue(
          listItem,
          startsWithATaskIdPlaceholder.regex,
          () => `${projectId}-${nextIdentifierNumberGetter()}`,
        );
      }

      // ...and doesn't start with a task id, add task id
      return transformNodeReplaceFirstChildParagraphTextValue(
        listItem,
        /^/,
        () => `${projectId}-${nextIdentifierNumberGetter()} `,
      );
    } else {
      // ...and doesn't have a box...

      if (startsWithATaskId(listItem.children[0].children[0])) {
        // ...and starts with a proper task id, add a box
        return {
          ...listItem,
          checked: false,
        };
      }

      if (startsWithATaskIdPlaceholder(listItem.children[0].children[0])) {
        // ...and starts with an unidentified placeholder task id, replace with new task id, and add box
        return {
          ...transformNodeReplaceFirstChildParagraphTextValue(
            listItem,
            startsWithATaskIdPlaceholder.regex,
            () => `${projectId}-${nextIdentifierNumberGetter()}`,
          ),
          checked: false,
        };
      }

      return listItem;
    }
  } else {
    // if list item doesn't start with paragraph or text...

    if (hasABox(listItem)) {
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
                  value: `${projectId}-${nextIdentifierNumberGetter()} `,
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
            value: `${projectId}-${nextIdentifierNumberGetter()} `,
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

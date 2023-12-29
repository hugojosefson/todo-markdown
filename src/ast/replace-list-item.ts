import { ListItem } from "npm:@types/mdast";
import { ProjectId } from "../model/project-id.ts";
import { NextIdentifierNumberGetter } from "../model/task-id-number.ts";
import { createTaskIdPlaceholderRegex } from "../model/task-id-placeholder.ts";
import { createTaskIdRegex } from "../model/task-id.ts";
import { startsWithA } from "../strings/text-type-guard.ts";
import { replaceFirstChildParagraphTextValue } from "./replace-first-child-paragraph-text-value.ts";
import { replaceFirstChildTextValue } from "./replace-first-child-text-value.ts";
import {
  hasBox,
  isParagraph,
  isWithFirstChildParagraphWithText,
  isWithFirstChildText,
} from "./types.ts";

export function replaceListItem<
  T extends ListItem,
  PI extends ProjectId = ProjectId,
>(
  projectId: PI,
  nextIdentifierNumberGetter: NextIdentifierNumberGetter,
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
          () => `${projectId}-${nextIdentifierNumberGetter()}`,
        );
      }

      // ...and doesn't start with a task id, add task id
      return replaceFirstChildTextValue(
        listItem,
        /^/,
        () => `${projectId}-${nextIdentifierNumberGetter()} `,
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
            () => `${projectId}-${nextIdentifierNumberGetter()}`,
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
          () => `${projectId}-${nextIdentifierNumberGetter()}`,
        );
      }

      // ...and doesn't start with a task id, add task id
      return replaceFirstChildParagraphTextValue(
        listItem,
        /^/,
        () => `${projectId}-${nextIdentifierNumberGetter()} `,
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
            () => `${projectId}-${nextIdentifierNumberGetter()}`,
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

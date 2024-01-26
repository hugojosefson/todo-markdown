import { Emphasis, Link, ListItem, Text } from "npm:@types/mdast";
import { IndexEntryTask } from "./index-entry.ts";

export function indexEntryTaskToListItem(
  { checked, path, name, isThisFile }: IndexEntryTask,
): ListItem {
  const isInProgress = checked === "…";
  return {
    type: "listItem",
    checked: isInProgress ? null : checked,
    spread: false,
    children: [{
      type: "paragraph",
      children: [
        ...(
          isInProgress
            ? [{
              type: "text",
              value: "[…] ",
            } as Text]
            : []
        ),
        {
          type: "link",
          title: null,
          url: path.split("/").map(
            encodeURIComponent,
          ).join("/"),
          children: [
            {
              type: "text",
              value: name,
            },
          ],
        } as Link,
        ...(
          // output " _(this file)_" if the file is the same as the index file
          isThisFile
            ? [{
              type: "text",
              value: " ",
            } as Text, {
              type: "emphasis",
              children: [
                {
                  type: "text",
                  value: "(this file)",
                },
              ],
            } as Emphasis]
            : []
        ),
      ],
    }],
  };
}

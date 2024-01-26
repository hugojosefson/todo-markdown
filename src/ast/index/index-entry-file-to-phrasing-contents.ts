import { Emphasis, Link, PhrasingContent, Text } from "npm:@types/mdast";
import { IndexEntryFile } from "./index-entry.ts";

export function indexEntryFileToPhrasingContents(
  { path, name, isThisFile }: IndexEntryFile,
): PhrasingContent[] {
  return [
    {
      type: "link",
      title: null,
      url: path.split("/").map(
        encodeURIComponent,
      ).join("/"),
      children: [
        {
          type: "text",
          value: `📄 ${name}`,
        },
      ],
    } as Link,
    ...(
      // output " _(this file)_" if the file is the same as the index file
      isThisFile
        ? [
          {
            type: "text",
            value: " ",
          } as Text,
          {
            type: "emphasis",
            children: [
              {
                type: "text",
                value: "(this file)",
              },
            ],
          } as Emphasis,
        ]
        : []
    ),
  ];
}

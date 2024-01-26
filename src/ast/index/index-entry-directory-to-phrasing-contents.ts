import { Link, PhrasingContent, Text } from "npm:@types/mdast";
import { IndexEntryDirectory } from "./index-entry.ts";

export function indexEntryDirectoryToPhrasingContents(
  { path, name }: IndexEntryDirectory,
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
          value: `📁 ${name}`,
        },
      ],
    } as Link,
    {
      "type": "text",
      "value": " /",
    } as Text,
  ];
}

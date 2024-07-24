import { Break, Heading, Paragraph, PhrasingContent } from "npm:@types/mdast";
import { dirname } from "@std/path/dirname";
import { relative } from "@std/path/relative";
import { intersperse } from "../../arrays.ts";
import { extractBoxChecked } from "../../model/box.ts";
import { WriteFile } from "../../model/output-command.ts";
import { sequence } from "../../strings/regex.ts";
import { startsWith } from "../../strings/text-type-guard.ts";
import { extractFirstTopLevelHeading } from "../extract-first-top-level-heading.ts";
import { Children } from "./child.ts";
import { indexEntryDirectoryToPhrasingContents } from "./index-entry-directory-to-phrasing-contents.ts";
import { indexEntryFileToPhrasingContents } from "./index-entry-file-to-phrasing-contents.ts";
import { indexEntryTaskToListItem } from "./index-entry-task-to-list-item.ts";
import {
  IndexEntry,
  IndexEntryDirectory,
  IndexEntryFile,
  IndexEntryTask,
  isIndexEntryDirectory,
  isIndexEntryFile,
  isIndexEntryTask,
} from "./index-entry.ts";

export function createIndex(
  basePath: string,
  filePath: string,
  commands: WriteFile[],
): Children {
  const startsWithBasePath = startsWith(sequence(basePath, "/"));
  const indexEntries: IndexEntry[] = commands
    .map((writeFile) => {
      const pathRelativeToBasePath = writeFile.path.replace(
        startsWithBasePath.regex,
        "",
      );
      const pathRelativeToBasePathWithoutExtension = pathRelativeToBasePath
        .replace(/((^|\/)index)?\.md$/, "");
      const writeFilePathRelativeToIndexFilePath = relative(
        dirname(filePath),
        writeFile.path,
      );

      const topLevelHeading = extractFirstTopLevelHeading(writeFile.ast);
      const checked = extractBoxChecked(topLevelHeading);
      if (checked === null) {
        if (writeFilePathRelativeToIndexFilePath.endsWith("/index.md")) {
          return {
            type: "directory",
            name: pathRelativeToBasePathWithoutExtension,
            path: writeFilePathRelativeToIndexFilePath,
          } as IndexEntryDirectory;
        }
        return {
          type: "file",
          name: pathRelativeToBasePathWithoutExtension,
          path: writeFilePathRelativeToIndexFilePath,
          isThisFile: writeFile.path === filePath,
        } as IndexEntryFile;
      }
      return {
        type: "task",
        name: pathRelativeToBasePathWithoutExtension,
        path: writeFilePathRelativeToIndexFilePath,
        checked,
        isThisFile: writeFile.path === filePath,
      } as IndexEntryTask;
    })
    .toSorted((a, b) => {
      return new Intl.Collator("en", {
        numeric: true,
      })
        .compare(
          a.path,
          b.path,
        );
    });

  const taskEntries: IndexEntryTask[] = indexEntries.filter(isIndexEntryTask);
  const directoryEntries: IndexEntryDirectory[] = indexEntries.filter(
    isIndexEntryDirectory,
  );
  const fileEntries: IndexEntryFile[] = indexEntries.filter(isIndexEntryFile);
  const otherEntries: Exclude<IndexEntry, IndexEntryTask>[] = [
    ...directoryEntries,
    ...fileEntries,
  ];

  const tasksChildren: Children = taskEntries.length === 0 ? [] : [
    {
      type: "heading",
      depth: 2,
      children: [
        {
          type: "text",
          value: "Tasks",
        },
      ],
    },
    {
      type: "list",
      ordered: false,
      start: null,
      spread: false,
      children: taskEntries.map(indexEntryTaskToListItem),
    },
  ];

  const otherFilesHeading: Heading = {
    type: "heading",
    depth: 3,
    children: [
      {
        type: "text",
        value: "Other files",
      },
    ],
  };
  const otherChildren: Children = otherEntries.length === 0 ? [] : [
    ...(directoryEntries.length === 0 ? [] : [{
      type: "paragraph",
      children: intersperse(
        directoryEntries.map(
          indexEntryDirectoryToPhrasingContents,
        ) as PhrasingContent[][],
        [{ type: "break" }] as Break[],
      ).flat(),
    } as Paragraph]),
    ...(fileEntries.length === 0 ? [] : [{
      type: "paragraph",
      children: intersperse(
        fileEntries.map(
          indexEntryFileToPhrasingContents,
        ) as PhrasingContent[][],
        [{ type: "break" }] as Break[],
      ).flat(),
    } as Paragraph]),
  ];

  return intersperse([
    ...(tasksChildren.length === 0 ? [] : [tasksChildren]),
    ...(otherChildren.length === 0 ? [] : [otherChildren]),
  ], [otherFilesHeading] as Heading[]).flat() as Children;
}

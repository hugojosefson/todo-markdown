import { List, Nodes, Parent } from "npm:@types/mdast";
import { dirname } from "std/path/dirname.ts";
import { relative } from "std/path/relative.ts";
import {
  DeleteFile,
  DeleteOrWriteFile,
  isDeleteFile,
  isWriteFile,
  WriteFile,
} from "../model/output-command.ts";
import { sequence } from "../strings/regex.ts";

import { startsWith } from "../strings/text-type-guard.ts";
import { astToMarkdown } from "./ast-to-markdown.ts";
import {
  HtmlCommentEndString,
  HtmlCommentString,
  HtmlWithValue,
  isHtmlTocBegin,
  isHtmlTocEnd,
  isLink,
  isParent,
  TOC,
  Toc,
} from "./node-types.ts";

type Children = Parent["children"];
type Child = Children[number];
type Accumulator = {
  newChildren: Children;
  inToc: boolean;
};

export async function updateTocInOutputCommands(
  basePath: string,
  commands: DeleteOrWriteFile[],
): Promise<DeleteOrWriteFile[]> {
  const writeCommands: WriteFile[] = commands.filter(isWriteFile);
  const deleteCommands: DeleteFile[] = commands.filter(isDeleteFile);
  return [
    ...deleteCommands,
    ...await Promise.all(writeCommands.map(async (writeCommand) => {
      const ast = addAnyToc(
        basePath,
        writeCommand.path,
        writeCommand.ast,
        writeCommands,
      );
      return {
        ...writeCommand,
        content: await astToMarkdown(ast),
        ast,
      };
    })),
  ];
}

/**
 * Looks through the given output commands, and checks each {@link WriteFile#ast} field for any child node that {@link isHtmlCommentTableOfContentsStart}.
 * then replace
 * everything between (exclusive!) that and the next node that isHtmlCommentTableOfContentsEnd(),
 * with a TableOfContents node.
 * If a node that isHtmlCommentTableOfContentsEnd() is not found, then insert one immediately after
 * the TableOfContents node.
 */
export function addAnyToc<
  T extends Nodes,
>(
  basePath: string,
  filePath: string,
  node: T,
  commands: WriteFile[],
): T {
  if (!isParent(node)) {
    return node;
  }
  const parent = node;
  const children: Children = parent.children;
  if (children.length === 0) {
    return parent;
  }

  const hasTocEnd = children.some(isHtmlTocEnd);
  // ready to write a toc!
  return {
    ...parent,
    children: children.reduce(
      ({ newChildren, inToc }: Accumulator, child: Child): Accumulator => {
        if (inToc) {
          // exclude the current child
          if (isHtmlTocEnd(child)) {
            return {
              newChildren,
              inToc: false,
            };
          }
          return { newChildren, inToc };
        }
        if (isHtmlTocBegin(child)) {
          const tocBegin: HtmlWithValue<HtmlCommentString<Toc>> = child;
          const tocEnd: HtmlWithValue<HtmlCommentEndString<Toc>> = {
            type: "html",
            value: `<!-- /${TOC} -->`,
          };
          return {
            newChildren: [
              ...newChildren,
              tocBegin,
              createTableOfContents(basePath, filePath, commands),
              tocEnd,
            ],
            inToc: hasTocEnd,
          };
        }
        return {
          newChildren: [
            ...newChildren,
            addAnyToc(basePath, filePath, child, commands),
          ],
          inToc: false,
        };
      },
      { newChildren: [], inToc: false },
    ).newChildren,
  };
}

export function createTableOfContents(
  basePath: string,
  filePath: string,
  commands: WriteFile[],
): List {
  const startsWithBasePath = startsWith(sequence(basePath, "/"));
  return {
    type: "list",
    ordered: false,
    start: null,
    spread: false,
    children: commands
      .map((writeFile) => {
        const pathRelativeToBasePath = writeFile.path.replace(
          startsWithBasePath.regex,
          "",
        );
        const pathRelativeToBasePathWithoutExtension = pathRelativeToBasePath
          .replace(/\.md$/, "");
        const writeFilePathRelativeToTocFilePath = relative(
          dirname(filePath),
          writeFile.path,
        );

        return {
          type: "listItem",
          checked: null,
          spread: false,
          children: [{
            type: "paragraph",
            children: [
              {
                type: "link",
                title: null,
                url: writeFilePathRelativeToTocFilePath.split("/").map(
                  encodeURIComponent,
                ).join("/"),
                children: [
                  {
                    type: "text",
                    value: pathRelativeToBasePathWithoutExtension,
                  },
                ],
              },
              ...(
                // output " _(this file)_" if the file is the same as the toc file
                writeFile.path === filePath
                  ? [{
                    type: "text",
                    value: " ",
                  }, {
                    type: "emphasis",
                    children: [
                      {
                        type: "text",
                        value: "(this file)",
                      },
                    ],
                  }]
                  : []
              ),
            ],
          }],
        };
      })
      .toSorted((a, b) => {
        if (
          isParent(a) && isParent(b) && isParent(a.children[0]) &&
          isParent(b.children[0]) && isLink(a.children[0].children[0]) &&
          isLink(b.children[0].children[0])
        ) {
          return new Intl.Collator("en", {
            numeric: true,
          })
            .compare(
              a.children[0].children[0].url,
              b.children[0].children[0].url,
            );
        }
        return 0;
      }) as List["children"],
  };
}

import { toString } from "npm:mdast-util-to-string";
import { Heading, Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";
import { BOX_REGEX } from "../model/box.ts";
import { startsWithA } from "../strings/text-type-guard.ts";

const startsWithABox: ((x: string | Text) => boolean) & { regex: RegExp } =
  startsWithA(
    BOX_REGEX,
  );

export function extractFirstTopLevelHeadingString(
  ast: Nodes,
): string | undefined {
  const headings: Heading[] = selectAll(
    "heading",
    ast,
  ) as Heading[];
  const topLevelHeadings: Heading[] = headings.filter((heading) =>
    heading.depth === 1
  );
  const s = toString(topLevelHeadings.at(0))
    .replace(
      startsWithABox.regex,
      "",
    )
    .trim();

  return undefinedIfEmptyString(s);
}

export function undefinedIfEmptyString<T extends string>(
  s: T,
): T extends "" ? undefined : T {
  if (s === "") {
    return undefined as T extends "" ? undefined : T;
  }
  return s as T extends "" ? undefined : T;
}

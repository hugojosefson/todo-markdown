import { Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";

export function transformAst(tree: Nodes): Nodes {
  const headingTexts = selectAll("heading > text", tree) as Text[];
  const headingTextsWithBoxes = headingTexts.filter((headingText) => {
    return isWithBox(headingText.value);
  });
  const headingTextsWithBoxesAndIdentifiers = headingTexts.filter(
    (headingText) => {
      return isWithBoxAndIdentifier(headingText.value);
    },
  );
  const headingTextsWithBoxesButNoIdentifiers = headingTextsWithBoxes.filter(
    (headingText) => {
      return !isWithBoxAndIdentifier(headingText.value);
    },
  );

  const identifierNumbers: number[] = headingTextsWithBoxesAndIdentifiers
    .map((headingText) => BOX_IDENTIFIER_REGEX.exec(headingText.value)![2])
    .map((identifierNumber) => Number(identifierNumber));
  let maxIdentifierNumber = Math.max(0, ...identifierNumbers);

  for (const headingText of headingTextsWithBoxesButNoIdentifiers) {
    const [_, box, __, rest] = BOX_REGEX.exec(
      headingText.value,
    )! as unknown as [
      string,
      Box,
      string,
      string,
    ];
    // Add an identifier to the heading text, right after the box.
    maxIdentifierNumber += 1;
    const identifierNumber = maxIdentifierNumber;
    const identifier: Identifier = `TODO-${identifierNumber}`;
    headingText.value = `${box} ${identifier} ${rest}`;
  }

  return tree;
}

const BOX_REGEX = /^(\[[ x]\])( (.*))?$/iu;
const BOX_IDENTIFIER_REGEX = /^(\[[ x]\]) TODO-(\d+)(.*)$/iu;
type Box = "[ ]" | "[x]" | "[X]";
type Identifier = `TODO-${number}`;
type BoxAndIdentifier = `${Box} ${Identifier}`;
type WithBox = `${Box}${string}`;
type WithBoxAndIdentifier = `${BoxAndIdentifier}${string}`;
export function isWithBox(s: string): s is WithBox {
  return BOX_REGEX.test(s);
}
export function isWithBoxAndIdentifier(s: string): s is WithBoxAndIdentifier {
  return BOX_IDENTIFIER_REGEX.test(s);
}

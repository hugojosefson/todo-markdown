import { Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";

export function transformAst(tree: Nodes): Nodes {
  const texts = selectAll("heading > text:first-child", tree) as Text[];
  const textsWithBoxes = texts.filter((text) => isWithBox(text.value));
  const textsWithBoxesAndIdentifiers = texts.filter(
    (text) => isWithBoxAndIdentifier(text.value),
  );
  const textsWithBoxesButNoIdentifiers = textsWithBoxes.filter(
    (text) => !isWithBoxAndIdentifier(text.value),
  );

  const listItemTexts = selectAll(
    "listItem > paragraph:first-child text:first-child",
    tree,
  ) as Text[];
  const listItemTextsWithIdentifiers = listItemTexts.filter(
    (text) => isWithIdentifier(text.value),
  );
  const listItemTextsWithoutIdentifiers = listItemTexts.filter(
    (text) => !isWithIdentifier(text.value),
  );

  const identifierNumbers: number[] = [
    ...textsWithBoxesAndIdentifiers
      .map((text) => BOX_IDENTIFIER_REGEX.exec(text.value)![2]),
    ...listItemTextsWithIdentifiers
      .map((text) => IDENTIFIER_REGEX.exec(text.value)![1]),
  ]
    .map((identifierNumber) => Number(identifierNumber));
  let maxIdentifierNumber = Math.max(0, ...identifierNumbers);

  for (const text of textsWithBoxesButNoIdentifiers) {
    const [_, box, __, rest] = BOX_REGEX.exec(
      text.value,
    )! as unknown as [
      string,
      Box,
      string,
      string,
    ];
    // Add an identifier to the text value, right after the box.
    maxIdentifierNumber += 1;
    const identifierNumber = maxIdentifierNumber;
    const identifier: Identifier = `TODO-${identifierNumber}`;
    text.value = `${box} ${identifier} ${rest}`;
  }

  for (const text of listItemTextsWithoutIdentifiers) {
    // Add an identifier to the beginning of the text value
    maxIdentifierNumber += 1;
    const identifierNumber = maxIdentifierNumber;
    const identifier: Identifier = `TODO-${identifierNumber}`;
    text.value = `${identifier} ${text.value}`;
  }

  return tree;
}

const BOX_REGEX = /^(\[[ x]\])( (.*))?$/iu;
const BOX_IDENTIFIER_REGEX = /^(\[[ x]\]) TODO-(\d+)(.*)$/iu;
const IDENTIFIER_REGEX = /^TODO-(\d+)(.*)$/iu;
type Box = "[ ]" | "[x]" | "[X]";
type Identifier = `TODO-${number}`;
type BoxAndIdentifier = `${Box} ${Identifier}`;
type WithBox = `${Box}${string}`;
type WithBoxAndIdentifier = `${BoxAndIdentifier}${string}`;
type WithIdentifier = `${Identifier}${string}`;
export function isWithBox(s: string): s is WithBox {
  return BOX_REGEX.test(s);
}
export function isWithBoxAndIdentifier(s: string): s is WithBoxAndIdentifier {
  return BOX_IDENTIFIER_REGEX.test(s);
}
export function isWithIdentifier(s: string): s is WithIdentifier {
  return IDENTIFIER_REGEX.test(s);
}

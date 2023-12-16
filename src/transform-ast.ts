import { Nodes, Text } from "npm:@types/mdast";
import { selectAll } from "npm:unist-util-select";

export function getAllTextsWithIdentifiers(
  tree: Nodes,
): (Text & { value: WithOnlyIdentifier })[] {
  return selectAll("text:first-child", tree)
    .filter((text): text is Text & { value: WithOnlyIdentifier } =>
      isWithOnlyIdentifier(text.value)
    );
}

/**
 * Replaces all placeholder identifiers in the given tree with new identifiers,
 * starting from the maximum identifier number in the given tree.
 * @param tree
 */
export function transformPlaceholderIdentifiers(tree: Nodes): Nodes {
  let maxIdentifierNumber = getMaxIdentifierNumber(tree);
  const texts: (Text & { value: WithOnlyIdentifier })[] =
    getAllTextsWithIdentifiers(tree);

  return tree; // TODO: TODO-XX → TODO-${++maxIdentifierNumber}
}

/**
 * Finds the maximum identifier number in the given tree.
 * @param tree The tree to search.
 * @returns The maximum identifier number in the given tree.
 */
export function getMaxIdentifierNumber(tree: Nodes): number {
  const texts: Text[] = getAllTexts(tree);
  return texts
    .filter((text) => isWithOnlyIdentifier(text.value))
    .map((text) => ONLY_IDENTIFIER_REGEX.exec(text.value)![1])
    .map((identifierNumber) => Number(identifierNumber))
    .reduce((max, identifierNumber) => Math.max(max, identifierNumber), 0);
}

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
    (text) => isWithOnlyIdentifier(text.value),
  );
  const listItemTextsWithoutIdentifiers = listItemTexts.filter(
    (text) => !isWithOnlyIdentifier(text.value),
  );

  const identifierNumbers: number[] = [
    ...textsWithBoxesAndIdentifiers
      .map((text) => BOX_IDENTIFIER_REGEX.exec(text.value)![2]),
    ...listItemTextsWithIdentifiers
      .map((text) => ONLY_IDENTIFIER_REGEX.exec(text.value)![1]),
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
const ONLY_IDENTIFIER_REGEX = /^TODO-(\d+)(.*)$/iu;
const WITH_MAYBE_BOX_AND_IDENTIFIER_REGEX =
  /^(\[[ x]\] )?TODO-(\d+)( (.*))?$/iu;
const WITH_MAYBE_BOX_AND_PLACEHOLDER_IDENTIFIER_REGEX =
  /^(\[[ x]\] )?TODO-(\?+|x+|X+|n+|N+)( (.*))?$/iu;
type Box = "[ ]" | "[x]" | "[X]";
type Identifier = `TODO-${number}`;
type BoxAndIdentifier = `${Box} ${Identifier}`;
type WithBox = `${Box}${string}`;
type WithBoxAndIdentifier = `${BoxAndIdentifier}${string}`;
type WithOnlyIdentifier = `${Identifier}${string}`;
export function isWithBox(s: string): s is WithBox {
  return BOX_REGEX.test(s);
}
export function isWithBoxAndIdentifier(s: string): s is WithBoxAndIdentifier {
  return BOX_IDENTIFIER_REGEX.test(s);
}
export function isWithOnlyIdentifier(s: string): s is WithOnlyIdentifier {
  return ONLY_IDENTIFIER_REGEX.test(s);
}

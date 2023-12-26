import {
  Heading,
  ListItem,
  Node,
  Paragraph,
  Parent,
  PhrasingContent,
  Text,
} from "npm:@types/mdast";
import { StartsWith, startsWithA } from "../regex.ts";
import { Box, BOX_REGEX } from "../strings/box.ts";

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isParent(node: Node): node is Parent {
  return "children" in node && Array.isArray(node.children);
}

export function isText(node: Node): node is Text {
  return node.type === "text";
}

export function isHeading<N extends Node>(node: N): node is N & Heading {
  return node.type === "heading";
}

export function isListItem(node: Node): node is ListItem {
  return node.type === "listItem";
}

function hasListItemBox(
  listItem: ListItem,
): listItem is ListItem & { checked: boolean } {
  return listItem.checked === true || listItem.checked === false;
}

export const startsWithBox = startsWithA(BOX_REGEX);

/**
 * Returns true if the given heading has a first child that is a text node, and that starts with a box.
 * @param heading
 */
function hasHeadingBox(
  heading: Heading,
): heading is Heading & {
  children: [{ type: "text"; value: StartsWith<Box> }, ...PhrasingContent[]];
} {
  return isText(heading.children[0]) && startsWithBox(heading.children[0]);
}

export function hasBox(
  listItem: ListItem,
): listItem is ListItem & { checked: boolean };
export function hasBox(
  heading: Heading,
): heading is Heading & {
  children: [{ type: "text"; value: StartsWith<Box> }, ...PhrasingContent[]];
};
export function hasBox<T extends ListItem | Heading>(node: T): boolean {
  if (isHeading(node)) {
    return hasHeadingBox(node);
  }
  if (isListItem(node)) {
    return hasListItemBox(node);
  }
  return false;
}

export type WithFirstChild<
  T extends EligibleParentNodes,
  C extends EligibleNodes,
> =
  & T
  & {
    children: [
      C,
      ...(T["children"])[],
    ];
  };
export type EligibleParentNodes = Heading | ListItem | Paragraph;
export type EligibleNodes = EligibleParentNodes | Text;
export type WithFirstChildText<T extends EligibleParentNodes> = WithFirstChild<
  T,
  Text
>;

export function isWithFirstChildText<T extends EligibleParentNodes>(
  node: T,
): node is WithFirstChildText<T> {
  return isText(node.children[0]);
}

export type WithFirstChildParagraphWithText<T extends EligibleParentNodes> =
  WithFirstChild<
    T,
    WithFirstChild<Paragraph, Text>
  >;

export function isWithFirstChildParagraphWithText<
  T extends EligibleParentNodes,
>(
  node: T,
): node is WithFirstChildParagraphWithText<T> {
  return isParagraph(node.children[0]) && isText(node.children[0].children[0]);
}

export function isParagraph(node: Node): node is Paragraph {
  return node.type === "paragraph";
}

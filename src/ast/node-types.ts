import {
  Heading,
  Link,
  ListItem,
  Node,
  Paragraph,
  Parent,
  Text,
} from "npm:@types/mdast";

/**
 * Type-guard for {@link Parent}.
 * @param node The node to check.
 */
export function isParent(node: Node): node is Parent {
  return typeof node === "object" && node !== null &&
    "children" in node && Array.isArray(node.children);
}

/**
 * Type-guard for {@link Heading}.
 * @param node The node to check.
 */
export function isHeading<N extends Node>(node: N): node is N & Heading {
  return node.type === "heading";
}

/**
 * Type-guard for {@link ListItem}.
 * @param node The node to check.
 */
export function isListItem(node: Node): node is ListItem {
  return node.type === "listItem";
}

/**
 * Type-guard for {@link Paragraph}.
 * @param node The node to check.
 */
export function isParagraph(node: Node): node is Paragraph {
  return node.type === "paragraph";
}

/**
 * Type-guard for {@link Text}.
 * @param node The node to check.
 */
export function isText(node: Node): node is Text {
  return node.type === "text";
}

/**
 * Type-guard for {@link Link}.
 * @param node The node to check.
 */
export function isLink(node: Node): node is Link {
  return node.type === "link";
}

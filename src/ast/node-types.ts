import {
  Heading,
  Link,
  ListItem,
  Node,
  Paragraph,
  Parent,
  Text,
} from "npm:@types/mdast";
import { isArrayOf, TypeGuard } from "../model/type-guard.ts";
import { createIsRecordWithProperty } from "../model/record.ts";
import { isString } from "../strings/is-string.ts";
import { and } from "../fn.ts";

/**
 * Type-guard for {@link Node}.
 * @param value The value to check.
 */
export const isNode: TypeGuard<Node> = createIsRecordWithProperty(
  "type",
  isString,
);

/**
 * Type-guard for {@link Parent}.
 * @param value The value to check.
 */
export const isParent: TypeGuard<Parent> = and(
  isNode,
  createIsRecordWithProperty(
    "children",
    isArrayOf(isNode),
  ),
) as TypeGuard<Parent>;

export type NodeOfType<T extends Node["type"]> = Node & { type: T };

/**
 * Type-guard for {@link Heading}.
 * @param node The node to check.
 */
export const isHeading: TypeGuard<Heading> = createIsNodeOfType("heading");

/**
 * Type-guard for {@link ListItem}.
 * @param node The node to check.
 */
export const isListItem: TypeGuard<ListItem> = createIsNodeOfType("listItem");

/**
 * Type-guard for {@link Paragraph}.
 * @param node The node to check.
 */
export const isParagraph: TypeGuard<Paragraph> = createIsNodeOfType(
  "paragraph",
);

/**
 * Type-guard for {@link Text}.
 * @param node The node to check.
 */
export const isText: TypeGuard<Text> = createIsNodeOfType("text");

/**
 * Type-guard for {@link Link}.
 * @param node The node to check.
 */
export const isLink: TypeGuard<Link> = createIsNodeOfType("link");

export function createIsNodeOfType<T extends Node>(
  type: T["type"],
): TypeGuard<T> {
  return and(
    isNode,
    createIsRecordWithProperty(
      "type",
      type,
    ),
  ) as TypeGuard<T>;
}

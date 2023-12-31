import {
  Heading,
  ListItem,
  Node as _Node,
  Paragraph,
  Parent as _Parent,
  Text,
} from "npm:@types/mdast";
import { isParagraph, isText } from "./node-types.ts";

/**
 * A {@link _Parent} node that has a first child that is of a certain type.
 * @template T The type of the parent.
 * @template C The type of the first child.
 * @example
 * ```ts
 * const node: WithFirstChild<Paragraph, Text> = {
 *   type: "paragraph",
 *   children: [
 *     { type: "text", value: "foo" },
 *     // ... any other children
 *   ],
 * };
 * ```
 */
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

/**
 * The {@link _Parent} nodes that are eligible for {@link WithFirstChild}.
 */
export type EligibleParentNodes =
  | Heading
  | ListItem
  | Paragraph;

/**
 * The child {@link _Node} types that are eligible for {@link WithFirstChild}.
 */
export type EligibleNodes =
  | EligibleParentNodes
  | Text;

/**
 * A {@link _Parent} node that has a first child that is a {@link Text}.
 * @template T The type of the parent.
 * @example
 * ```ts
 * const node: WithFirstChildText<Paragraph> = {
 *   type: "paragraph",
 *   children: [
 *     { type: "text", value: "foo" },
 *     // ... any other children
 *   ],
 * };
 * ```
 */
export type WithFirstChildText<T extends EligibleParentNodes> = WithFirstChild<
  T,
  Text
>;

/**
 * Type-guard for {@link WithFirstChildText}.
 * @param node The node to check.
 */
export function isWithFirstChildText<T extends EligibleParentNodes>(
  node: T,
): node is WithFirstChildText<T> {
  return isText(node.children[0]);
}

/**
 * A {@link _Parent} node that has a first child that is a {@link Paragraph} with a first child that is a {@link Text}.
 */
export type WithFirstChildParagraphWithText<T extends EligibleParentNodes> =
  WithFirstChild<
    T,
    WithFirstChild<Paragraph, Text>
  >;

/**
 * Type-guard for {@link WithFirstChildParagraphWithText}.
 * @param node The node to check.
 */
export function isWithFirstChildParagraphWithText<
  T extends EligibleParentNodes,
>(
  node: T,
): node is WithFirstChildParagraphWithText<T> {
  return isParagraph(node.children[0]) && isText(node.children[0].children[0]);
}

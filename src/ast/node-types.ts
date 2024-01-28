import {
  Heading,
  Html,
  Link,
  List,
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

/**
 * A {@link Node} of a specific {@code type}.
 */
export type NodeOfType<T extends Node["type"]> = Node & { type: T };

/**
 * A {@link Html} node with a specific {@code value}.
 */
export type HtmlWithValue<T extends string> = Html & { value: T };

/**
 * Type-guard for {@link Html}.
 * @param node The node to check.
 */
export const isHtml: TypeGuard<Html> = createIsNodeOfType("html");

/**
 * Creates a {@link TypeGuard} for a {@link HtmlWithValue} with a specific {@code value}.
 * @param value The value that the {@link HtmlWithValue} should have.
 */
export function createIsHtmlWithValue<T extends string>(
  value: T,
): TypeGuard<HtmlWithValue<T>> {
  return and(
    isHtml,
    createIsRecordWithProperty(
      "value",
      value,
    ),
  ) as TypeGuard<HtmlWithValue<T>>;
}

/**
 * Identifier for a shallow index.
 */
export const INDEX = "index";

/**
 * Identifier for a shallow index.
 */
export type Index = typeof INDEX;

/**
 * A comment in HTML.
 */
export type HtmlCommentString<T extends string> = `<!-- ${T} -->`;
/**
 * A comment in HTML, that signifies something ending.
 */
export type HtmlCommentEndString<T extends string> = HtmlCommentString<`/${T}`>;

/**
 * Creates a {@link HtmlCommentString} with a specific {@code comment}.
 * @param comment The comment to create.
 */
export function createHtmlCommentString<T extends string>(
  comment: T,
): HtmlCommentString<T> {
  return `<!-- ${comment} -->`;
}

/**
 * Creates a {@link HtmlCommentEndString} with a specific {@code comment}.
 * @param comment The comment to create.
 */
export function createHtmlCommentEndString<T extends string>(
  comment: T,
): HtmlCommentEndString<T> {
  return createHtmlCommentString(`/${comment}`);
}

/**
 * Creates a type-guard for a specific {@link HtmlCommentString}.
 */
export function createIsHtmlCommentString<T extends string>(
  comment: T,
): TypeGuard<HtmlCommentString<T>> {
  return and(
    isString,
    (value: string): value is HtmlCommentString<T> =>
      value === createHtmlCommentString(comment),
  ) as TypeGuard<HtmlCommentString<T>>;
}

/**
 * Creates a type-guard for a specific {@link HtmlCommentEndString}.
 */
export function createIsHtmlCommentEndString<T extends string>(
  comment: T,
): TypeGuard<HtmlCommentEndString<T>> {
  return createIsHtmlCommentString(`/${comment}`);
}

/**
 * Type-guard for {@link HtmlCommentString}<{@link Index}>.
 */
export const isIndexBeginCommentString: TypeGuard<HtmlCommentString<Index>> =
  createIsHtmlCommentString(INDEX);

/**
 * Type-guard for {@link HtmlCommentEndString}<{@link Index}>.
 */
export const isIndexEndCommentString: TypeGuard<HtmlCommentEndString<Index>> =
  createIsHtmlCommentEndString(INDEX);

/**
 * Type-guard for {@link HtmlWithValue}<{@link HtmlCommentString}<{@link Index}>>.
 */
export const isHtmlIndexBegin: TypeGuard<
  HtmlWithValue<HtmlCommentString<Index>>
> = createIsHtmlWithValue(createHtmlCommentString(INDEX));

/**
 * Type-guard for {@link HtmlWithValue}<{@link HtmlCommentEndString}<{@link Index}>>.
 */
export const isHtmlIndexEnd: TypeGuard<
  HtmlWithValue<HtmlCommentEndString<Index>>
> = createIsHtmlWithValue(createHtmlCommentEndString(INDEX));

/**
 * Type-guard for {@link Heading}.
 * @param node The node to check.
 */
export const isHeading: TypeGuard<Heading> = createIsNodeOfType("heading");

/**
 * Type-guard for {@link List}.
 * @param node The node to check.
 */
export const isList: TypeGuard<List> = createIsNodeOfType("list");

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

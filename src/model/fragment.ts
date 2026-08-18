import { StringStartingWith } from "@hugojosefson/fns/string/string-type-guard";
import { startsWithA, TextTypeGuard } from "../strings/text-type-guard.ts";

/**
 * A URL fragment, which is a string starting with a "#".
 */
export type Fragment = StringStartingWith<"#">;

/**
 * Returns true if the given link is only a fragment.
 * @param link The link to check.
 * @returns True if the given link is only a fragment.
 */
export const isAFragment: TextTypeGuard<Fragment> = startsWithA(
  /#/,
);

import { sequence } from "@hugojosefson/fns/string/regex";
import { StringStartingWith } from "@hugojosefson/fns/string/string-type-guard";
import {
  isOnlyA,
  startsWithA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";

export type Protocol = string;

const PROTOCOL_REGEX: RegExp = sequence(
  /[a-z]+/u,
);
export const isAProtocol: TextTypeGuard<Protocol> = isOnlyA<Protocol>(
  PROTOCOL_REGEX,
);

/**
 * Returns true if the given link has a protocol.
 * @param link The link to check.
 * @returns True if the given link has a protocol.
 */
export const hasProtocol: TextTypeGuard<StringStartingWith<`${Protocol}:`>> =
  startsWithA(
    sequence(
      PROTOCOL_REGEX,
      ":",
    ),
  ) as TextTypeGuard<StringStartingWith<`${Protocol}:`>>;

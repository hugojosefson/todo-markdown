import { sequence } from "../strings/regex.ts";
import { StringStartingWith } from "../strings/string-types.ts";
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

/**
 * Possible characters for a project ID.
 */
export type ProjectId1Char =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z";

/**
 * A project ID with 2 characters.
 */
export type ProjectId2Chars = `${ProjectId1Char}${ProjectId1Char}`;

/**
 * A project ID with 3 characters.
 */
export type ProjectId3Chars = `${ProjectId2Chars}${ProjectId1Char}`;

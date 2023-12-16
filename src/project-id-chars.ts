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

/**
 * A project ID with 4 characters.
 */
export type ProjectId4Chars =
  | `${ProjectId3Chars}A`
  | `${ProjectId3Chars}B`
  | `${ProjectId3Chars}C`
  | `${ProjectId3Chars}D`
  | `${ProjectId3Chars}E`
  | `${ProjectId3Chars}F`
  | `${ProjectId3Chars}G`
  | `${ProjectId3Chars}H`
  | `${ProjectId3Chars}I`
  | `${ProjectId3Chars}J`
  | `${ProjectId3Chars}K`
  | `${ProjectId3Chars}L`
  | `${ProjectId3Chars}M`
  | `${ProjectId3Chars}N`
  | `${ProjectId3Chars}O`
  | `${ProjectId3Chars}P`
  | `${ProjectId3Chars}Q`
  | `${ProjectId3Chars}R`
  | `${ProjectId3Chars}S`
  | `${ProjectId3Chars}T`
  | `${ProjectId3Chars}U`
  | `${ProjectId3Chars}V`
  | `${ProjectId3Chars}W`
  | `${ProjectId3Chars}X`
  | `${ProjectId3Chars}Y`
  | `${ProjectId3Chars}Z`;

import { run } from "run_simple";
import { global, groups, sequence } from "../strings/regex.ts";
import { BOX_REGEX } from "../model/box.ts";

/**
 * Format source code using Deno's built-in formatter.
 * @param ext the file extension of the source code
 * @param code the source code to format
 * @returns the formatted source code
 */
export async function formatCode(
  ext: "md" | "json" | "jsonc" | "ipynb" | "ts" | "tsx" | "js" | "jsx",
  code: string,
): Promise<string> {
  return removeBackslashBeforeBox(
    await run([Deno.execPath(), "fmt", "--ext", ext, "-"], {
      stdin: code.trim(),
    }),
  ).trimEnd() + "\n";
}

export function removeBackslashBeforeBox(code: string): string {
  return code.replaceAll(
    global(sequence(/(?<hashOrDash>[#-] )/, "\\", BOX_REGEX)),
    (...args) =>
      [
        groups<"hashOrDash">(args).hashOrDash,
        groups<"box">(args).box,
      ].join(""),
  );
}

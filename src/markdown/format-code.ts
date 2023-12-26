import { run } from "run_simple";
import { global, groups, sequence } from "../regex.ts";
import { BOX_REGEX } from "../strings/box.ts";

export async function formatCode(
  ext: "md" | "json" | "jsonc" | "ipynb" | "ts" | "tsx" | "js" | "jsx",
  code: string,
): Promise<string> {
  return (await run([Deno.execPath(), "fmt", "--ext", ext, "-"], {
    stdin: removeBackslashBeforeBox(code.trim()),
  })).trimEnd() + "\n";
}

function removeBackslashBeforeBox(code: string): string {
  return code.replaceAll(
    global(sequence(/(?<hashOrDash>[#-] )/, "\\", BOX_REGEX)),
    (...args) =>
      `${groups<"hashOrDash">(args).hashOrDash} ${groups<"box">(args).box} `,
  );
}

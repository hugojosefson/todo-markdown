import { run } from "https://deno.land/x/run_simple@2.2.0/mod.ts";
import { global, groups, sequence } from "../regex.ts";
import { BOX_REGEX } from "../strings/box.ts";
export async function formatCode(
  ext: "md" | "json",
  code: string,
): Promise<string> {
  return await run([Deno.execPath(), "fmt", "--ext", ext, "-"], {
    stdin: removeBackslashBeforeBox(code.trim()),
  });
}

function removeBackslashBeforeBox(code: string): string {
  return code.replaceAll(
    global(sequence(/(?<hashOrDash>[#-] )/, "\\", BOX_REGEX)),
    (...args) =>
      `${groups<"hashOrDash">(args).hashOrDash} ${groups<"box">(args).box} `,
  );
}

import { run } from "https://deno.land/x/run_simple@2.2.0/mod.ts";
export async function formatCode(
  ext: "md" | "json",
  code: string,
): Promise<string> {
  return await run([Deno.execPath(), "fmt", "--ext", ext, "-"], {
    stdin: code,
  });
}

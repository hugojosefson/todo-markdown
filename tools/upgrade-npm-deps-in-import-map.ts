#!/usr/bin/env -S deno run --allow-read=import_map.json --allow-write=import_map.json --allow-run=echo,npm
import { run } from "run_simple";

const importMap = JSON.parse(Deno.readTextFileSync("./import_map.json"));
/**
 * @type {Record<string, string>} keys are `npm:<package-name>`, values are `npm:<package-name>@<version>`
 */
const imports = importMap.imports;
const tuplePromises: Promise<readonly [string, string]>[] = Object.keys(imports)
  .filter((key) => key.startsWith("npm:"))
  .map((key) => key.split(":")[1])
  .map(async (pkg) =>
    [pkg, await run(`npm view ${pkg} version`) as string] as const
  );

/**
 * @type {readonly [string, string][]} keys are `<package-name>`, values are `<version>`
 */
const tuples = await Promise.all(tuplePromises);

// update import map, using the versions we just fetched.
for (const [pkg, version] of tuples) {
  imports[`npm:${pkg}`] = `npm:${pkg}@${version}`;
}

// write the updated import map back to disk.
Deno.writeTextFileSync(
  "./import_map.json",
  JSON.stringify(importMap, null, 2) + "\n",
);

/**
 * Read all data from stdin.
 * @returns A promise that resolves to a string with all data from stdin
 */
export async function readAllFromStdin(): Promise<string> {
  const decoder = new TextDecoder();
  const strings: string[] = [];
  for await (const chunk of Deno.stdin.readable) {
    if (chunk === null) {
      break;
    }
    strings.push(decoder.decode(chunk));
  }
  return strings.join("");
}

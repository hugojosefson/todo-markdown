#!/bin/sh
// 2>/dev/null;DENO_VERSION_RANGE="^2.1.5";DENO_RUN_ARGS="--allow-run --allow-read --allow-write=.";set -e;V="$DENO_VERSION_RANGE";A="$DENO_RUN_ARGS";h(){ [ -x "$(command -v "$1" 2>&1)" ];};n(){ [ "$(id -u)" != 0 ];};g(){ if n && ! h;then return;fi;u="$(n&&echo sudo||:)";if h brew;then echo "brew install $1";elif h apt;then echo "($u apt update && $u DEBIAN_FRONTEND=noninteractive apt install -y $1)";elif h yum;then echo "$u yum install -y $1";elif h pacman;then echo "$u pacman -yS --noconfirm $1";elif h opkg-install;then echo "$u opkg-install $1";fi;};p(){ q="$(g "$1")";if [ -z "$q" ];then echo "Please install '$1' manually, then try again.">&2;exit 1;fi;eval "o=\"\$(set +o)\";set -x;$q;set +x;eval \"\$o\"">&2;};f(){ h "$1"||p "$1";};w(){ [ -n "$1" ] && "$1" -V >/dev/null 2>&1;};U="$(l=$(printf "%s" "$V"|wc -c);for i in $(seq 1 $l);do c=$(printf "%s" "$V"|cut -c $i);printf '%%%02X' "'$c";done)";D="$(w "$(command -v deno||:)"||:)";t(){ i="$(if h findmnt;then findmnt -Ononoexec,noro -ttmpfs -nboAVAIL,TARGET|sort -rn|while IFS=$'\n\t ' read -r a m;do [ "$a" -ge 150000000 ]&&[ -d "$m" ]&&printf %s "$m"&&break||:;done;fi)";printf %s "${i:-"${TMPDIR:-/tmp}"}";};s(){ deno eval "import{satisfies as e}from'https://deno.land/x/semver@v1.4.1/mod.ts';Deno.exit(e(Deno.version.deno,'$V')?0:1);">/dev/null 2>&1;};e(){ R="$(t)/deno-range-$V/bin";mkdir -p "$R";export PATH="$R:$PATH";s&&return;f curl;v="$(curl -sSfL "https://semver.se.deno.net/api/github/denoland/deno/$U")";i="$(t)/deno-$v";ln -sf "$i/bin/deno" "$R/deno";s && return;f unzip;([ "${A#*-q}" != "$A" ]&&exec 2>/dev/null;curl -fsSL https://deno.land/install.sh|DENO_INSTALL="$i" sh -s $DENO_INSTALL_ARGS "$v"|grep -iv discord>&2);};e;exec deno run $A "$0" "$@"
import { isDirectory } from "../test/traverse-cases.ts";
import { writeChanges } from "./io/write-changes.ts";
import {
  transformInputDirectoryToOutputCommands,
} from "./ast/transform-input-directory-to-output-commands.ts";
import { isProjectId } from "./model/project-id.ts";
import { not } from "@hugojosefson/fns/fn/not";
import { readAllFromStdin } from "./io/read-all-from-stdin.ts";
import {
  transformInputAstToMarkdown,
} from "./ast/transform-input-ast-to-markdown.ts";
import { markdownToAst } from "./ast/markdown-to-ast.ts";

const projectId = Deno.args.find(isProjectId) ?? "TODO";
const filename = Deno.args.find(not(isProjectId));
const shouldReadFromStdin = filename === "-" || !filename;
const inputIsDirectory = !shouldReadFromStdin && await isDirectory(filename);
console.error({
  projectId,
  filename,
  inputIsDirectory,
  shouldReadFromStdin,
});

if (inputIsDirectory) {
  const absoluteDirectory = await Deno.realPath(filename);
  const outputs = await transformInputDirectoryToOutputCommands(
    projectId,
    absoluteDirectory,
  );
  await writeChanges(outputs);
} else {
  const input = shouldReadFromStdin
    ? await readAllFromStdin()
    : await Deno.readTextFile(filename);

  const inputAst = markdownToAst(input);
  const output = await transformInputAstToMarkdown(projectId, inputAst);

  console.log(output);
}

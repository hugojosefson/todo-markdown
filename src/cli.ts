#!/bin/sh
// 2>/dev/null;DENO_VERSION_RANGE="^1.39.1";DENO_RUN_ARGS="--allow-run --allow-read --allow-write=.";set -e;V="$DENO_VERSION_RANGE";A="$DENO_RUN_ARGS";h(){ [ -x "$(command -v $1 2>&1)" ];};g(){ u="$([ $(id -u) != 0 ]&&echo sudo||:)";if h brew;then echo "brew install $1";elif h apt;then echo "($u apt update && $u DEBIAN_FRONTEND=noninteractive apt install -y $1)";elif h yum;then echo "$u yum install -y $1";elif h pacman;then echo "$u pacman -yS --noconfirm $1";elif h opkg-install;then echo "$u opkg-install $1";fi;};p(){ q="$(g $1)";if [ -z "$q" ];then echo "Please install '$1' manually, then try again.">&2;exit 1;fi;eval "o=\"\$(set +o)\";set -x;$q;set +x;eval \"\$o\"">&2;};f(){ h "$1"||p "$1";};U="$(printf "%s" "$V"|xxd -p|tr -d '\n'|sed 's/\(..\)/%\1/g')";D="$(command -v deno||true)";t(){ d="$(mktemp)";rm "${d}";dirname "${d}";};a(){ [ -n $D ];};s(){ a&&[ -x "$R/deno" ]&&[ "$R/deno" = "$D" ]&&return;deno eval "import{satisfies as e}from'https://deno.land/x/semver@v1.4.1/mod.ts';Deno.exit(e(Deno.version.deno,'$V')?0:1);">/dev/null 2>&1;};e(){ R="$(t)/deno-range-$V/bin";mkdir -p "$R";export PATH="$R:$PATH";[ -x "$R/deno" ]&&return;a&&s&&([ -L "$R/deno" ]||ln -s "$D" "$R/deno")&&return;f curl;v="$(curl -sSfL "https://semver-version.deno.dev/api/github/denoland/deno/$U")";i="$(t)/deno-$v";[ -L "$R/deno" ]||ln -s "$i/bin/deno" "$R/deno";s && return;f unzip;([ "${A#*-q}" != "$A" ]&&exec 2>/dev/null;curl -fsSL https://deno.land/install.sh|DENO_INSTALL="$i" sh -s $DENO_INSTALL_ARGS "$v">&2);};e;exec "$R/deno" run $A "$0" "$@"
import { isDirectory } from "../test/traverse-cases.ts";
import { writeChanges } from "./io/write-changes.ts";
import {
  transformInputDirectoryToOutputCommands,
} from "./ast/transform-input-directory-to-output-commands.ts";
import { isProjectId } from "./model/project-id.ts";
import { not } from "./fn.ts";
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
  const outputs = await transformInputDirectoryToOutputCommands(
    projectId,
    filename,
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

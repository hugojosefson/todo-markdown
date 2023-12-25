# todo-markdown

Use markdown docs, to keep track of todo items.

| 🚧️👷 Under construction 👷🚧️ |
| ---------------------------- |

## Ex*amp*le

### Markdown input

```markdown
# My TODO:s

## Urgent

- [x] TODO-2 Pay bills
- [ ] TODO-1 Buy milk
- [x] TODO-3 Call mom
- [ ] TODO-5 Buy eggs

## [ ] Later

- [ ] TODO-? Buy bread
- [ ] TODO-7 Eat it all

## TODO-? Other

- [ ] TODO-xx Do something else
- [ ] Do something even elser

## [ ] TODO-? Heading with box and placeholder

## TODO-10 Heading with task identifier, but no box
```

### Markdown output

```markdown
# My TODO:s

## Urgent

- [x] TODO-2 Pay bills
- [ ] TODO-1 Buy milk
- [x] TODO-3 Call mom
- [ ] TODO-5 Buy eggs

## [ ] TODO-11 Later

- [ ] TODO-12 Buy bread
- [ ] TODO-7 Eat it all

## [ ] TODO-13 Other

- [ ] TODO-14 Do something else
- [ ] TODO-15 Do something even elser

## [ ] TODO-16 Heading with box and placeholder

## [ ] TODO-10 Heading with task identifier, but no box
```

### List of things, that are not tasks

- This is a normal list item, not a task.
- This is another.

1. This is a normal ordered list item, not a task.
2. This is another.

## [ ] Features included

1. [x] Parses markdown input.
1. [x] Finds all places where task identifiers are used:
   - [x] unordered lists / task lists
   - [x] ordered lists
   - [x] headings
1. [x] In each eligible place, identifies task identifiers based on regex, ex
       `/\bTODO-\d+\b/`.
1. [x] In the existing tasks, finds the highest numbered identifier.
1. [x] Calculates the next identifier, always higher than the highest existing.
       It's OK to skip numbers.
1. [x] Identifies all text nodes with new todo items, by:
   - [x] `- [ ]` syntax without a task identifier,
   - [x] `# [ ]` syntax without a task identifier,
   - [x] task identifier placeholder, via regex, ex
         `\bTODO-(\?+|x+|X+|n+|N+)\b`,
   - ~~[ ] copied, already existing task identifier.~~
1. [x] For each text node with a new task, mutates the node to include the next
       identifier.
1. [x] For each text node with a task identifier, but no box, adds a box.
1. [x] Processes the markdown from beginning to end, so that new task
       identifiers are in order.
1. [x] Removes `\` before a box and task identifier, if any.
1. [x] Outputs transformed markdown.
1. [x] Formats the markdown output.
1. [ ] Supports multiple files, parsing them, and seeing all tasks across all
       files at the same time.
1. [ ] Renames each file to its first top-level heading, if any. Excluding the
       `#` character, any box, and sets file extension to `.md`.
1. [ ] When renaming, if a file with the same name already exists, does any
       renaming on that file first. If they still collide, concatenates the
       contents of the two files.
1. [ ] When renaming, if a file with the same name already exists, and the
       contents are identical, deletes the file, so that it's not duplicated.
1. [ ] When renaming, updates links to the renamed file, in all files. Ex
       `[Link description](./old-file-name.md)` →
       `[Link description](./new-file-name.md)`.
1. [ ] When updating links to a renamed file, if the link is to a heading, and
       the heading is renamed, updates the link to point to the new heading.
1. [ ] When updating links to a renamed file, if the link text contains the old
       file name without file extension, replaces that part of the link text
       with the new file name without file extension.

## Further details

### Where to find task identifiers

In the Abstract Syntax Tree (AST) of the markdown input, we expect to find task
identifiers in the following places:

```css
listItem > paragraph text
heading text
```

### AST from this README

For an example of the AST of this entire README, please see
[README-ast.json](./README-ast.json).

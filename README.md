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

- [ ] TODO-14 Buy bread
- [ ] TODO-7 Eat it all

## [ ] TODO-12 Other

- [ ] TODO-15 Do something else
- [ ] TODO-16 Do something even elser

## [ ] TODO-13 Heading with box and placeholder

## TODO-10 Heading with task identifier, but no box
```

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
   - [x] task identifier placeholder, via regex, ex
         `\bTODO-(\?+|x+|X+|n+|N+)\b`,
   - ~~[ ] copied, already existing task identifier.~~
1. [x] For each text node with a new task, mutates the node to include the next
       identifier.
1. [ ] For each text node with a task identifier, but no box, adds a box.
1. [ ] Processes the markdown from beginning to end, so that new task
       identifiers are in order.
1. [x] Outputs transformed markdown.
1. [x] Formats the markdown output.

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

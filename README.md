# todo-markdown

Tool for using markdown document(s) for keeping track of todo items.

## Ex*amp*le

### Markdown input

```markdown
# My TODO:s

## Urgent

- [x] TODO-2 Pay bills
- [ ] TODO-1 Buy milk
- [x] TODO-3 Call mom
- [ ] TODO-5 Buy eggs

## Later

- [ ] TODO-? Buy bread
- [ ] TODO-7 Eat it all

## Other

- [ ] Do something else
- [ ] TODO-xx Do something even elser
```

### Markdown output

```markdown
# My TODO:s

## Urgent

- [x] TODO-2 Pay bills
- [ ] TODO-1 Buy milk
- [x] TODO-3 Call mom
- [ ] TODO-5 Buy eggs

## Later

- [ ] TODO-8 Buy bread
- [ ] TODO-7 Eat it all

## Other

- [ ] TODO-9 Do something else
- [ ] TODO-10 Do something even elser
```

## Features

1. [x] Parses markdown input.
1. [ ] Finds all places where task identifiers are used:
   - [ ] unordered lists / task lists
   - [ ] ordered lists
   - [ ] headings
1. [ ] In each eligible place, identifies task identifiers based on regex, ex
       `/\bTODO-\d+\b/`.
1. [ ] In the existing tasks, finds the highest numbered identifier.
1. [ ] Calculates the next identifier, always higher than the highest existing.
       It's OK to skip numbers.
1. [ ] Identifies all new todo items, by:
   - [ ] `- [ ]` syntax without a task identifier,
   - [ ] task identifier placeholder, via regex, ex
         `\bTODO-(\?+|x+|X+|n+|N+)\b`,
   - [ ] copied, already existing task identifier.
1. [ ] For each new task, assigns the next identifier.
1. [x] Outputs transformed markdown.
1. [x] Formats the markdown output.

### Where to find task identifiers

```css
listItem > paragraph text
heading text
```

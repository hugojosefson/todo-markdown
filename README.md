# todo-markdown

Tool for using markdown document(s) for keeping track of todo items.

## Example

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

- [ ] Parses markdown input.
- [ ] Finds all places where task identifiers are used:
  - [ ] unordered lists / task lists
  - [ ] ordered lists
  - [ ] headings
- [ ] In each eligible place, identifies task identifiers based on regex, ex
      `/\bTODO-\d+\b/`.
- [ ] In the existing tasks, finds the highest numbered identifier.
- [ ] Calculates the next identifier, always higher than the highest existing.
      It's OK to skip numbers.
- [ ] Identifies all new todo items, by:
  - [ ] `- [ ]` syntax without a task identifier,
  - [ ] task identifier placeholder, via regex, ex `\bTODO-(\?+|x+|X+|n+|N+)\b`,
  - [ ] copied, already existing task identifier.
- [ ] For each new task, assigns the next identifier.
- [ ] Outputs modified markdown with any new identifiers.
- [ ] Formats the markdown output.

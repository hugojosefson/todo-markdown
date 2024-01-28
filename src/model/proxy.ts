/*
_Relevant snippets from the README:_

---

#### Task defined in a heading

- [ ] `listItem`s are the `includes` of any parent task (heading or `listItem`).
- [ ] Interprets and updates task sub-headings:
  - [ ] `Do ${currentTaskId} after`
  - [ ] `Do ${currentTaskId} before`
  - [ ] `Description`, or text paragraph immediately following a task heading.

#### Task defined in a `listItem`

- [ ] `listItem`s are the `includes` of any parent task (heading or `listItem`).
- [ ] Interprets and updates task sub-`listItem[checked=null]`s
  - [ ] `Do ${currentTaskId} after` | `Do after`
    - `otherTaskId1`
    - `otherTaskId2`
    - …
  - [ ] `Do ${currentTaskId} before` | `Do before`
    - `otherTaskId3`
    - `otherTaskId4`
    - …

---

## Further details

### Task model

See also [src/model/task.ts](./src/model/task.ts).

### Connection between task model and markdown

#### How a task refers to its position in the markdown

The task model is not a concrete thing, but a `Proxy` around the
`DeleteOrWriteFiles[]` model.

All read accesses to the task model, are converted to read accesses into the
`DeleteOrWriteFiles[]` model. All write accesses to the task model, are
converted to write accesses into the `DeleteOrWriteFiles[]` model.

When accessing a property of the model, it returns a `Proxy` that knows what
part of the `DeleteOrWriteFiles[]` model it refers to.

Thus, after having made any changes to the task model, we need not convert
anything, because all changes were really already made to the
`DeleteOrWriteFiles[]` model. We can then simply convert the
`DeleteOrWriteFiles[]` model to markdown.

 */

import {
  Heading,
  ListItem,
  Node,
  Nodes,
  Paragraph,
  Parent,
  RootContent,
  Text,
} from "npm:@types/mdast";
import { astToMarkdown } from "../ast/ast-to-markdown.ts";
import { createExtractHeadingString } from "../ast/extract-first-top-level-heading.ts";
import {
  isHeading,
  isList,
  isListItem,
  isParagraph,
} from "../ast/node-types.ts";
import {
  isWithFirstChildText,
  WithFirstChildText,
} from "../ast/with-first-child.ts";
import { and } from "../fn.ts";
import { isString } from "../strings/is-string.ts";
import { only, optional, or, sequence } from "../strings/regex.ts";
import { StringStartingWith } from "../strings/string-types.ts";
import {
  isOnly,
  startsWithA,
  TextTypeGuard,
} from "../strings/text-type-guard.ts";
import {
  BoxAndTaskId,
  createBoxAndTaskIdRegex,
  extractBoxChecked,
} from "./box.ts";
import { DeleteOrWriteFile } from "./output-command.ts";
import { ProjectId } from "./project-id.ts";
import {
  createExtractTaskId,
  createIsTaskId,
  createTaskIdRegex,
  ExtractTaskId,
  TaskId,
} from "./task-id.ts";
import { Task } from "./task.ts";
import {
  isArrayOf,
  isBoolean,
  isTripleEqual,
  TypeGuard,
} from "./type-guard.ts";
import { createTaskIdPlaceholderRegex } from "./task-id-placeholder.ts";
import { prop } from "../objects.ts";
import { createIsRecordWithProperty } from "./record.ts";
import { not } from "../fn.ts";

export type TasksById<PI extends ProjectId> = Record<TaskId<PI>, Task<PI>>;

/**
 * Finds all {@link Task}s defined in the given abstract syntax tree.
 *
 * A task is defined by either:
 * - a {@link Heading} with a {@link Box} and a {@link TaskId}, or
 * - a {@link ListItem} with `checked` set to `true` or `false`.
 *
 * A task is not defined by:
 * - a {@link Heading} without a {@link Box}, or
 * - a {@link ListItem} without `checked` set to `null`.
 *
 * @param ast The abstract syntax tree to search for tasks.
 * @returns A {@link TasksById} model, containing all tasks found in the given
 * abstract syntax tree.
 */
export function _findTaskDefinitionsInAst<PI extends ProjectId>(
  _projectId: PI,
  _ast: Nodes,
): TasksById<PI> {
  throw new Error("Not implemented");
}

/**
 * Extracts a {@link Task} from the given {@link Heading}.
 *
 * @param projectId The {@link ProjectId} to expect in {@link TaskId}s.
 * @param heading The heading to extract a task from.
 * @param surroundingAst The nodes that follow the
 * given heading, until the next heading on the same level.
 * @returns The extracted task, or `undefined` if the given heading does not
 * define a task.
 * @see {@link transformHeading}
 */
export function extractTaskFromHeading<PI extends ProjectId>(
  projectId: PI,
  heading: Heading,
  surroundingAst: Parent,
): Task<PI> | undefined {
  const task: Task<PI> | undefined = TaskBackedByHeadingAndSurroundingAst
    .create(
      projectId,
      heading,
      surroundingAst,
    );
  return task;
}

export function extractParagraphString(
  possiblyParagraph: Node | undefined,
): string | undefined {
  if (isParagraph(possiblyParagraph)) {
    const paragraph: Paragraph = possiblyParagraph;
    if (isWithFirstChildText(paragraph)) {
      const text: Text = paragraph.children[0];
      return text.value;
    }
  }
  return undefined;
}

export function extractImmediatelyFollowingParagraphString(
  heading: Heading,
  surroundingAst: Parent,
): string | undefined {
  const headingIndex = surroundingAst.children.indexOf(heading);
  const nextSibling: Node | undefined =
    surroundingAst.children[headingIndex + 1];
  return extractParagraphString(nextSibling);
}

export function extractSubHeadingsOf(
  heading: Heading,
  surroundingAst: Parent,
): Heading[] {
  return extractAstBelowHeading(
    heading,
    surroundingAst,
  ).filter(isHeading);
}

export function extractListItemsOf(
  heading: Heading,
  surroundingAst: Parent,
): ListItem[] {
  return extractAstBelowHeading(
    heading,
    surroundingAst,
  )
    .filter(isList)
    .flatMap(prop("children"))
    .filter(isListItem);
}

export function extractTaskIdsMentionedBelowHeading<PI extends ProjectId>(
  projectId: PI,
  heading: Heading,
  surroundingAst: Parent,
): TaskId<PI>[] {
  const listItems: ListItem[] = extractListItemsOf(
    heading,
    surroundingAst,
  );
  const extractTaskId: ExtractTaskId<PI> = createExtractTaskId(projectId);
  return listItems
    .filter(isWithFirstChildText)
    .map(prop("children"))
    .filter((children) => children.length > 0)
    .map(prop("0"))
    .map(extractTaskId)
    .filter(isString)
    .filter(isOnly<TaskId<PI>>(createTaskIdRegex(projectId)));
}

/**
 * Extracts all nodes below the given heading, until the next heading on the
 * same or higher level.
 * @param heading The heading to extract nodes below.
 * @param surroundingAst All Nodes including and following the given heading.
 * @returns All nodes below the given heading, until the next heading on the
 * same or higher level.
 */
export function extractAstBelowHeading(
  heading: Heading,
  surroundingAst: Parent,
): RootContent[] {
  const headingIndex = surroundingAst.children.indexOf(heading);
  const astBelowHeading: RootContent[] = [];
  for (let i = headingIndex + 1; i < surroundingAst.children.length; i++) {
    const node: RootContent = surroundingAst.children[i];
    if (isHeading(node)) {
      const subHeading: Heading = node;
      if (subHeading.depth <= heading.depth) {
        break;
      }
    }
    astBelowHeading.push(node);
  }
  return astBelowHeading;
}

export class TaskBackedByHeadingAndSurroundingAst<PI extends ProjectId>
  implements Task<PI> {
  private readonly extractTaskId: ExtractTaskId<PI>;
  private readonly extractHeadingString: (
    heading: WithFirstChildText<Heading>,
  ) => string;
  private readonly isTaskId: TypeGuard<TaskId<PI>>;
  private readonly isTask: TypeGuard<Task<PI>>;
  private constructor(
    readonly projectId: PI,
    readonly heading: WithFirstChildText<Heading>,
    readonly surroundingAst: Parent,
    readonly getTaskLookuper: () => (
      taskId: TaskId<PI>,
    ) => Task<PI> | undefined,
  ) {
    this.extractTaskId = createExtractTaskId(this.projectId);
    this.extractHeadingString = createExtractHeadingString(this.projectId);
    this.isTaskId = createIsTaskId(this.projectId);
    this.isTask = createIsTask(this.projectId);
  }

  get id(): Readonly<TaskId<PI>> {
    return this.extractTaskId(this.heading.children[0])!;
  }

  get title(): string {
    return this.extractHeadingString(this.heading);
  }

  get description(): Promise<string | undefined> {
    const immediatelyFollowingParagraphString: string | undefined =
      extractImmediatelyFollowingParagraphString(
        this.heading,
        this.surroundingAst,
      );
    if (isString(immediatelyFollowingParagraphString)) {
      return Promise.resolve(immediatelyFollowingParagraphString);
    }

    const descriptionHeading = this.findSubHeading(
      only(sequence("Description")),
    );
    if (descriptionHeading === undefined) {
      return Promise.resolve(undefined);
    }
    const astBelowHeading: RootContent[] = extractAstBelowHeading(
      descriptionHeading,
      this.surroundingAst,
    );
    return astToMarkdown(astBelowHeading);
  }

  get done(): boolean {
    return extractBoxChecked(this.heading) === true;
  }

  get doAfter(): TaskId<PI>[] {
    const doAfterHeading = this.findSubHeading(
      only(
        sequence(
          or(
            sequence("Do after"),
            sequence("Do ", this.id, " after"),
            sequence(
              "Do ",
              createTaskIdPlaceholderRegex(this.projectId),
              " after",
            ),
          ),
          optional(":"),
        ),
      ),
    );
    if (doAfterHeading === undefined) {
      return [];
    }

    return extractTaskIdsMentionedBelowHeading(
      this.projectId,
      doAfterHeading,
      this.surroundingAst,
    );
  }

  get doBefore(): TaskId<PI>[] {
    const doBeforeHeading = this.findSubHeading(
      only(
        sequence(
          or(
            sequence("Do before"),
            sequence("Do ", this.id, " before"),
            sequence(
              "Do ",
              createTaskIdPlaceholderRegex(this.projectId),
              " before",
            ),
          ),
          optional(":"),
        ),
      ),
    );
    if (doBeforeHeading === undefined) {
      return [];
    }

    return extractTaskIdsMentionedBelowHeading(
      this.projectId,
      doBeforeHeading,
      this.surroundingAst,
    );
  }

  get includes(): TaskId<PI>[] {
    const includesHeading = this.findSubHeading(
      only(
        sequence(
          or(
            sequence("Includes"),
            sequence(this.id, " includes"),
            sequence(
              createTaskIdPlaceholderRegex(this.projectId),
              " includes",
            ),
          ),
          optional(":"),
        ),
      ),
    );
    if (includesHeading === undefined) {
      return [];
    }

    return extractTaskIdsMentionedBelowHeading(
      this.projectId,
      includesHeading,
      this.surroundingAst,
    );
  }

  get readyToStart(): Readonly<boolean> {
    if (this.done) {
      return false;
    }
    if (this.inProgress) {
      return false;
    }
    return this.doAfter
      .map(this.getTaskLookuper())
      .filter(this.isTask)
      .map(prop("done"))
      .every(isTripleEqual(true));
  }

  get inProgress(): Readonly<boolean> {
    if (this.done) {
      return false;
    }
    return this.includes
      .map(this.getTaskLookuper())
      .filter(this.isTask)
      .map(prop("done"))
      .some(isTripleEqual(true));
  }

  get blocks(): Readonly<TaskId<PI>[]> {
    if (this.done) {
      return [];
    }
    return this.doBefore
      .map(this.getTaskLookuper())
      .filter(this.isTask)
      .filter(({ doAfter }) => doAfter.includes(this.id))
      .filter(not(prop("done")))
      .map(prop("id"));
  }

  static create<PI extends ProjectId>(
    projectId: PI,
    heading: Heading,
    surroundingAst: Parent,
  ): Task<PI> | undefined {
    if (heading.children.length === 0) {
      // if heading has no children, there is no task
      return undefined;
    }

    if (!isWithFirstChildText(heading)) {
      // if heading doesn't start with text, there is no task
      return undefined;
    }

    const startsWithABoxAndTaskId: TextTypeGuard<
      StringStartingWith<BoxAndTaskId<PI>>
    > = startsWithA(
      createBoxAndTaskIdRegex(projectId),
    );

    const text: Text = heading.children[0];
    if (!startsWithABoxAndTaskId(text)) {
      // if heading doesn't have both box and proper task id, there is no task here
      return undefined;
    }

    const extractTaskId = createExtractTaskId(projectId);
    const taskId = extractTaskId(text);
    if (taskId === undefined) {
      // if task id is not valid, there is no task here
      return undefined;
    }
    return new TaskBackedByHeadingAndSurroundingAst(
      projectId,
      heading,
      surroundingAst,
    ) as unknown as Task<PI>; // TODO
  }

  private findSubHeading(
    subHeadingRegex: RegExp,
  ): WithFirstChildText<Heading> | undefined {
    const subHeadingPredicate = (subHeading: WithFirstChildText<Heading>) =>
      subHeadingRegex.test(this.extractHeadingString(subHeading));
    const predicate = and(
      isWithFirstChildText,
      subHeadingPredicate,
    ) as TypeGuard<WithFirstChildText<Heading>>;
    return extractSubHeadingsOf(
      this.heading,
      this.surroundingAst,
    )
      .find(predicate);
  }
}

export function createIsTask<PI extends ProjectId>(
  projectId: PI,
): TypeGuard<Task<PI>> {
  const isTaskId = createIsTaskId(projectId);
  return and(
    createIsRecordWithProperty("id", isTaskId),
    createIsRecordWithProperty(
      "doAfter",
      isArrayOf(isTaskId),
    ),
    createIsRecordWithProperty(
      "doBefore",
      isArrayOf(isTaskId),
    ),
  ) as TypeGuard<Task<PI>>;
}

/**
 * Wraps the given output commands in a proxy, so that we can access them as if
 * they were a {@link TasksById} model.
 *
 * @param outputCommands The output commands to wrap in a proxy.
 * @returns A Proxy that wraps the given output commands, so that we can access
 * them as if they were a {@link TasksById} model.
 */
function _wrapInProxy<PI extends ProjectId>(
  projectId: PI,
  outputCommands: DeleteOrWriteFile[],
): TasksById<PI> {
  return { projectId, outputCommands } as unknown as TasksById<PI>; // TODO
}

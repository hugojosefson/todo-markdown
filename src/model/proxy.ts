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
import { createExtractString } from "../ast/extract-first-top-level-heading.ts";
import {
  isHeading,
  isList,
  isListItem,
  isParagraph,
  isParent,
} from "../ast/node-types.ts";
import {
  isWithFirstChildText,
  WithFirstChildText,
} from "../ast/with-first-child.ts";
import { and,pipe, Getter, Lookuper } from "../fn.ts";
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
import { DeleteOrWriteFile, isWriteFile } from "./output-command.ts";
import { ProjectId } from "./project-id.ts";
import {
  createExtractTaskId,
  createIsTaskId,
  createTaskIdRegex,
  ExtractTaskId,
  TaskId,
} from "./task-id.ts";
import { Task } from "./task.ts";
import { isArrayOf, isTripleEqual, TypeGuard } from "./type-guard.ts";
import { createTaskIdPlaceholderRegex } from "./task-id-placeholder.ts";
import { prop } from "../objects.ts";
import { createIsRecordWithProperty } from "./record.ts";
import { not } from "../fn.ts";
import { extractFirstTopLevelHeading } from "../ast/extract-first-top-level-heading.ts";
import { asString } from "run_simple/src/fn.ts";
import { Root } from "../../../../../../../home/hugo/.cache/deno/npm/registry.npmjs.org/mdast-util-find-and-replace/3.0.1/lib/index.d.ts";

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
export function extractTasksInAst<PI extends ProjectId>(
  projectId: PI,
  ast: Nodes | RootContent[],
  getTaskLookuper: Getter<TaskLookuper<PI>>,
): TasksById<PI> {
  if (!Array.isArray(ast) && !isParent(ast)) {
    return {} as TasksById<PI>;
  }

  const headings: Heading[] = extractHighestLevelHeadings(ast);
  const listItems: ListItem[] = headings.flatMap((heading) =>
    extractListItemsOf(heading, ast)
  );

const toTaskEntry = (task: Task<PI>) => [task.id, task] as const;

  return Object.fromEntries([
    // extract tasks from headings
    ...headings
    .map((heading) => TaskBackedByHeadingAndSurroundingAst.create(
      projectId,
      heading,
      ast,
      getTaskLookuper,
    ))
    .filter(createIsTask(projectId))
    .map(toTaskEntry),

    // extract tasks from sub-headings
    ...Object.entries(
      headings
    .map((heading) =>    extractAstBelowHeading(heading, ast)  )
    .map((astBelowHeading) => extractTasksInAst(projectId, astBelowHeading, getTaskLookuper)  )
    ),

    // extract tasks from list items
    ...listItems
    .map(listItem => TaskBackedByListItemAndSurroundingAst.create(
      projectId,
      listItem,
      ast,
      getTaskLookuper,
    ))
    .map(toTaskEntry)
  ]);

}

/**
 * Extracts all highest-level {@link Heading}s from the given abstract syntax
 * tree. In a normal document, this would be all {@link Heading}s with a depth
 * of 1. In the AST returned from {@link extractAstBelowHeading}, this would be
 * all {@link Heading}s with a depth of the given heading + 1.
 * @param ast The abstract syntax tree to extract highest-level headings from.
 * @returns All highest-level {@link Heading}s from the given abstract syntax
 * tree.
 */
export function extractHighestLevelHeadings(
  ast: Nodes | RootContent[],
): Heading[] {
  if (!Array.isArray(ast) && !isParent(ast)) {
    return [];
  }
  const children: RootContent[] = Array.isArray(ast) ? ast : ast.children;
  const headings = children.filter(isHeading) as Heading[];
  const headingDepths: number[] = headings.map(prop("depth"));
  if (headingDepths.length === 0) {
    return [];
  }
  const minHeadingDepth: number = Math.min(...headingDepths);
  return headings.filter(pipe(
    prop("depth"),
    isTripleEqual(minHeadingDepth)
    ));
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

// TODO: make this function accept Heading | ListItem. See README-ast.json for
// an example of a ListItem that contains/is followed by, a paragraph, which we would like to
// extract.
export function extractImmediatelyFollowingParagraphString(
  heading: Heading,
  surroundingAst: Nodes|RootContent[],
): string | undefined {
  if (!isParent(surroundingAst)) {
    return undefined;
  }
  const parent: Parent = surroundingAst;

  const headingIndex = parent.children.indexOf(heading);
  const nextSibling: Node | undefined = parent.children[headingIndex + 1];
  return extractParagraphString(nextSibling);
}

export function extractSubHeadingsOf(
  heading: Heading,
  surroundingAst: Nodes|RootContent[],
): Heading[] {
  return extractAstBelowHeading(
    heading,
    surroundingAst,
  ).filter(isHeading);
}

export function extractListItemsOf(
  heading: Heading,
  surroundingAst: Nodes|RootContent[],
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
  surroundingAst: Nodes|RootContent[],
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
  surroundingAst: Nodes | RootContent[],
): RootContent[] {
  if (!Array.isArray(surroundingAst) && !isParent(surroundingAst)) {
    return [];
  }
  const children: RootContent[] = Array.isArray(surroundingAst) ? surroundingAst : surroundingAst.children;

  const headingIndex = children.indexOf(heading);
  const astBelowHeading: RootContent[] = [];
  for (let i = headingIndex + 1; i < children.length; i++) {
    const node: RootContent = children[i];
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

/**
 * A function to look up a {@link Task} by its {@link TaskId}.
 */
export type TaskLookuper<PI extends ProjectId> = Lookuper<
  TaskId<PI>,
  Task<PI> | undefined
>;

/**
 * Implementation of {@link Task} that is backed by a {@link Heading} and the
 * surrounding abstract syntax tree.
 */
export class TaskBackedByHeadingAndSurroundingAst<PI extends ProjectId>
  implements Task<PI> {
  private readonly extractTaskId: ExtractTaskId<PI>;
  private readonly extractString: (
    headingOrListItem: WithFirstChildText<Heading|ListItem>,
  ) => string;
  private readonly isTask: TypeGuard<Task<PI>>;
  private constructor(
    private readonly projectId: PI,
    private readonly heading: WithFirstChildText<Heading>,
    private readonly surroundingAst: Nodes|RootContent[],
    private readonly getTaskLookuper: Getter<TaskLookuper<PI>>,
  ) {
    this.extractTaskId = createExtractTaskId(this.projectId);
    this.extractString = createExtractString(this.projectId);
    this.isTask = createIsTask(this.projectId);
  }

  get id(): Readonly<TaskId<PI>> {
    return this.extractTaskId(this.heading.children[0])!;
  }

  get title(): string {
    return this.extractString(this.heading);
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
      .filter(not(prop("done")))
      .map(prop("id"));
  }

  get blockedBy(): Readonly<TaskId<PI>[]> {
    if (this.done) {
      return [];
    }
    return this.doAfter
      .map(this.getTaskLookuper())
      .filter(this.isTask)
      .filter(not(prop("done")))
      .map(prop("id"));
  }

  /**
   * Extracts a {@link Task} from the given {@link Heading}.
   *
   * @param projectId The {@link ProjectId} to expect in {@link TaskId}s.
   * @param heading The heading to extract a task from.
   * @param surroundingAst The nodes that follow the
   * given heading, until the next heading on the same level.
   * @param getTaskLookuper A function that returns a {@link TaskLookuper} for
   * the given {@link ProjectId}.
   * @returns The extracted task, or `undefined` if the given heading does not
   * define a task.
   * @see {@link transformHeading}
   */
  static create<PI extends ProjectId>(
    projectId: PI,
    heading: Heading,
    surroundingAst: Nodes|RootContent[],
    getTaskLookuper: Getter<TaskLookuper<PI>>,
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
      getTaskLookuper,
    );
  }

  /**
   * Finds the first sub-heading that matches the given regular expression.
   * @param subHeadingRegex The regular expression to match a sub-heading against.
   * @returns The first sub-heading that matches the given regular expression,
   * or `undefined` if no sub-heading matches the given regular expression.
   */
  private findSubHeading(
    subHeadingRegex: RegExp,
  ): WithFirstChildText<Heading> | undefined {
    const subHeadingPredicate = (subHeading: WithFirstChildText<Heading>) =>
      subHeadingRegex.test(this.extractString(subHeading));
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

/**
 * Implementation of {@link Task} that is backed by a {@link ListItem} and the
 * surrounding abstract syntax tree.
 */
export class TaskBackedByListItemAndSurroundingAst<PI extends ProjectId>
  implements Task<PI> {
    private readonly extractTaskId: ExtractTaskId<PI>;
    private readonly extractString: (
      headingOrListItem: WithFirstChildText<Heading|ListItem>,
    ) => string;
    private readonly isTask: TypeGuard<Task<PI>>;
    private constructor(
      private readonly projectId: PI,
      private readonly listItem: WithFirstChildText<ListItem>,
      private readonly surroundingAst: Nodes|RootContent[],
      private readonly getTaskLookuper: Getter<TaskLookuper<PI>>,
    ) {
      this.extractTaskId = createExtractTaskId(this.projectId);
      this.extractString = createExtractString(this.projectId);
      this.isTask = createIsTask(this.projectId);
    }

    get id(): Readonly<TaskId<PI>> {
      return this.extractTaskId(this.listItem.children[0])!;
    }

    get title(): string {
      return this.extractString(this.listItem);
    }

    static create<PI extends ProjectId>(
      projectId: PI,
      listItem: ListItem,
      surroundingAst: Nodes | RootContent[],
      getTaskLookuper: Getter<TaskLookuper<PI>>,
    ): Task<PI> | undefined {
      if (listItem.children.length === 0) {
        // if list item has no children, there is no task
        return undefined;
      }

      if (!isWithFirstChildText(listItem)) {
        // if list item doesn't start with text, there is no task
        return undefined;
      }

      const startsWithABoxAndTaskId: TextTypeGuard<
        StringStartingWith<BoxAndTaskId<PI>>
      > = startsWithA(
        createBoxAndTaskIdRegex(projectId),
      );

      const text: Text = listItem.children[0];
      if (!startsWithABoxAndTaskId(text)) {
        // if list item doesn't have both box and proper task id, there is no task here
        return undefined;
      }

      const extractTaskId = createExtractTaskId(projectId);
      const taskId = extractTaskId(text);
      if (taskId === undefined) {
        // if task id is not valid, there is no task here
        return undefined;
      }
      return new TaskBackedByListItemAndSurroundingAst(
        projectId,
        listItem,
        surroundingAst,
        getTaskLookuper,
      );
    }

    get description(): Promise<string | undefined> {
      const immediatelyFollowingParagraphString: string | undefined =
        extractImmediatelyFollowingParagraphString(
          this.listItem,
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

  }

/**
 * Creates a type guard for {@link Task}.
 * @param projectId The {@link ProjectId} to expect in {@link TaskId}s.
 * @returns A type guard for {@link Task}.
 */
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
export async function wrapInProxy<PI extends ProjectId>(
  projectId: PI,
  outputCommands: DeleteOrWriteFile[],
): Promise<TasksById<PI>> {
  const tasksById: TasksById<PI> = {} as TasksById<PI>;
  const taskLookuper: TaskLookuper<PI> = (taskId: TaskId<PI>) =>
    tasksById[taskId];
  extractTasoutputCommands.filter(isWriteFile)) {
    const topLevelHeading = extractFirstTopLevelHeading(writeFile.ast);
    if (topLevelHeading === undefined) {
      continue;
    }
    const checked = extractBoxChecked(topLevelHeading);
    if (checked === undefined) {
      continue;
    }
    const task: Task<PI> | undefined = TaskBackedByHeadingAndSurroundingAst
      .create(
        projectId,
        topLevelHeading,
        writeFile.ast,
        () => taskLookuper,
      );
    if (task !== undefined) {
      tasksById[task.id] = task;
    }
  }
  return tasksById;
}

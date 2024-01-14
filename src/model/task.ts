import { ProjectId } from "./project-id.ts";
import { TaskId } from "./task-id.ts";

export interface Task<
  PI extends ProjectId = ProjectId,
> {
  /** unique identifier of task, ex `TODO-1` */
  id: TaskId<PI>;
  /** title of task, from heading or list item */
  title: string;
  /** description of task, from paragraph immediately following title */
  description?: string;
  /** relative path to file where it's defined */
  path: string;
  /** do this task after these other tasks */
  doAfter: TaskId<PI>[];
  /** do this task before these other tasks */
  doBefore: TaskId<PI>[];
  /** includes these other tasks. when all are done, this task is done */
  includes: TaskId<PI>[];

  // dynamically calculated
  /** all prerequisites are done */
  readyToStart: Readonly<boolean>;
  /** this task is being worked on */
  inProgress: Readonly<boolean>;
  /** this task is done */
  done: Readonly<boolean>;
  /** these tasks are not `readyToStart`, because this task is not done */
  blocks: Readonly<TaskId<PI>[]>;
  /** this task is not `readyToStart`, because these tasks are not done */
  blockedBy: Readonly<TaskId<PI>[]>;
}

import { Parent } from "npm:@types/mdast";

export type Children = Parent["children"];
export type Child = Children[number];
export type ChildrenAccumulator = {
  newChildren: Children;
  isInsideComment: boolean;
};

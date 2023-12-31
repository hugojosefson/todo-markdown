import { and } from "../fn.ts";
import { isString } from "../strings/is-string.ts";
import {
  containsA,
  isOnly,
  isOnlyA,
  TextTypeGuard,
  TextTypeGuardContaining,
} from "../strings/text-type-guard.ts";
import { TypeGuard } from "./type-guard.ts";

/**
 * The ID of a project, which is a string of 2-5 uppercase letters.
 */
export type ProjectId = string;

/** Regex for matching a project ID, capturing it as a group named "projectId" */
export const PROJECT_ID_REGEX = /(?<projectId>[A-Z]{2,5})/u;
export const isAProjectId: TextTypeGuard<ProjectId> = isOnlyA<ProjectId>(
  PROJECT_ID_REGEX,
);
export const isProjectId: TypeGuard<ProjectId> = and(
  isString,
  isOnly(PROJECT_ID_REGEX),
) as TypeGuard<ProjectId>;

/**
 * A {@link TextTypeGuardContaining} for a {@link ProjectId}.
 */
export const containsAProjectId: TextTypeGuardContaining<ProjectId> = containsA<
  ProjectId
>(PROJECT_ID_REGEX);

import {
  containsA,
  isOnlyA,
  TextTypeGuard,
  TextTypeGuardContaining,
} from "../strings/text-type-guard.ts";

/**
 * The ID of a project, which is a string of 2-5 uppercase letters.
 */
export type ProjectId = string;

/** Regex for matching a project ID, capturing it as a group named "projectId" */
export const PROJECT_ID_REGEX = /(?<projectId>[A-Z]{2,5})/u;
export const isProjectId: TextTypeGuard<ProjectId> = isOnlyA<ProjectId>(
  PROJECT_ID_REGEX,
);
export const containsProjectId: TextTypeGuardContaining<ProjectId> = containsA<
  ProjectId
>(PROJECT_ID_REGEX);

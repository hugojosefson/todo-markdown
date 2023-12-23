import { containsA, isA, TypeGuard, TypeGuardContaining } from "../regex.ts";

export type ProjectId = string;

/** Regex for matching a project ID, capturing it as a group named "projectId" */
export const PROJECT_ID_REGEX = /(?<projectId>[A-Z]{2,5})/u;
export const isProjectId: TypeGuard<ProjectId> = isA<ProjectId>(
  PROJECT_ID_REGEX,
);
export const containsProjectId: TypeGuardContaining<ProjectId> = containsA<
  ProjectId
>(PROJECT_ID_REGEX);

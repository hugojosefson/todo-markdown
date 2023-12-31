import { createIsRecordWithProperty } from "./record.ts";
import { isProjectId, ProjectId } from "./project-id.ts";
import { TypeGuard } from "./type-guard.ts";

/**
 * An object that has a {@link ProjectId}.
 */
export type WithProjectId<PI extends ProjectId> = Record<
  "projectId",
  PI
>;

/**
 * Type guard for {@link WithProjectId}`<ProjectId>`.
 * @param value The value to check.
 */
export const isWithProjectId: TypeGuard<WithProjectId<ProjectId>> =
  createIsRecordWithProperty(
    "projectId",
    isProjectId,
  );

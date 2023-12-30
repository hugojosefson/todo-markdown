import { transformInputDirectoryToOutputCommands as _transformInputDirectoryToOutputCommands } from "../ast/transform-input-directory-to-output-commands.ts";
import { and, or } from "../fn.ts";
import { isString } from "../strings/is-string.ts";
import { InputAsts, isInputAsts } from "./input-asts.ts";
import { Inputs, isInputs } from "./inputs.ts";
import { createIsRecordWithProperty } from "./record.ts";
import { DeleteOrWriteFile, OutputCommand } from "./output-command.ts";
import { ProjectId } from "./project-id.ts";
import { TypeGuard } from "./type-guard.ts";
import { isWithProjectId, WithProjectId } from "./with-project-id.ts";

/**
 * The data that each {@link Pipeline} receives as input, and passes on as output.
 * @TODO Refactor {@link _transformInputDirectoryToOutputCommands} into a pipeline of functions.
 * @TODO Refactor existing code into functions in the pipeline.
 */
export type Data<PI extends ProjectId = ProjectId> =
  & WithProjectId<PI>
  & {
    baseDirectory: string;
    inputAsts: InputAsts;
    inputs: Inputs;
    outputCommands: OutputCommand[];
  };

/**
 * A function in a {@link PipelineStartToEnd}, that transforms {@link Data} into {@link Data}. These can be chained and
 * composed.
 */
export type Pipeline<PI extends ProjectId> = (input: Data<PI>) => Data<PI>;
export type PipelineInputFromDirectory<PI extends ProjectId> =
  & WithProjectId<PI>
  & {
    directory: string;
  };
export type PipelineInputFromInputs<PI extends ProjectId> =
  & WithProjectId<PI>
  & {
    inputs: Inputs;
  };

export type PipelineInputFromInputAsts<PI extends ProjectId> =
  & WithProjectId<PI>
  & {
    inputAsts: InputAsts;
  };

export const isPipelineInputFromDirectory = and(
  isWithProjectId,
  createIsRecordWithProperty(
    "directory",
    isString,
  ),
) as TypeGuard<PipelineInputFromDirectory<ProjectId>>;

export const isPipelineInputFromInputs = and(
  isWithProjectId,
  createIsRecordWithProperty(
    "inputs",
    isInputs,
  ),
) as TypeGuard<PipelineInputFromInputs<ProjectId>>;

export const isPipelineInputFromInputAsts = and(
  isWithProjectId,
  createIsRecordWithProperty(
    "inputAsts",
    isInputAsts,
  ),
) as TypeGuard<PipelineInputFromInputAsts<ProjectId>>;

/**
 * The input that a {@link PipelineStarter} receives as input, to start the {@link PipelineStartToEnd}.
 */
export type PipelineInput<PI extends ProjectId> =
  | PipelineInputFromDirectory<PI>
  | PipelineInputFromInputs<PI>
  | PipelineInputFromInputAsts<PI>;

export const isPipelineInput: <PI extends ProjectId>(
  input: unknown,
) => input is PipelineInput<PI> = or(
  isPipelineInputFromDirectory,
  isPipelineInputFromInputs,
  isPipelineInputFromInputAsts,
) as <PI extends ProjectId>(input: unknown) => input is PipelineInput<PI>;

/**
 * The expected output of a {@link PipelineEnder} and {@link PipelineStartToEnd}.
 */
export type PipelineOutput = {
  outputCommands: DeleteOrWriteFile[];
};

/**
 * The first function in a {@link PipelineStartToEnd}.
 */
export type PipelineStarter<PI extends ProjectId> = (
  input: PipelineInput<PI>,
) => Data<PI>;

/**
 * The last function in a {@link PipelineStartToEnd}.
 */
export type PipelineEnder = (input: Data) => PipelineOutput;

/**
 * A pipeline of functions that transform input data into output data.
 */
export type PipelineStartToEnd<PI extends ProjectId> = (
  input: PipelineInput<PI>,
) => PipelineOutput;

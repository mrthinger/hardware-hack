"""Request and response models for run resources."""
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional, Literal

from opentrons.protocol_engine import (
    CommandStatus,
    CommandIntent,
    CommandType,
    CommandParams,
    EngineStatus as RunStatus,
    ErrorOccurrence,
    LoadedPipette,
    LoadedLabware,
    LoadedModule,
    LabwareOffset,
    LabwareOffsetCreate,
    Liquid,
    CommandNote,
)
from opentrons.protocol_engine.types import RunTimeParameter, RunTimeParamValuesType
from opentrons_shared_data.errors import GeneralError
from robot_server.service.json_api import ResourceModel
from robot_server.errors.error_responses import ErrorDetails
from .action_models import RunAction


class RunDataError(ErrorDetails):
    """A model for an error loading a run."""

    title: str = Field(
        "Run Data Error",
        description="A short, human readable name for this type of error",
    )
    id: Literal["RunDataError"] = "RunDataError"


# TODO(mc, 2022-02-01): since the `/runs/:run_id/commands` response is now paginated,
# this summary model is a lot less useful. Remove and replace with full `Command`
# models once problematically large objects like full labware and module definitions
# are no longer part of the public command.result API
class RunCommandSummary(ResourceModel):
    """A stripped down model of a full Command for usage in a Run response."""

    id: str = Field(..., description="Unique command identifier.")
    key: str = Field(
        ...,
        description="An identifier representing this command as a step in a protocol.",
    )
    commandType: CommandType = Field(..., description="Specific type of command.")
    createdAt: datetime = Field(..., description="Command creation timestamp")
    startedAt: Optional[datetime] = Field(
        None,
        description="Command execution start timestamp, if started",
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Command execution completed timestamp, if completed",
    )
    status: CommandStatus = Field(..., description="Execution status of the command.")
    error: Optional[ErrorOccurrence] = Field(
        None,
        description="Error occurrence, if status is 'failed'",
    )
    # TODO(mc, 2022-02-01): this does not allow the command summary object to
    # be narrowed based on `commandType`. Will be resolved by TODO above
    params: CommandParams = Field(..., description="Command execution parameters.")
    intent: Optional[CommandIntent] = Field(
        None,
        description="Why this command was added to the run.",
    )
    notes: Optional[List[CommandNote]] = Field(
        None,
        description="Notes pertaining to this command.",
    )
    failedCommandId: Optional[str] = Field(
        None,
        description=(
            "FIXIT command use only. Reference of the failed command id we are trying to fix."
        ),
    )


class Run(ResourceModel):
    """Run resource model."""

    ok: Literal[True] = True
    id: str = Field(..., description="Unique run identifier.")
    createdAt: datetime = Field(..., description="When the run was created")
    status: RunStatus = Field(..., description="Execution status of the run")
    current: bool = Field(
        ...,
        description=(
            "Whether this run is currently controlling the robot."
            " There can be, at most, one current run."
        ),
    )
    actions: List[RunAction] = Field(
        ...,
        description="Client-initiated run control actions, ordered oldest to newest.",
    )
    errors: List[ErrorOccurrence] = Field(
        ...,
        description=(
            "The run's fatal error, if there was one."
            " For historical reasons, this is an array,"
            " but it won't have more than one element."
        ),
    )
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes that have been loaded into the run.",
    )
    modules: List[LoadedModule] = Field(
        ...,
        description="Modules that have been loaded into the run.",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware that has been loaded into the run.",
    )
    liquids: List[Liquid] = Field(
        ...,
        description="Liquids loaded to the run.",
    )
    labwareOffsets: List[LabwareOffset] = Field(
        ...,
        description="Labware offsets to apply as labware are loaded.",
    )
    runTimeParameters: List[RunTimeParameter] = Field(
        default_factory=list,
        description=(
            "Run time parameters used during the run."
            " These are the parameters that are defined in the protocol, with values"
            " specified either in the run creation request or default values from the protocol"
            " if none are specified in the request."
        ),
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Run completed at timestamp.",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Run started at timestamp.",
    )


class BadRun(ResourceModel):
    """Resource model representation for a bad run that could not be loaded."""

    ok: Literal[False] = False
    dataError: RunDataError = Field(..., description="Error from loading the data.")
    id: str = Field(..., description="Unique run identifier.")
    createdAt: datetime = Field(..., description="When the run was created")
    status: RunStatus = Field(..., description="Execution status of the run")
    current: bool = Field(
        ...,
        description=(
            "Whether this run is currently controlling the robot."
            " There can be, at most, one current run."
        ),
    )
    actions: List[RunAction] = Field(
        ...,
        description="Client-initiated run control actions, ordered oldest to newest. If these could not be loaded for this bad run, this will be null.",
    )
    errors: List[ErrorOccurrence] = Field(
        ...,
        description=(
            "The run's fatal error, if there was one."
            " For historical reasons, this is an array,"
            " but it won't have more than one element."
        ),
    )
    pipettes: List[LoadedPipette] = Field(
        ...,
        description="Pipettes that have been loaded into the run.",
    )
    modules: List[LoadedModule] = Field(
        ...,
        description="Modules that have been loaded into the run.",
    )
    labware: List[LoadedLabware] = Field(
        ...,
        description="Labware that has been loaded into the run.",
    )
    liquids: List[Liquid] = Field(
        ...,
        description="Liquids loaded to the run.",
    )
    labwareOffsets: List[LabwareOffset] = Field(
        ...,
        description="Labware offsets to apply as labware are loaded.",
    )
    runTimeParameters: List[RunTimeParameter] = Field(
        default_factory=list,
        description=(
            "Run time parameters used during the run."
            " These are the parameters that are defined in the protocol, with values"
            " specified either in the run creation request or default values from the protocol"
            " if none are specified in the request."
        ),
    )
    protocolId: Optional[str] = Field(
        None,
        description=(
            "Protocol resource being run, if any. If not present, the run may"
            " still be used to execute protocol commands over HTTP."
        ),
    )
    completedAt: Optional[datetime] = Field(
        None,
        description="Run completed at timestamp.",
    )
    startedAt: Optional[datetime] = Field(
        None,
        description="Run started at timestamp.",
    )


class RunCreate(BaseModel):
    """Create request data for a new run."""

    protocolId: Optional[str] = Field(
        None,
        description="Protocol resource ID that this run will be using, if applicable.",
    )
    labwareOffsets: List[LabwareOffsetCreate] = Field(
        default_factory=list,
        description="Labware offsets to apply as labware are loaded.",
    )
    runTimeParameterValues: Optional[RunTimeParamValuesType] = Field(
        None,
        description="Key-value pairs of run-time parameters defined in a protocol.",
    )


class RunUpdate(BaseModel):
    """Update request data for an existing run."""

    current: Optional[bool] = Field(
        None,
        description=(
            "Whether this run is currently controlling the robot."
            " Setting `current` to `false` will deactivate the run."
        ),
    )


class LabwareDefinitionSummary(BaseModel):
    """Summary of data about a created labware definition."""

    definitionUri: str = Field(
        ...,
        description="The definition's unique resource identifier in the run.",
    )


class RunNotFoundError(GeneralError):
    """Error raised when a given Run ID is not found in the store."""

    def __init__(self, run_id: str) -> None:
        """Initialize the error message from the missing ID."""
        super().__init__(
            message=f"Run {run_id} was not found.", detail={"runId": run_id}
        )

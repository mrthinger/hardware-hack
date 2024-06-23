"""Tests for `opentrons.simulate`."""

from __future__ import annotations
import io
import json
import textwrap
from pathlib import Path
from typing import TYPE_CHECKING, Callable, Generator, List, TextIO, cast

import pytest
from _pytest.fixtures import SubRequest

from opentrons_shared_data import get_shared_data_root, load_shared_data

from opentrons import simulate, protocols
from opentrons.protocol_api.core.engine import ENGINE_CORE_API_VERSION
from opentrons.protocols.types import ApiDeprecationError
from opentrons.protocols.api_support.types import APIVersion
from opentrons.protocols.execution.errors import ExceptionInProtocolError
from opentrons.util import entrypoint_util

if TYPE_CHECKING:
    from tests.opentrons.conftest import Bundle, Protocol


HERE = Path(__file__).parent


@pytest.fixture(params=[APIVersion(2, 0), ENGINE_CORE_API_VERSION])
def api_version(request: SubRequest) -> APIVersion:
    """Return an API version to test with.

    Newer API versions execute through Protocol Engine, and older API versions don't.
    The two codepaths are very different, so we need to test them both.
    """
    return cast(APIVersion, request.param)


@pytest.mark.parametrize(
    "protocol_file",
    [
        "testosaur_v2.py",
        pytest.param(
            "testosaur_v2_14.py",
            marks=pytest.mark.xfail(
                strict=True,
                reason=(
                    "We can't currently get bundle contents"
                    " from protocols run through Protocol Engine."
                ),
            ),
        ),
    ],
)
def test_simulate_function_apiv2_bundle(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that `simulate()` returns the expected bundle contents from a Python file."""
    monkeypatch.setenv("OT_API_FF_allowBundleCreation", "1")
    _, bundle_contents = simulate.simulate(protocol.filelike, protocol.filename)
    assert isinstance(bundle_contents, protocols.types.BundleContents)


@pytest.mark.parametrize("protocol_file", ["testosaur_v2.py", "testosaur_v2_14.py"])
def test_simulate_without_filename(protocol: Protocol, protocol_file: str) -> None:
    """`simulate()` should accept a protocol without a filename."""
    simulate.simulate(protocol.filelike)  # Should not raise.


@pytest.mark.parametrize(
    ("protocol_file", "expected_entries"),
    [
        (
            "testosaur_v2.py",
            [
                "Picking up tip from A1 of Opentrons OT-2 96 Tip Rack 1000 µL on 1",
                "Aspirating 100.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on 2 at 500.0 uL/sec",
                "Dispensing 100.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on 2 at 1000.0 uL/sec",
                "Dropping tip into H12 of Opentrons OT-2 96 Tip Rack 1000 µL on 1",
            ],
        ),
        (
            "testosaur_v2_14.py",
            [
                "Picking up tip from A1 of Opentrons OT-2 96 Tip Rack 1000 µL on slot 1",
                "Aspirating 100.0 uL from A1 of Corning 96 Well Plate 360 µL Flat on slot 2 at 500.0 uL/sec",
                "Dispensing 100.0 uL into B1 of Corning 96 Well Plate 360 µL Flat on slot 2 at 1000.0 uL/sec",
                "Dropping tip into H12 of Opentrons OT-2 96 Tip Rack 1000 µL on slot 1",
            ],
        ),
        (
            "ot2_drop_tip.py",
            [
                "Picking up tip from A1 of Opentrons OT-2 96 Tip Rack 300 µL on slot 5",
                "Dropping tip into Trash Bin on slot 12",
            ],
        ),
    ],
)
def test_simulate_function_apiv2_run_log(
    protocol: Protocol,
    protocol_file: str,
    expected_entries: List[str],
) -> None:
    """Test that `simulate()` returns the expected run log from a Python file."""
    run_log, _ = simulate.simulate(protocol.filelike, protocol.filename)
    assert [item["payload"]["text"] for item in run_log] == expected_entries


def test_simulate_function_json(
    get_json_protocol_fixture: Callable[[str, str, bool], str]
) -> None:
    """Test `simulate()` with a JSON file."""
    jp = get_json_protocol_fixture("3", "simple", False)
    filelike = io.StringIO(jp)
    runlog, bundle = simulate.simulate(filelike, "simple.json")
    assert bundle is None
    assert [item["payload"]["text"] for item in runlog] == [
        "Picking up tip from B1 of Opentrons 96 Tip Rack 10 µL on 1",
        "Aspirating 5.0 uL from A1 of Source Plate on 2 at 3.0 uL/sec",
        "Delaying for 0 minutes and 42.0 seconds",
        "Dispensing 4.5 uL into B1 of Dest Plate on 3 at 2.5 uL/sec",
        "Touching tip",
        "Blowing out at B1 of Dest Plate on 3",
        "Moving to 5",
        "Dropping tip into A1 of Trash on 12",
    ]


def test_simulate_function_bundle_apiv2(
    get_bundle_fixture: Callable[[str], Bundle]
) -> None:
    """Test `simulate()` with a .zip bundle."""
    bundle_fixture = get_bundle_fixture("simple_bundle")
    runlog, bundle = simulate.simulate(
        cast(TextIO, bundle_fixture["filelike"]),
        "simple_bundle.zip",
    )
    assert bundle is None
    assert [item["payload"]["text"] for item in runlog] == [
        "Transferring 1.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from A1 of Opentrons OT-2 96 Tip Rack 10 µL on 3",
        "Aspirating 1.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 1.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
        "Transferring 2.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from B1 of Opentrons OT-2 96 Tip Rack 10 µL on 3",
        "Aspirating 2.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 2.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
        "Transferring 3.0 from A1 of FAKE example labware on 1 to A4 of FAKE example labware on 1",
        "Picking up tip from C1 of Opentrons OT-2 96 Tip Rack 10 µL on 3",
        "Aspirating 3.0 uL from A1 of FAKE example labware on 1 at 5.0 uL/sec",
        "Dispensing 3.0 uL into A4 of FAKE example labware on 1 at" " 10.0 uL/sec",
        "Dropping tip into A1 of Opentrons Fixed Trash on 12",
    ]


@pytest.mark.parametrize("protocol_file", ["testosaur.py"])
def test_simulate_function_v1(protocol: Protocol, protocol_file: str) -> None:
    """Test `simulate()` with an obsolete Python file."""
    with pytest.raises(ApiDeprecationError):
        simulate.simulate(protocol.filelike, "testosaur.py")


@pytest.mark.parametrize("protocol_file", ["bug_aspirate_tip.py"])
def test_simulate_aspirate_tip(
    protocol: Protocol,
    protocol_file: str,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Integration test for https://github.com/opentrons/opentrons/issues/7552."""
    with pytest.raises(ExceptionInProtocolError):
        simulate.simulate(protocol.filelike, "bug_aspirate_tip.py")


class TestSimulatePythonLabware:
    """Tests for making sure simulate() handles custom labware correctly for Python files."""

    LW_DIR = get_shared_data_root() / "labware" / "fixtures" / "2"
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

    @pytest.fixture
    def protocol_path(self, tmp_path: Path, api_version: APIVersion) -> Path:
        """Return a path to a Python protocol file that loads a custom labware."""
        path = tmp_path / "protocol.py"
        protocol_source = textwrap.dedent(
            f"""\
            metadata = {{"apiLevel": "{api_version}"}}
            def run(protocol):
                protocol.load_labware(
                    load_name="{self.LW_LOAD_NAME}",
                    location=1,
                    namespace="{self.LW_NAMESPACE}",
                )
            """
        )
        path.write_text(protocol_source)
        return path

    @pytest.fixture
    def file_name(self, protocol_path: Path) -> str:
        """Return the file name of the Python protocol file."""
        return protocol_path.name

    @pytest.fixture
    def protocol_filelike(self, protocol_path: Path) -> Generator[TextIO, None, None]:
        """Return the Python protocol file opened as a stream."""
        with open(protocol_path) as file:
            yield file

    @staticmethod
    def test_default_no_custom_labware(
        protocol_filelike: TextIO, file_name: str
    ) -> None:
        """By default, no custom labware should be available."""
        with pytest.raises(Exception, match="Labware .+ not found"):
            simulate.simulate(protocol_file=protocol_filelike, file_name=file_name)

    def test_custom_labware_paths(
        self, protocol_filelike: TextIO, file_name: str
    ) -> None:
        """Providing custom_labware_paths should make those labware available."""
        simulate.simulate(
            protocol_file=protocol_filelike,
            file_name=file_name,
            custom_labware_paths=[str(self.LW_DIR)],
        )

    def test_jupyter(
        self,
        protocol_filelike: TextIO,
        file_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Putting labware in the Jupyter directory should make it available."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR
        )
        simulate.simulate(protocol_file=protocol_filelike, file_name=file_name)

    @pytest.mark.xfail(
        strict=True, raises=pytest.fail.Exception
    )  # TODO(mm, 2023-07-14): Fix this bug.
    def test_jupyter_override(
        self,
        protocol_filelike: TextIO,
        file_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Passing any custom_labware_paths should prevent searching the Jupyter directory."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", self.LW_DIR
        )
        with pytest.raises(Exception, match="Labware .+ not found"):
            simulate.simulate(
                protocol_file=protocol_filelike,
                file_name=file_name,
                custom_labware_paths=[],
            )

    @staticmethod
    def test_jupyter_not_on_filesystem(
        protocol_filelike: TextIO,
        file_name: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with pytest.raises(Exception, match="Labware .+ not found"):
            simulate.simulate(protocol_file=protocol_filelike, file_name=file_name)


def test_get_protocol_api_usable_without_homing(api_version: APIVersion) -> None:
    """You should be able to move the simulated hardware without having to home explicitly.

    https://opentrons.atlassian.net/browse/RQA-1801
    """
    protocol = simulate.get_protocol_api(api_version)
    pipette = protocol.load_instrument("p300_single_gen2", mount="left")
    tip_rack = protocol.load_labware("opentrons_96_tiprack_300ul", 1)
    pipette.pick_up_tip(tip_rack["A1"])  # Should not raise.


class TestGetProtocolAPILabware:
    """Tests for making sure get_protocol_api() handles extra labware correctly."""

    LW_FIXTURE_DIR = Path("labware/fixtures/2")
    LW_LOAD_NAME = "fixture_12_trough"
    LW_NAMESPACE = "fixture"

    def test_default_no_extra_labware(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """By default, no extra labware should be available."""
        context = simulate.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            context.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

    def test_extra_labware(self, api_version: APIVersion) -> None:
        """Providing extra_labware should make that labware available."""
        explicit_extra_lw = {
            self.LW_LOAD_NAME: json.loads(
                load_shared_data(self.LW_FIXTURE_DIR / f"{self.LW_LOAD_NAME}.json")
            )
        }
        context = simulate.get_protocol_api(
            api_version, extra_labware=explicit_extra_lw
        )
        assert context.load_labware(
            load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
        )

    def test_jupyter(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Putting labware in the Jupyter directory should make it available."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = simulate.get_protocol_api(api_version)
        assert context.load_labware(
            load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
        )

    def test_jupyter_override(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Passing any extra_labware should prevent searching the Jupyter directory."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util,
            "JUPYTER_NOTEBOOK_LABWARE_DIR",
            get_shared_data_root() / self.LW_FIXTURE_DIR,
        )
        context = simulate.get_protocol_api(api_version, extra_labware={})
        with pytest.raises(Exception, match="Labware .+ not found"):
            context.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

    def test_jupyter_not_on_filesystem(
        self, api_version: APIVersion, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """It should tolerate the Jupyter labware directory not existing on the filesystem."""
        # TODO(mm, 2023-10-06): This is monkeypatching a dependency of a dependency,
        # which is too deep.
        monkeypatch.setattr(entrypoint_util, "IS_ROBOT", True)
        monkeypatch.setattr(
            entrypoint_util, "JUPYTER_NOTEBOOK_LABWARE_DIR", HERE / "nosuchdirectory"
        )
        with_nonexistent_jupyter_extra_labware = simulate.get_protocol_api(api_version)
        with pytest.raises(Exception, match="Labware .+ not found"):
            with_nonexistent_jupyter_extra_labware.load_labware(
                load_name=self.LW_LOAD_NAME, location=1, namespace=self.LW_NAMESPACE
            )

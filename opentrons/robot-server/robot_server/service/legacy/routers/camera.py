import logging
import os
import io
import tempfile
from pathlib import Path

from fastapi import APIRouter, HTTPException
from starlette import status
from starlette.background import BackgroundTask
from starlette.responses import StreamingResponse
from opentrons.system import camera


log = logging.getLogger(__name__)

router = APIRouter()

JPG = "image/jpg"


@router.post(
    "/camera/picture",
    description="Capture an image from the OT-2's on-board camera " "and return it",
    responses={status.HTTP_200_OK: {"content": {JPG: {}}, "description": "The image"}},
)
async def post_picture_capture() -> StreamingResponse:
    """Take a picture"""
    filename = Path(tempfile.mktemp(suffix=".jpg"))

    try:
        await camera.take_picture(filename)
        log.info(f"Image taken at {filename}")
        # Open the file. It will be closed and deleted when the response is
        # finished.
        fd = filename.open("rb")
        return StreamingResponse(
            fd,
            media_type=JPG,
            background=BackgroundTask(func=_cleanup, filename=filename, fd=fd),
        )
    except camera.CameraException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )


def _cleanup(filename: Path, fd: io.IOBase) -> None:
    """Clean up after sending the response"""
    try:
        log.info(f"Closing and deleting image at {filename}")
        fd.close()
        os.remove(filename)
    except OSError:
        pass

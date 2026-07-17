Place the offline FFmpeg Windows executable here:

    bin/ffmpeg/ffmpeg.exe

The Silence Detect tool first checks this bundled path, then falls back to `ffmpeg`
from the system PATH. Keeping `ffmpeg.exe` in this folder makes the extension run
offline for customers without asking them to install FFmpeg separately.

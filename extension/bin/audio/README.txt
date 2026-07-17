Keshav Velo Audio AI runtime

Files in this folder:
- onnx_vocal_runner.py: local ONNX vocal-separation runner used by the extension.
- requirements.txt: Python 3.11 dependencies for ONNX + Demucs fallback.
- setup_audio_ai.ps1: setup helper for customer machines.
- models/: put licensed ONNX models here for portable commercial builds.

Commercial packaging checklist:
- Bundle bin/ffmpeg/ffmpeg.exe.
- Bundle this bin/audio folder.
- Bundle only models you have redistribution rights for.
- Run bin/audio/setup_audio_ai.ps1 on the customer machine, or ship a prebuilt runtime that satisfies requirements.txt.

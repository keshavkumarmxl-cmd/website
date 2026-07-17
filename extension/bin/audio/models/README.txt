Place the licensed vocal-separation ONNX model for commercial builds here.

Expected filenames:
- vocalseperate_fp32.onnx
- or vocal_separation.onnx

Important:
- Do not bundle HitPaw proprietary files unless you have explicit redistribution rights.
- For development only, set KWV_ALLOW_HITPAW_REFERENCE=1 to let the extension reference an installed HitPaw model on your own machine.
- If no local ONNX model is present, the extension falls back to Demucs when Python/Demucs is installed.

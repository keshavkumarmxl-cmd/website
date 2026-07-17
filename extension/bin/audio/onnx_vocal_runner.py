import argparse
import os
import sys

import librosa
import numpy as np
import onnxruntime as ort
import soundfile as sf


SAMPLE_RATE = 44100
N_FFT = 4096
HOP_LENGTH = 1024
WIN_LENGTH = 4096
N_BINS = 1024
N_FRAMES = 512


def progress(value, label):
    print("PROGRESS {0} {1}".format(int(value), label), flush=True)


def load_audio(path):
    audio, sr = librosa.load(path, sr=SAMPLE_RATE, mono=False)
    if audio.ndim == 1:
        audio = np.stack([audio, audio], axis=0)
    elif audio.shape[0] > 2:
        audio = audio[:2]
    if audio.shape[0] == 1:
        audio = np.vstack([audio, audio])
    return audio.astype(np.float32)


def stereo_stft(audio):
    specs = []
    phases = []
    for channel in range(2):
        spec = librosa.stft(
            audio[channel],
            n_fft=N_FFT,
            hop_length=HOP_LENGTH,
            win_length=WIN_LENGTH,
            window="hann",
            center=True,
        )
        specs.append(spec)
        phases.append(np.exp(1j * np.angle(spec)))
    spec = np.stack(specs, axis=-1)
    phase = np.stack(phases, axis=-1)
    return spec, phase


def run_model(session, mag):
    total_frames = mag.shape[1]
    vocal = np.zeros_like(mag, dtype=np.float32)
    music = np.zeros_like(mag, dtype=np.float32)
    weight = np.zeros((mag.shape[0], total_frames, mag.shape[2]), dtype=np.float32)
    starts = list(range(0, max(1, total_frames), N_FRAMES // 2))
    if starts and starts[-1] + N_FRAMES < total_frames:
        starts.append(total_frames - N_FRAMES)
    input_name = session.get_inputs()[0].name

    for index, start in enumerate(starts):
        start = max(0, min(start, max(0, total_frames - N_FRAMES)))
        chunk = mag[:, start:start + N_FRAMES, :]
        if chunk.shape[1] < N_FRAMES:
            chunk = np.pad(chunk, ((0, 0), (0, N_FRAMES - chunk.shape[1]), (0, 0)))
        tensor = np.transpose(chunk, (1, 0, 2))[None, ...].astype(np.float32)
        outputs = session.run(None, {input_name: tensor})
        out_vocal = np.transpose(outputs[0][0], (1, 0, 2)).astype(np.float32)
        out_music = np.transpose(outputs[1][0], (1, 0, 2)).astype(np.float32)
        end = min(start + N_FRAMES, total_frames)
        usable = end - start
        vocal[:, start:end, :] += out_vocal[:, :usable, :]
        music[:, start:end, :] += out_music[:, :usable, :]
        weight[:, start:end, :] += 1.0
        progress(20 + (index + 1) * 65 / max(1, len(starts)), "separating")

    weight = np.maximum(weight, 1.0)
    return vocal / weight, music / weight


def istft_from_mag(mag, phase, length):
    channels = []
    full_bins = phase.shape[0]
    for channel in range(2):
        full_mag = np.zeros((full_bins, mag.shape[1]), dtype=np.float32)
        full_mag[:N_BINS] = mag[:, :, channel]
        complex_spec = full_mag * phase[:, :mag.shape[1], channel]
        audio = librosa.istft(
            complex_spec,
            hop_length=HOP_LENGTH,
            win_length=WIN_LENGTH,
            window="hann",
            center=True,
            length=length,
        )
        channels.append(audio)
    return np.stack(channels, axis=1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    if not os.path.exists(args.model):
        raise SystemExit("model not found: " + args.model)
    if not os.path.exists(args.input):
        raise SystemExit("input not found: " + args.input)

    os.makedirs(args.out, exist_ok=True)
    progress(3, "loading")
    audio = load_audio(args.input)
    length = audio.shape[1]
    progress(10, "stft")
    spec, phase = stereo_stft(audio)
    mag = np.abs(spec[:N_BINS]).astype(np.float32)

    progress(16, "model")
    providers = ["CPUExecutionProvider"]
    session = ort.InferenceSession(args.model, providers=providers)
    vocal_mag, music_mag = run_model(session, mag)

    progress(88, "rendering")
    vocal_audio = istft_from_mag(vocal_mag, phase, length)
    music_audio = istft_from_mag(music_mag, phase, length)
    np.clip(vocal_audio, -1.0, 1.0, out=vocal_audio)
    np.clip(music_audio, -1.0, 1.0, out=music_audio)

    vocal_path = os.path.join(args.out, "vocals.wav")
    music_path = os.path.join(args.out, "no_vocals.wav")
    sf.write(vocal_path, vocal_audio, SAMPLE_RATE)
    sf.write(music_path, music_audio, SAMPLE_RATE)
    progress(100, "done")
    print("VOCALS " + vocal_path, flush=True)
    print("MUSIC " + music_path, flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("ERROR " + str(exc), file=sys.stderr, flush=True)
        raise

from __future__ import annotations

import io
import json
import os
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from moviepy import AudioFileClip, CompositeAudioClip, CompositeVideoClip, ImageClip, concatenate_videoclips
from moviepy.video.fx.FadeIn import FadeIn
from moviepy.video.fx.FadeOut import FadeOut


WIDTH = 1080
HEIGHT = 1920
FPS = 30
ACCENT = (123, 164, 255)
WHITE = (245, 248, 255)


@dataclass
class Segment:
    heading: str
    body: str
    caption: str
    duration: float


@dataclass
class VideoSpec:
    slug: str
    title: str
    short_caption: str
    hashtags: str
    narration: str
    segments: list[Segment]


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/Inter-Bold.ttf" if bold else "C:/Windows/Fonts/Inter-Regular.ttf",
        "C:/Windows/Fonts/Montserrat-Bold.ttf" if bold else "C:/Windows/Fonts/Montserrat-Regular.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def _safe_get(url: str, timeout: int = 20) -> bytes | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read()
    except Exception:
        return None


def _download_human_backgrounds(root: Path) -> list[Path]:
    bg_dir = root / "content" / "launch-videos" / "exports-v3" / "bg-cache"
    bg_dir.mkdir(parents=True, exist_ok=True)
    queries = ["person office", "team meeting", "woman laptop"]
    files: list[Path] = []
    for idx, query in enumerate(queries, start=1):
        target = bg_dir / f"human-{idx}.jpg"
        if target.exists() and target.stat().st_size > 0:
            files.append(target)
            continue
        encoded = urllib.parse.quote(query)
        data = _safe_get(f"https://source.unsplash.com/1080x1920/?{encoded}")
        if data:
            target.write_bytes(data)
            files.append(target)
    return files


def _fallback_backgrounds(root: Path) -> list[Path]:
    previews = [
        root / "content" / "launch-videos" / "previews" / "01-intro-who-we-are-preview.png",
        root / "content" / "launch-videos" / "previews" / "02-for-the-people-preview.png",
        root / "content" / "launch-videos" / "previews" / "03-how-it-works-30s-preview.png",
    ]
    return [p for p in previews if p.exists()]


def _build_backdrop_array(bg_path: Path, seed: int) -> np.ndarray:
    image = Image.open(bg_path).convert("RGB").resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
    image = image.filter(ImageFilter.GaussianBlur(radius=2))
    arr = np.array(image).astype(np.float32)

    # Dark overlay for text legibility
    y = np.linspace(0.75, 0.45, HEIGHT, dtype=np.float32)[:, None, None]
    arr = arr * y

    # Add subtle diagonal texture for motion feel
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, 6, size=arr.shape)
    arr = np.clip(arr + noise, 0, 255)

    return arr.astype(np.uint8)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font_obj: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), candidate, font=font_obj)
        if bbox[2] - bbox[0] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_obj: ImageFont.ImageFont,
    x_center: int,
    y_start: int,
    max_width: int,
    line_spacing: int,
    fill: tuple[int, int, int],
) -> int:
    lines = _wrap(draw, text, font_obj, max_width=max_width)
    y = y_start
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font_obj)
        line_w = bbox[2] - bbox[0]
        draw.text((x_center - line_w // 2, y), line, font=font_obj, fill=fill)
        y += (bbox[3] - bbox[1]) + line_spacing
    return y


def _segment_image(bg_path: Path, segment: Segment, idx: int, seg_idx: int) -> np.ndarray:
    image = Image.fromarray(_build_backdrop_array(bg_path, seed=idx * 100 + seg_idx)).convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Frame accents
    d.rectangle([(56, 70), (WIDTH - 56, 84)], fill=(*ACCENT, 220))
    d.rectangle([(56, HEIGHT - 134), (WIDTH - 56, HEIGHT - 120)], fill=(*ACCENT, 220))
    d.rectangle([(56, 120), (70, HEIGHT - 120)], fill=(*ACCENT, 70))
    d.rectangle([(WIDTH - 70, 120), (WIDTH - 56, HEIGHT - 120)], fill=(*ACCENT, 70))

    # Caption panel
    d.rounded_rectangle([(90, HEIGHT - 430), (WIDTH - 90, HEIGHT - 210)], radius=24, fill=(0, 0, 0, 160))
    # Main content panel
    d.rounded_rectangle([(80, 200), (WIDTH - 80, 960)], radius=30, fill=(8, 16, 30, 180), outline=(*ACCENT, 120), width=2)

    image = Image.alpha_composite(image, overlay)
    draw = ImageDraw.Draw(image)

    badge_font = _font(34, bold=True)
    heading_font = _font(62, bold=True)
    body_font = _font(72, bold=True)
    cap_font = _font(48, bold=False)

    badge = f"SETTLED INTRO {idx + 1:02d}"
    bb = draw.textbbox((0, 0), badge, font=badge_font)
    bw = bb[2] - bb[0] + 40
    draw.rounded_rectangle([(74, 94), (74 + bw, 154)], radius=18, fill=(12, 25, 49, 220), outline=(*ACCENT, 220), width=2)
    draw.text((95, 109), badge, font=badge_font, fill=(212, 225, 255))

    y = 260
    y = _draw_block(draw, segment.heading, heading_font, WIDTH // 2, y, WIDTH - 240, 8, ACCENT)
    y += 18
    _draw_block(draw, segment.body, body_font, WIDTH // 2, y, WIDTH - 220, 12, WHITE)
    _draw_block(draw, segment.caption, cap_font, WIDTH // 2, HEIGHT - 380, WIDTH - 240, 8, (231, 237, 248))

    return np.array(image.convert("RGB"))


def _get_default_voice_id(api_key: str) -> tuple[str | None, str]:
    endpoint = "https://api.elevenlabs.io/v1/voices"
    req = urllib.request.Request(
        endpoint,
        headers={
            "accept": "application/json",
            "xi-api-key": api_key,
            "User-Agent": "settled-launch-render/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8", errors="ignore"))
        voices = payload.get("voices", [])
        if not voices:
            return None, "no voices available"

        for voice in voices:
            labels = voice.get("labels", {}) if isinstance(voice.get("labels"), dict) else {}
            if labels.get("use_case") == "narration" and voice.get("voice_id"):
                return str(voice["voice_id"]), "ok"

        fallback = voices[0].get("voice_id")
        if fallback:
            return str(fallback), "ok"
        return None, "voice missing id"
    except urllib.error.HTTPError as error:
        try:
            body = error.read().decode("utf-8", errors="ignore")
        except Exception:
            body = ""
        msg = f"voices_http_{error.code}"
        if body:
            msg += f":{body[:220]}"
        return None, msg
    except Exception as error:
        return None, str(error)


def _tts_elevenlabs(text: str, api_key: str, out_mp3: Path, voice_id: str) -> tuple[bool, str]:
    endpoint = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = json.dumps(
        {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.4, "similarity_boost": 0.75},
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={
            "accept": "audio/mpeg",
            "content-type": "application/json",
            "xi-api-key": api_key,
            "User-Agent": "settled-launch-render/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            audio = response.read()
        if not audio:
            return False, "empty audio response"
        out_mp3.write_bytes(audio)
        return True, "ok"
    except urllib.error.HTTPError as error:
        try:
            body = error.read().decode("utf-8", errors="ignore")
        except Exception:
            body = ""
        msg = f"http_{error.code}"
        if body:
            msg += f":{body[:220]}"
        return False, msg
    except Exception as error:
        return False, str(error)


def _make_silent_audio(duration: float, mp3_path: Path, wav_path: Path) -> None:
    # Generate wav silence first, then transcode to mp3 for compatibility.
    cmd_wav = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "anullsrc=r=48000:cl=mono",
        "-t",
        f"{duration:.3f}",
        str(wav_path),
    ]
    subprocess.run(cmd_wav, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    cmd_mp3 = [
        "ffmpeg",
        "-y",
        "-i",
        str(wav_path),
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "192k",
        str(mp3_path),
    ]
    subprocess.run(cmd_mp3, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def _mp3_to_wav(mp3_path: Path, wav_path: Path) -> None:
    cmd = ["ffmpeg", "-y", "-i", str(mp3_path), str(wav_path)]
    subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def _get_audio_duration(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    output = subprocess.check_output(cmd, text=True).strip()
    return float(output)


def _render_video(
    spec: VideoSpec,
    idx: int,
    backgrounds: list[Path],
    audio_mp3: Path,
    render_mode: Literal["narrated", "silent"],
    out_video: Path,
) -> tuple[float, str]:
    seg_total = sum(segment.duration for segment in spec.segments)
    clips: list[ImageClip] = []
    for seg_idx, segment in enumerate(spec.segments):
        bg = backgrounds[seg_idx % len(backgrounds)]
        frame = _segment_image(bg, segment, idx, seg_idx)
        clip = ImageClip(frame).with_duration(segment.duration).with_fps(FPS).with_effects([FadeIn(0.2), FadeOut(0.2)])
        clips.append(clip)

    video = concatenate_videoclips(clips, method="compose")
    duration = seg_total

    if audio_mp3.exists() and audio_mp3.stat().st_size > 0:
        audio_clip = AudioFileClip(str(audio_mp3))
        duration = min(video.duration, audio_clip.duration)
        video = video.subclipped(0, duration).with_audio(audio_clip.subclipped(0, duration))
    else:
        video = video.subclipped(0, duration)

    video.write_videofile(
        str(out_video),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        bitrate="14M",
        ffmpeg_params=["-pix_fmt", "yuv420p"],
        logger=None,
    )

    # Cleanup
    video.close()
    for clip in clips:
        clip.close()
    return duration, render_mode


def _metadata_file(spec: VideoSpec, dest: Path) -> None:
    text = f"title: {spec.title}\nshort caption: {spec.short_caption}\nhashtags: {spec.hashtags}\n"
    dest.write_text(text, encoding="utf-8")


def _load_env_local(root: Path) -> None:
    env_path = root / ".env.local"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith(("'", '"')) and value.endswith(("'", '"')) and len(value) >= 2:
            value = value[1:-1]
        if key and key not in os.environ:
            os.environ[key] = value


def build_specs() -> list[VideoSpec]:
    return [
        VideoSpec(
            slug="01-intro-who-we-are",
            title="You Are Not Crazy: Reporting Errors Are Real | SETTLED",
            short_caption="If your report looks wrong, start with documented action.",
            hashtags="#credit #studentloans #fcra #creditreporterrors #settledsupport",
            narration=(
                "If your credit, student loan, or business file looks wrong, you are not crazy. "
                "Reporting errors happen, and they can block approvals before you even get a fair look. "
                "SETTLED gives you a clear path: upload securely, review possible reporting issues, and generate a "
                "document-based dispute letter you can check before sending. We are not a law firm. "
                "We do not guarantee outcomes. We do help you move from confusion to documented action. "
                "If that sounds like what you need, follow for practical breakdowns and start with secure intake at settled dot support."
            ),
            segments=[
                Segment("YOU ARE NOT CRAZY", "Reporting errors are real.", "This happens more than people think.", 4.5),
                Segment("WHEN A FILE LOOKS WRONG", "You deserve a clear path, not confusion.", "Start with facts, not guesswork.", 5.2),
                Segment("SECURE INTAKE FIRST", "Upload securely and review possible reporting issues.", "No casual email for sensitive docs.", 5.8),
                Segment("DOCUMENT-BASED OUTPUT", "Generate a dispute letter and review before sending.", "Built from your record, not hype.", 6.2),
                Segment("EXPECTATION INTEGRITY", "Educational support. Not legal advice.", "No guaranteed outcomes.", 6.0),
                Segment("MOVE WITH CLARITY", "From confusion to documented action.", "Follow for practical breakdowns.", 5.6),
                Segment("CTA", "Start secure intake at settled.support", "Comment CHECK for the checklist.", 5.2),
            ],
        ),
        VideoSpec(
            slug="02-for-the-people",
            title="For People Tired of Credit Reporting Runaround",
            short_caption="For people who need a clear path, not more runaround.",
            hashtags="#personalfinance #credithelp #fcradispute #crediterror #settledsupport",
            narration=(
                "SETTLED is for people who are exhausted by the runaround. You call, you wait, you explain everything, "
                "and the same reporting issue still sits on your file. We built this for real people trying to protect housing, "
                "financing, and stability. You can upload securely, review possible reporting problems, and keep your next step documented. "
                "This is educational support for reporting disputes, not legal advice and not a guaranteed result. "
                "But it is a clear way forward when you need one. Follow for practical guidance and use secure intake when you are ready."
            ),
            segments=[
                Segment("FOR THE PEOPLE", "Tired of repeating your story with no fix.", "You are not imagining it.", 4.5),
                Segment("THE RUNAROUND IS REAL", "Calls, holds, delays, same issue still there.", "You deserve better process.", 5.5),
                Segment("WHY THIS EXISTS", "Protect housing, financing, and stability with documentation.", "Clear steps, clear record.", 6.0),
                Segment("HOW TO START", "Secure upload. Review possible reporting problems.", "Keep your next step organized.", 6.0),
                Segment("BOUNDARIES", "Educational reporting support only.", "Not legal advice. No guaranteed outcomes.", 6.0),
                Segment("CTA", "Follow for practical guidance.", "Begin secure intake at settled.support.", 6.0),
            ],
        ),
        VideoSpec(
            slug="03-how-it-works-30s",
            title="How SETTLED Works in 30 Seconds",
            short_caption="3-step flow for documented reporting-dispute action.",
            hashtags="#howto #studentloan #disputeworkflow #fcra #settledsupport",
            narration=(
                "Here is SETTLED in 30 seconds. Step one: upload your report securely, or paste the relevant text. "
                "Step two: review possible reporting issues with plain-language context and statute references where available. "
                "Step three: generate a document-based dispute letter and decide your next action with a documented record. "
                "You stay in control and review everything before sending. SETTLED is educational reporting support, not legal advice, "
                "and does not guarantee outcomes. If you want practical walkthroughs, follow here, and start at settled dot support when you are ready."
            ),
            segments=[
                Segment("SETTLED IN 30 SECONDS", "Three practical steps.", "No hype, just workflow.", 3.5),
                Segment("STEP 1", "Secure upload or paste relevant report text.", "Use protected intake for sensitive records.", 6.0),
                Segment("STEP 2", "Review possible reporting issues with plain-language context.", "See what to verify before sending.", 6.0),
                Segment("STEP 3", "Generate a document-based dispute letter and next step.", "You stay in control.", 6.0),
                Segment("TRUST LINE", "Educational support only.", "Not legal advice. No guaranteed outcomes.", 5.0),
                Segment("CTA", "Follow for walkthroughs.", "Start at settled.support.", 4.5),
            ],
        ),
    ]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    _load_env_local(root)
    export_root = root / "content" / "launch-videos" / "exports-v2"
    audio_dir = export_root / "audio"
    export_root.mkdir(parents=True, exist_ok=True)
    audio_dir.mkdir(parents=True, exist_ok=True)

    downloaded = _download_human_backgrounds(root)
    backgrounds = downloaded if downloaded else _fallback_backgrounds(root)
    if not backgrounds:
        raise RuntimeError("No background visuals available.")

    key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    mode: Literal["narrated", "silent"] = "narrated" if key else "silent"
    fallback_reason = ""
    voice_id: str | None = None

    if mode == "narrated":
        voice_id, reason = _get_default_voice_id(key)
        if not voice_id:
            mode = "silent"
            fallback_reason = reason

    specs = build_specs()
    summary: list[dict[str, str | float]] = []

    for idx, spec in enumerate(specs):
        mp3_path = audio_dir / f"{spec.slug}.mp3"
        wav_path = audio_dir / f"{spec.slug}.wav"
        video_path = export_root / f"{spec.slug}.mp4"
        metadata_path = export_root / f"{spec.slug}.txt"

        if mode == "narrated":
            ok, reason = _tts_elevenlabs(spec.narration, key, mp3_path, voice_id or "")
            if ok:
                _mp3_to_wav(mp3_path, wav_path)
            else:
                mode = "silent"
                fallback_reason = reason

        if mode == "silent":
            duration = sum(segment.duration for segment in spec.segments)
            _make_silent_audio(duration, mp3_path, wav_path)

        actual_duration, used_mode = _render_video(spec, idx, backgrounds, mp3_path, mode, video_path)
        _metadata_file(spec, metadata_path)
        summary.append(
            {
                "slug": spec.slug,
                "mode": used_mode,
                "duration": round(actual_duration, 2),
            }
        )

    status_file = export_root / "render-status.json"
    status_file.write_text(
        json.dumps(
            {
                "mode": mode,
                "fallback_reason": fallback_reason,
                "voice_id_used": voice_id if mode == "narrated" else None,
                "background_source": "downloaded" if downloaded else "local-previews",
                "videos": summary,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    print(status_file)


if __name__ == "__main__":
    main()

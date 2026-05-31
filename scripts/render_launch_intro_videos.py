from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from textwrap import wrap

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy import ImageClip, concatenate_videoclips
from moviepy.video.fx.FadeIn import FadeIn
from moviepy.video.fx.FadeOut import FadeOut


WIDTH = 1080
HEIGHT = 1920
FPS = 30
ACCENT = (123, 164, 255)
BG_TOP = np.array([6, 11, 24], dtype=np.float32)
BG_BOTTOM = np.array([2, 3, 6], dtype=np.float32)


@dataclass
class Segment:
    duration: float
    heading: str
    body: str
    caption: str


@dataclass
class VideoSpec:
    slug: str
    title: str
    short_caption: str
    hashtags: str
    segments: list[Segment]


def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
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


def _gradient_background() -> np.ndarray:
    y = np.linspace(0.0, 1.0, HEIGHT, dtype=np.float32)[:, None]
    gradient = BG_TOP * (1.0 - y) + BG_BOTTOM * y
    frame = np.repeat(gradient[:, None, :], WIDTH, axis=1)
    noise = np.random.default_rng(42).normal(0, 2.5, size=frame.shape)
    frame = np.clip(frame + noise, 0, 255).astype(np.uint8)
    return frame


def _wrap_lines(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_centered_block(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    center_x: int,
    top_y: int,
    max_width: int,
    line_spacing: int,
    fill: tuple[int, int, int],
) -> int:
    lines = _wrap_lines(draw, text, font, max_width=max_width)
    y = top_y
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_w = bbox[2] - bbox[0]
        draw.text((center_x - line_w // 2, y), line, font=font, fill=fill)
        y += (bbox[3] - bbox[1]) + line_spacing
    return y


def _make_card_image(segment: Segment, idx: int) -> np.ndarray:
    img = Image.fromarray(_gradient_background(), mode="RGB").convert("RGBA")
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw_overlay = ImageDraw.Draw(overlay)

    # Accent bars and subtle structure
    draw_overlay.rectangle([(70, 78), (WIDTH - 70, 90)], fill=(*ACCENT, 210))
    draw_overlay.rectangle([(70, HEIGHT - 182), (WIDTH - 70, HEIGHT - 170)], fill=(*ACCENT, 210))
    draw_overlay.rectangle([(70, 170), (WIDTH - 70, HEIGHT - 280)], fill=(8, 13, 26, 170))

    # Caption backing
    draw_overlay.rectangle([(80, HEIGHT - 420), (WIDTH - 80, HEIGHT - 230)], fill=(0, 0, 0, 140))

    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    heading_font = _load_font(52, bold=True)
    body_font = _load_font(67, bold=True)
    caption_font = _load_font(44, bold=False)
    pill_font = _load_font(34, bold=True)

    # Sequence badge
    badge_text = f"SETTLED INTRO {idx + 1:02d}"
    badge_bbox = draw.textbbox((0, 0), badge_text, font=pill_font)
    badge_w = badge_bbox[2] - badge_bbox[0] + 42
    draw.rounded_rectangle([(80, 112), (80 + badge_w, 170)], radius=18, fill=(14, 26, 53, 220), outline=(*ACCENT, 225), width=2)
    draw.text((101, 126), badge_text, font=pill_font, fill=(210, 225, 255))

    y = 230
    y = _draw_centered_block(
        draw,
        segment.heading,
        heading_font,
        center_x=WIDTH // 2,
        top_y=y,
        max_width=WIDTH - 220,
        line_spacing=8,
        fill=ACCENT,
    )
    y += 26
    _draw_centered_block(
        draw,
        segment.body,
        body_font,
        center_x=WIDTH // 2,
        top_y=y,
        max_width=WIDTH - 180,
        line_spacing=14,
        fill=(245, 248, 255),
    )

    _draw_centered_block(
        draw,
        segment.caption,
        caption_font,
        center_x=WIDTH // 2,
        top_y=HEIGHT - 390,
        max_width=WIDTH - 210,
        line_spacing=8,
        fill=(230, 236, 248),
    )

    return np.array(img.convert("RGB"))


def _render_video(spec: VideoSpec, export_dir: Path) -> Path:
    clips = []
    for idx, segment in enumerate(spec.segments):
        frame = _make_card_image(segment, idx)
        clip = ImageClip(frame).with_duration(segment.duration).with_fps(FPS).with_effects([FadeIn(0.25), FadeOut(0.25)])
        clips.append(clip)
    final = concatenate_videoclips(clips, method="compose")

    output_path = export_dir / f"{spec.slug}.mp4"
    final.write_videofile(
        str(output_path),
        fps=FPS,
        codec="libx264",
        audio=False,
        bitrate="14M",
        ffmpeg_params=["-pix_fmt", "yuv420p"],
        logger=None,
    )
    final.close()
    for clip in clips:
        clip.close()
    return output_path


def _write_metadata(spec: VideoSpec, export_dir: Path) -> Path:
    metadata_path = export_dir / f"{spec.slug}.txt"
    metadata_path.write_text(
        f"title: {spec.title}\nshort caption: {spec.short_caption}\nhashtags: {spec.hashtags}\n",
        encoding="utf-8",
    )
    return metadata_path


def build_specs() -> list[VideoSpec]:
    return [
        VideoSpec(
            slug="01-intro-who-we-are",
            title="You Are Not Crazy: Reporting Errors Are Real | SETTLED",
            short_caption="If your report looks wrong, start with documented action.",
            hashtags="#credit #studentloans #fcra #creditreporterrors #settledsupport",
            segments=[
                Segment(4.0, "YOU ARE NOT CRAZY", "Reporting errors are real.", "This happens more than people think."),
                Segment(5.0, "WHEN A FILE LOOKS WRONG", "You deserve a clear path, not confusion.", "Start with facts, not guesswork."),
                Segment(6.0, "SECURE INTAKE FIRST", "Upload securely and review possible reporting issues.", "No casual email for sensitive docs."),
                Segment(6.0, "DOCUMENT-BASED OUTPUT", "Generate a dispute letter you can review before sending.", "Built from your record, not hype."),
                Segment(6.0, "EXPECTATION INTEGRITY", "Educational support. Not legal advice.", "No guaranteed outcomes."),
                Segment(6.0, "MOVE WITH CLARITY", "From confusion to documented action.", "Follow for practical breakdowns."),
                Segment(7.0, "CTA", "Start secure intake at settled.support", "Comment CHECK for the checklist."),
            ],
        ),
        VideoSpec(
            slug="02-for-the-people",
            title="For People Tired of Credit Reporting Runaround",
            short_caption="For people who need a clear path, not more runaround.",
            hashtags="#personalfinance #credithelp #fcradispute #crediterror #settledsupport",
            segments=[
                Segment(4.0, "FOR THE PEOPLE", "Tired of repeating your story with no fix.", "You are not imagining it."),
                Segment(5.0, "THE RUNAROUND IS REAL", "Calls, holds, delays, same issue still there.", "You deserve better process."),
                Segment(6.0, "WHY THIS EXISTS", "Protect housing, financing, and stability with documentation.", "Clear steps, clear record."),
                Segment(6.0, "HOW TO START", "Secure upload. Review possible reporting problems.", "Keep your next step organized."),
                Segment(6.0, "BOUNDARIES", "Educational reporting support only.", "Not legal advice. No guaranteed outcomes."),
                Segment(8.0, "CTA", "Follow for practical guidance.", "Begin secure intake at settled.support."),
            ],
        ),
        VideoSpec(
            slug="03-how-it-works-30s",
            title="How SETTLED Works in 30 Seconds",
            short_caption="3-step flow for documented reporting-dispute action.",
            hashtags="#howto #studentloan #disputeworkflow #fcra #settledsupport",
            segments=[
                Segment(3.0, "SETTLED IN 30 SECONDS", "Three practical steps.", "No hype, just workflow."),
                Segment(7.0, "STEP 1", "Secure upload or paste relevant report text.", "Use protected intake for sensitive records."),
                Segment(7.0, "STEP 2", "Review possible reporting issues with plain-language context.", "See what to verify before sending."),
                Segment(7.0, "STEP 3", "Generate a document-based dispute letter and next step.", "You stay in control."),
                Segment(4.0, "TRUST LINE", "Educational support only.", "Not legal advice. No guaranteed outcomes."),
                Segment(5.0, "CTA", "Follow for walkthroughs.", "Start at settled.support."),
            ],
        ),
    ]


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    export_dir = root / "content" / "launch-videos" / "exports"
    export_dir.mkdir(parents=True, exist_ok=True)

    specs = build_specs()
    for spec in specs:
        _render_video(spec, export_dir)
        _write_metadata(spec, export_dir)

    print(f"Rendered {len(specs)} videos to {export_dir}")


if __name__ == "__main__":
    main()

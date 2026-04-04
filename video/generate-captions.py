#!/usr/bin/env python3
"""Composite captions onto frames."""
from PIL import Image, ImageDraw, ImageFont
import os, textwrap

CLIPS = {
    "01-open-product": "This is BatchFi. A batch auction DEX running on its own Initia appchain. Every thirty seconds, it collects orders and clears them at one uniform price. Twenty-one dollars in protocol revenue so far from test trades.",
    "02-connect-trade": "Connect with InterwovenKit. You can see cipher dot init in the header. The batch timer counts down from thirty seconds. Set your limit price, your amount, and submit. Your order goes into the batch.",
    "03-settlement": "When the timer hits zero, the settler calls the contract. The clearing algorithm walks sorted buys and sells, finds where supply meets demand, and sets one price. Everyone who fills gets that price. No one gets priority.",
    "04-contract": "The contract is five hundred lines of Solidity with thirty-three tests. It charges zero point one percent on every fill. There is a settler fallback so anyone can settle after five minutes if the bot goes down. Funds never get stuck.",
    "05-initia-features": "Built with InterwovenKit for wallet connection, session signing so you can trade without popups, and the Interwoven Bridge for moving tokens from Initia L1. The oracle precompile at address F1 feeds reference prices from the Cosmos oracle module.",
    "06-close": "BatchFi. Fair trading on Initia.",
}

FRAMES_DIR = os.path.join(os.path.dirname(__file__), "frames")
COMPOSITES_DIR = os.path.join(os.path.dirname(__file__), "composites")
os.makedirs(COMPOSITES_DIR, exist_ok=True)

# Find font
font = None
for p in ["/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/SFNS.ttf", "/Library/Fonts/Arial.ttf"]:
    if os.path.exists(p):
        font = ImageFont.truetype(p, 32)
        break
if not font:
    font = ImageFont.load_default()

for clip, text in CLIPS.items():
    frame_path = os.path.join(FRAMES_DIR, f"{clip}.png")
    if not os.path.exists(frame_path):
        print(f"SKIP (no frame): {clip}")
        continue

    img = Image.open(frame_path).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Wrap text
    lines = textwrap.wrap(text, width=70)
    line_height = 42
    padding = 20
    margin_x = 160
    box_h = len(lines) * line_height + padding * 2
    box_y = img.height - box_h - 60
    box_x = margin_x

    # Semi-transparent background box
    draw.rounded_rectangle(
        [(box_x, box_y), (img.width - box_x, box_y + box_h)],
        radius=12,
        fill=(0, 0, 0, 140),
    )

    # Draw text
    y = box_y + padding
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (img.width - tw) // 2
        draw.text((x, y), line, fill=(255, 255, 255, 255), font=font)
        y += line_height

    result = Image.alpha_composite(img, overlay)
    out = os.path.join(COMPOSITES_DIR, f"{clip}.png")
    result.convert("RGB").save(out)
    print(f"OK: {clip}")

print("All captions composited.")

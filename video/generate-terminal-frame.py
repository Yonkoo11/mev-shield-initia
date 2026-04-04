#!/usr/bin/env python3
"""Generate a terminal-style frame for forge test output."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1920, 1080
BG = (13, 17, 23)  # Dark terminal background
FG = (201, 209, 217)  # Light text
GREEN = (63, 185, 80)  # Pass green
ACCENT = (0, 212, 170)  # BatchFi accent

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Find a monospace font
for font_path in [
    "/System/Library/Fonts/SFMono-Regular.otf",
    "/System/Library/Fonts/Menlo.ttc",
    "/System/Library/Fonts/Monaco.dfont",
]:
    if os.path.exists(font_path):
        font = ImageFont.truetype(font_path, 22)
        font_sm = ImageFont.truetype(font_path, 18)
        font_lg = ImageFont.truetype(font_path, 28)
        break
else:
    font = ImageFont.load_default()
    font_sm = font
    font_lg = font

# Terminal chrome
draw.rectangle([(60, 40), (1860, 80)], fill=(30, 35, 42))
for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
    draw.ellipse([(80 + i * 28, 50), (92 + i * 28, 62)], fill=c)
draw.text((200, 48), "forge test -- BatchAuction.sol", fill=FG, font=font_sm)

y = 110
# Header
draw.text((80, y), "$ forge test -vv", fill=ACCENT, font=font_lg)
y += 50

lines = [
    ("[PASS] test_deposit()", GREEN),
    ("[PASS] test_withdraw()", GREEN),
    ("[PASS] test_openBatch()", GREEN),
    ("[PASS] test_submitOrder()", GREEN),
    ("[PASS] test_cancelOrder()", GREEN),
    ("[PASS] test_settleBatch_uniformClearingPrice()", GREEN),
    ("[PASS] test_buyerPaysLessThanLimit()", GREEN),
    ("[PASS] test_sellerGetsExactlyClearingPrice()", GREEN),
    ("[PASS] test_multiOrderClearing()", GREEN),
    ("[PASS] test_noCrossing()", GREEN),
    ("[PASS] test_protocolFeeAccumulates()", GREEN),
    ("[PASS] test_withdrawRevenue()", GREEN),
    ("[PASS] test_anyoneCanSettleAfterGracePeriod()", GREEN),
    ("[PASS] test_maxOrdersEnforcement()", GREEN),
    ("[PASS] test_settleWorksWhenPaused()", GREEN),
    ("[PASS] test_pauseBlocksDeposit()", GREEN),
    ("[PASS] test_ownerCanOpenBatch()", GREEN),
    ("[PASS] test_nonSettlerCannotOpenBatch()", GREEN),
    ("", FG),
    ("... 15 more tests passing", (130, 140, 150)),
    ("", FG),
]

for text, color in lines:
    if text:
        draw.text((80, y), text, fill=color, font=font)
    y += 32

y += 20
draw.text((80, y), "Suite result: ok. 33 passed; 0 failed; 0 skipped", fill=GREEN, font=font_lg)
y += 50
draw.text((80, y), "Ran 1 test suite in 276ms: 33 tests passed, 0 failed", fill=FG, font=font)

out = os.path.join(os.path.dirname(__file__), "frames", "04-contract.png")
img.save(out)
print(f"Saved: {out}")

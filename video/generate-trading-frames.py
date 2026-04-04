#!/usr/bin/env python3
"""Generate frames for connected trading view and settlement."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1920, 1080
BG = (8, 9, 14)
CARD = (17, 19, 32)
BORDER = (28, 30, 48)
FG = (228, 228, 231)
MUTED = (113, 113, 122)
ACCENT = (0, 212, 170)
CYAN = (6, 182, 212)
CORAL = (249, 115, 22)
RED = (255, 71, 87)

def get_font(size):
    for p in ["/Library/Fonts/SF-Pro-Display-Regular.otf", "/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/SFNS.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def get_mono(size):
    for p in ["/System/Library/Fonts/SFMono-Regular.otf", "/System/Library/Fonts/Menlo.ttc"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

font = get_font(24)
font_sm = get_font(18)
font_lg = get_font(36)
font_xl = get_font(48)
mono = get_mono(22)
mono_lg = get_mono(32)

def draw_card(draw, x, y, w, h):
    draw.rounded_rectangle([(x, y), (x+w, y+h)], radius=12, fill=CARD, outline=BORDER)

# --- Frame 02: Connected Trading View ---
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Header bar
d.rectangle([(0, 0), (W, 60)], fill=CARD)
d.text((80, 16), "BatchFi", fill=ACCENT, font=font_lg)
d.text((W-300, 20), "Trade    Bridge    Docs", fill=MUTED, font=font)
draw_card(d, W-160, 12, 140, 36)
d.text((W-145, 18), "cipher.init", fill=ACCENT, font=font_sm)

# Batch timer center
draw_card(d, 710, 90, 500, 140)
d.text((730, 100), "BATCH #67", fill=MUTED, font=font_sm)
# Timer ring (simple circle)
cx, cy, r = 960, 170, 35
d.ellipse([(cx-r, cy-r), (cx+r, cy+r)], outline=BORDER, width=3)
d.arc([(cx-r, cy-r), (cx+r, cy+r)], -90, 180, fill=ACCENT, width=3)
d.text((cx-18, cy-14), "14s", fill=FG, font=mono_lg)
d.text((900, 210), "Accepting orders", fill=ACCENT, font=font_sm)
d.text((730, 210), "6/100", fill=MUTED, font=font_sm)

# Left: Buy orders
draw_card(d, 60, 260, 560, 400)
d.text((80, 275), "BUY ORDERS", fill=CYAN, font=font_sm)
buys = [("105.00", "30.00", 0.6), ("100.00", "50.00", 1.0), ("95.00", "20.00", 0.4)]
for i, (price, amount, bar) in enumerate(buys):
    y = 320 + i * 60
    bw = int(480 * bar)
    d.rectangle([(80, y), (80 + bw, y + 40)], fill=(6, 182, 212, 30))
    d.text((90, y + 8), price, fill=CYAN, font=mono)
    d.text((350, y + 8), amount + " INIT", fill=FG, font=mono)

# Right: Sell orders
draw_card(d, 1300, 260, 560, 400)
d.text((1320, 275), "SELL ORDERS", fill=CORAL, font=font_sm)
sells = [("90.00", "40.00", 0.8), ("95.00", "25.00", 0.5), ("100.00", "35.00", 0.7)]
for i, (price, amount, bar) in enumerate(sells):
    y = 320 + i * 60
    bw = int(480 * bar)
    d.rectangle([(1820 - bw, y), (1820, y + 40)], fill=(249, 115, 22, 30))
    d.text((1330, y + 8), price, fill=CORAL, font=mono)
    d.text((1580, y + 8), amount + " INIT", fill=FG, font=mono)

# Center: Order form
draw_card(d, 660, 260, 600, 400)
d.text((680, 275), "Submit Order (Batch #67)", fill=MUTED, font=font_sm)
# Buy/Sell toggle
d.rounded_rectangle([(680, 310), (830, 350)], radius=8, fill=(0, 212, 170, 40))
d.text((720, 318), "Buy INIT", fill=ACCENT, font=font)
d.rounded_rectangle([(840, 310), (990, 350)], radius=8, fill=CARD)
d.text((875, 318), "Sell INIT", fill=MUTED, font=font)

d.text((680, 370), "Limit Price (USDC per INIT)", fill=MUTED, font=font_sm)
draw_card(d, 680, 395, 560, 44)
d.text((700, 405), "98.50", fill=FG, font=mono)

d.text((680, 460), "Amount (INIT)", fill=MUTED, font=font_sm)
draw_card(d, 680, 485, 560, 44)
d.text((700, 495), "25.00", fill=FG, font=mono)

# Subtotal
draw_card(d, 680, 550, 560, 80)
d.text((700, 558), "Subtotal", fill=MUTED, font=font_sm)
d.text((1050, 558), "2,462.50 USDC", fill=FG, font=mono)
d.text((700, 585), "Protocol fee (0.1%)", fill=MUTED, font=font_sm)
d.text((1050, 585), "2.46 USDC", fill=FG, font=mono)

# Balance display
draw_card(d, 660, 690, 600, 80)
d.text((680, 700), "Deposited Balance", fill=MUTED, font=font_sm)
d.text((680, 725), "110.00 INIT", fill=ACCENT, font=mono)
d.text((950, 725), "9,100.00 USDC", fill=ACCENT, font=mono)

# Session signing toggle
draw_card(d, 660, 790, 600, 60)
d.text((680, 805), "Session Signing", fill=FG, font=font)
d.text((910, 808), "Active", fill=ACCENT, font=font_sm)
# Toggle on
d.rounded_rectangle([(1200, 802), (1240, 830)], radius=14, fill=ACCENT)
d.ellipse([(1220, 804), (1238, 826)], fill=(255, 255, 255))

# Bottom: Batch lifecycle
draw_card(d, 60, 880, 1800, 160)
d.text((80, 895), "Batch Lifecycle", fill=FG, font=font)
d.text((80, 930), "Settled Batches", fill=MUTED, font=font_sm)
d.text((80, 960), "Batch #66   Clearing: 90.00 USDC/INIT   3 buys filled, 1 sell filled   Fee: $12.60", fill=FG, font=font_sm)
d.text((80, 990), "Batch #65   Clearing: 95.00 USDC/INIT   2 buys filled, 2 sells filled  Fee: $9.00", fill=FG, font=font_sm)

img.save("video/frames/02-connect-trade.png")
print("Frame 02 saved")

# --- Frame 03: Settlement ---
img3 = img.copy()
d3 = ImageDraw.Draw(img3)

# Overlay a "SETTLED" state on the timer
d3.rounded_rectangle([(710, 90), (1210, 230)], radius=12, fill=CARD, outline=ACCENT)
d3.text((730, 100), "BATCH #67 - SETTLED", fill=ACCENT, font=font_sm)
d3.ellipse([(cx-r, cy-r), (cx+r, cy+r)], outline=ACCENT, width=3)
d3.text((cx-12, cy-10), "OK", fill=ACCENT, font=mono_lg)
d3.text((850, 210), "Cleared at 95.00 USDC/INIT", fill=ACCENT, font=font)

img3.save("video/frames/03-settlement.png")
print("Frame 03 saved")

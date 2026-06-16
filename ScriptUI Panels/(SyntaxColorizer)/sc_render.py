#!/usr/bin/env python3
# ============================================
# Script Name : sc_render.py
# Version     : v0.1
# 仕様        : sc_color.pyの色レンジJSONを等幅フォントで色付きPNGにレンダリング(スクロール素材用)
# Copyright   : Over Ray Studio
# Author      : Takashi Aoki (with Elena)
# LastUpdate  : 2026-06-15
# ============================================
import sys, os, json, argparse
from PIL import Image, ImageDraw, ImageFont

def main():
	ap = argparse.ArgumentParser()
	ap.add_argument("-i","--infile", required=True, help="色レンジJSON")
	ap.add_argument("-o","--outfile", required=True, help="出力PNG")
	ap.add_argument("--font", default="/System/Library/Fonts/Menlo.ttc")
	ap.add_argument("--size", type=int, default=24)
	ap.add_argument("--leading", type=int, default=0, help="行高(0=size*1.3)")
	ap.add_argument("--pad", type=int, default=20)
	ap.add_argument("--bg", default="#0B1014")
	args = ap.parse_args()

	d = json.load(open(args.infile, encoding="utf-8"))
	text = d["text"]
	base = "#C8E0E5"
	for s in d["spans"]:
		if s["kind"] == "text": base = s["color"]; break

	try:
		font = ImageFont.truetype(args.font, args.size)
	except Exception:
		font = ImageFont.truetype("/System/Library/Fonts/Courier.ttc", args.size)

	# 等幅: 1文字幅
	cw = font.getlength("M")
	lh = args.leading or int(args.size * 1.3)

	# 全文字色配列(spanで上書き)
	colorAt = [base] * len(text)
	for s in d["spans"]:
		for i in range(s["start"], min(s["end"], len(text))):
			colorAt[i] = s["color"]

	lines = text.split("\n")
	maxcols = max((len(l) for l in lines), default=1)
	W = int(cw * maxcols) + args.pad * 2
	H = lh * len(lines) + args.pad * 2

	img = Image.new("RGB", (W, H), args.bg)
	dr = ImageDraw.Draw(img)

	gpos = 0
	y = args.pad
	for line in lines:
		x = args.pad
		col = 0
		# 同色ランをまとめて描画
		run_start = 0
		while run_start < len(line):
			c = colorAt[gpos + run_start] if (gpos + run_start) < len(colorAt) else base
			run_end = run_start + 1
			while run_end < len(line) and (gpos + run_end) < len(colorAt) and colorAt[gpos + run_end] == c:
				run_end += 1
			seg = line[run_start:run_end]
			dr.text((x + cw * run_start, y), seg, fill=c, font=font)
			run_start = run_end
		gpos += len(line) + 1
		y += lh

	img.save(args.outfile)
	sys.stderr.write("wrote %s : %dx%d (%d lines)\n" % (args.outfile, W, H, len(lines)))

if __name__ == "__main__":
	main()

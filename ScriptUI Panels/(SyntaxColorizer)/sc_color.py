#!/usr/bin/env python3
# ============================================
# Script Name : sc_color.py
# Version     : v0.1
# 仕様        : ログ/コードテキストをフィールド認識＋Pygmentsで彩色し色レンジJSONを書き出す(ASH代替/Mac-native)
# Copyright   : Over Ray Studio
# Author      : Takashi Aoki (with Elena)
# LastUpdate  : 2026-06-15
# ============================================
#
# 入力 : 入力ログ/コードテキスト  "TIME | LEVEL | MODULE | message meta"
# 出力 : {"text":全文, "spans":[{kind,value,start,end,color}], "lineCount":N}
#        start/end は全文に対するグローバル文字オフセット(改行含む)。AE側はこれを
#        Range Selector(INDEX)で1スパン=1色として適用する(ASHと同型)。
#
# 使い方:
#   python3 sc_color.py -i sample_log.txt -t themes/tokyo_night.json -o sample_colored.json
#   cat log.txt | python3 sc_color.py -t themes/tokyo_night.json > out.json

import sys, os, json, re, argparse

from pygments import lex
from pygments.lexers import JavascriptLexer
from pygments.token import Token

# Pygmentsトークン → テーマkind
def pyg_kind(ttype):
	t = str(ttype)
	if t.startswith("Token.Comment"):            return "code.comment"
	if t.startswith("Token.Literal.String"):     return "code.string"
	if t.startswith("Token.Literal.Number"):     return "code.number"
	if t.startswith("Token.Keyword"):            return "code.keyword"
	if t.startswith("Token.Operator"):           return "code.operator"
	if t.startswith("Token.Punctuation"):        return "code.operator"
	if t.startswith("Token.Name"):               return "code.name"
	return "text"

LEVEL_KIND = {
	"INFO":  "level.info",  "DEBUG": "level.debug", "WARN": "level.warn",
	"ALERT": "level.alert", "TRACE": "level.trace", "ERROR": "level.alert",
}

_lexer = JavascriptLexer()

def tokenize_code(s, base):
	"""message+meta部をPygmentsで彩色。baseはグローバル開始オフセット。"""
	spans = []
	pos = base
	for ttype, value in lex(s, _lexer):
		if value == "":
			continue
		k = pyg_kind(ttype)
		spans.append({"kind": k, "value": value, "start": pos, "end": pos + len(value)})
		pos += len(value)
	return spans

def colorize(text, theme):
	colors = theme.get("colors", {})
	def col(kind):
		return colors.get(kind, colors.get("text", "#FFFFFF"))

	spans = []
	gpos = 0  # グローバル文字オフセット

	for raw in text.split("\n"):
		line = raw
		# "TIME | LEVEL | MODULE | REST" を ' | ' 区切りで最大4分割
		# 区切りそのものも1スパン(delim)として保持し、オフセットを厳密一致させる
		parts = line.split(" | ")
		if len(parts) >= 4:
			time_s  = parts[0]
			level_s = parts[1]
			mod_s   = parts[2]
			rest_s  = " | ".join(parts[3:])

			cur = gpos
			# time
			spans.append({"kind": "time", "value": time_s, "start": cur, "end": cur + len(time_s)})
			cur += len(time_s)
			# " | "
			spans.append({"kind": "delim", "value": " | ", "start": cur, "end": cur + 3}); cur += 3
			# level (前後空白を保ったまま、トリム値で種別判定)
			lk = LEVEL_KIND.get(level_s.strip().upper(), "text")
			spans.append({"kind": lk, "value": level_s, "start": cur, "end": cur + len(level_s)})
			cur += len(level_s)
			spans.append({"kind": "delim", "value": " | ", "start": cur, "end": cur + 3}); cur += 3
			# module
			spans.append({"kind": "module", "value": mod_s, "start": cur, "end": cur + len(mod_s)})
			cur += len(mod_s)
			spans.append({"kind": "delim", "value": " | ", "start": cur, "end": cur + 3}); cur += 3
			# rest = message + meta : Pygmentsで彩色
			spans.extend(tokenize_code(rest_s, cur))
			cur += len(rest_s)
		else:
			# フォーマット外(空行など)はそのままtext
			if line:
				spans.append({"kind": "text", "value": line, "start": gpos, "end": gpos + len(line)})

		# 改行ぶんを進める(末尾行以外)
		gpos += len(line) + 1

	# 色を付与
	for sp in spans:
		sp["color"] = col(sp["kind"])

	return {
		"text": text,
		"spans": spans,
		"lineCount": text.count("\n") + (0 if text.endswith("\n") else 1),
	}

def main():
	ap = argparse.ArgumentParser(description="Syntax colorizer (Pygments, ASH-alternative, Mac-native)")
	ap.add_argument("-i", "--infile", help="入力ログ(省略時stdin)")
	ap.add_argument("-o", "--outfile", help="出力JSON(省略時stdout)")
	ap.add_argument("-t", "--theme", help="テーマJSON", default=os.path.join(os.path.dirname(__file__), "themes", "tokyo_night.json"))
	args = ap.parse_args()

	text = open(args.infile, "r", encoding="utf-8").read() if args.infile else sys.stdin.read()
	theme = json.load(open(args.theme, "r", encoding="utf-8")) if os.path.exists(args.theme) else {"colors": {}}

	result = colorize(text, theme)
	out = json.dumps(result, ensure_ascii=False, indent=1)
	if args.outfile:
		open(args.outfile, "w", encoding="utf-8").write(out)
		sys.stderr.write("wrote %s : %d spans / %d lines\n" % (args.outfile, len(result["spans"]), result["lineCount"]))
	else:
		print(out)

if __name__ == "__main__":
	main()

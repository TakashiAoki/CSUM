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

# --- 汎用FUIモード ---------------------------------------------------------
# ログ形式(" | "区切り)に該当しない行を文字種で塗り分ける。IFTG Pro等が吐く
# 装飾テキスト(LOCK / Spec:: / 48.8 / [52.8+] / >> 等)を多色化する。
# 並び順が優先度: label → unit → tag → number → op (左から最初に当たったもの)
FUI_RE = re.compile(r"""
	  (?P<rule>[-=_]{2,}|//|\|)                                                       # ---- ==== ____ // |  罫線/境界 → dim
	| (?P<hexid>0x[0-9A-Za-z]+)                                                       # 0x7P39  16進ID → 青
	| (?P<label>[A-Za-z][A-Za-z0-9._/]*:{1,2}(?!\S))                                  # Spec::  DATA:  LOG.ID::  ラベル → 水色
	| (?P<unit>(?<![A-Za-z])(?:MHZ|MHz|Mhz|GHz|kHz|Hz|CM|cm|mm|km|kg|ms|ML|MI|MK|MC|MB|KB)(?![A-Za-z]))  # 多文字単位 → 緑 (左右に英字が無い時のみ=systemsのms誤爆防止)
	| (?P<number>[+\-]?\d+(?:\.\d+)?[%+]?)                                            # 48.8 -37.12 57.65% 68.5+  数値 → 金
	| (?P<unit1>(?<=\d)[MKWVNSEW](?![A-Za-z]))                                        # 数字直後の M/K/W/V と方位 N/S/E/W → 緑
	| (?P<enumdim>(?<=/)[A-Z][A-Z0-9]+|[A-Z][A-Z0-9]+(?=/))                           # A/[B]/C の囲み外選択肢(スラッシュ隣接) → dim(一段暗く)
	| (?P<tag>[A-Z][A-Z0-9_]+(?:-[A-Z0-9_]+|[./][A-Z0-9_]+)*)                         # 2字以上の全大文字識別子 → 紫 (Fir/Bolg等の大文字始まり固有名詞は除外)
	| (?P<arrow>>>)                                                                   # >>  フロー → ピンク
	| (?P<bracket>[\[\]])                                                             # [ ]  構造 → 青
	| (?P<sign>[+\-])                                                                 # 余りの単独 +/- (境界・区切り) → dim
""", re.VERBOSE)
FUI_KIND = {
	"rule": "code.comment", "hexid": "code.name", "label": "module",
	"unit": "code.string", "number": "code.number", "unit1": "code.string",
	"tag": "code.keyword", "arrow": "level.alert", "bracket": "code.name",
	"sign": "code.comment", "enumdim": "code.comment",
}

def tokenize_fui(s, base):
	"""フォーマット外の行を文字種で彩色。base=グローバル開始オフセット。
	マッチした語だけスパン化し、隙間(空白等)はBASE色のまま残す。"""
	spans = []
	for m in FUI_RE.finditer(s):
		kind = FUI_KIND[m.lastgroup]
		st = base + m.start()
		spans.append({"kind": kind, "value": m.group(), "start": st, "end": st + len(m.group())})
	return spans

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
		if kind == "section":
			# section見出し(// LABEL)は専用色。テーマに無ければ module 色で代用(comment/keyword混色を避ける)
			return colors.get("section") or colors.get("module") or colors.get("text", "#FFFFFF")
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
			# フォーマット外(FUI装飾テキスト等)は文字種で彩色。
			# 1語もマッチしなければ従来どおり全文textで残す(プレーン文の挙動を保持)。
			if line:
				if line.lstrip().startswith("//"):
					# セクション見出し行(// DRAGOON UNITS 等)は行ごと section 色
					spans.append({"kind": "section", "value": line, "start": gpos, "end": gpos + len(line)})
				else:
					ftoks = tokenize_fui(line, gpos)
					if ftoks:
						spans.extend(ftoks)
					else:
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

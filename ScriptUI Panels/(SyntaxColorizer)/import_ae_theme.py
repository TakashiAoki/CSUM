#!/usr/bin/env python3
# ============================================
# Script Name : import_ae_theme.py
# Version     : v0.1
# 仕様        : AEエクスプレッションエディタのテーマ色をprefs(.txt)から読み、SyntaxColorizerテーマJSONに変換(AE APIを使わず安全)
# Copyright   : Over Ray Studio
# Author      : Takashi Aoki (with Elena)
# LastUpdate  : 2026-06-15
# ============================================
#
# 使い方:
#   python3 import_ae_theme.py --current                 # 現在使用中のAEテーマを取り込み
#   python3 import_ae_theme.py --theme "Monakai" -o themes/ae_monakai.json
#   python3 import_ae_theme.py --list                    # テーマ一覧
import argparse, glob, os, re, json, sys

def newest_prefs():
	cands=[]
	for f in glob.glob(os.path.expanduser('~/Library/Preferences/Adobe/After Effects/*/*Prefs.txt')):
		b=os.path.basename(f)
		if any(x in b for x in ('-indep','-effects','-paint','-text')): continue
		cands.append(f)
	cands.sort(key=lambda p: os.path.getmtime(p), reverse=True)
	return cands[0] if cands else None

def section(txt, hdr):
	i=txt.find(hdr)
	if i<0: return None
	j=txt.find('["', i+len(hdr))
	return txt[i: j if j>0 else len(txt)]

def current_theme(txt):
	s=section(txt, '["Expression Editor Settings (v9)"]') or ""
	m=re.search(r'"Current Expression Theme"\s*=\s*"([^"]+)"', s)
	return m.group(1) if m else None

def theme_colors(txt, name):
	s=section(txt, '["Expression Editor Theme (v9) - %s"]'%name)
	if not s: return None
	vals={}
	for cat,ch,v in re.findall(r'Syntax Highlighting - Color - (\w+) ([RGB])" = "([\d.]+)"', s):
		vals.setdefault(cat,{})[ch]=float(v)
	for cat,ch,v in re.findall(r'Theme - Color - (\w+) ([RGB])" = "([\d.]+)"', s):  # Background / Default
		vals.setdefault(cat,{})[ch]=float(v)
	def hx(d):
		c=lambda x:max(0,min(255,int(round(x*255))))
		return "#%02X%02X%02X"%(c(d.get('R',0)),c(d.get('G',0)),c(d.get('B',0)))
	return {k:hx(v) for k,v in vals.items()}

# AEカテゴリ → SyntaxColorizer kind マッピング
def to_theme(ae):
	def g(k, fb="#C8E0E5"): return ae.get(k, fb)
	return {"colors":{
		"background":    g("Background", "#0A0F14"),
		"text":          g("Default", g("LineNumbers")),
		"time":          g("Comment"),
		"delim":         g("IndentGuide"),
		"module":        g("Identifier"),
		"level.info":    g("Identifier"),
		"level.debug":   g("Comment"),
		"level.warn":    g("Keyword"),
		"level.alert":   g("BraceBad"),
		"level.trace":   g("Comment"),
		"code.keyword":  g("Keyword"),
		"code.string":   g("String"),
		"code.number":   g("Number"),
		"code.comment":  g("Comment"),
		"code.operator": g("Operator"),
		"code.name":     g("Identifier"),
		"meta":          g("Operator"),
	}}

def main():
	ap=argparse.ArgumentParser()
	ap.add_argument("--theme"); ap.add_argument("--current", action="store_true")
	ap.add_argument("--list", action="store_true"); ap.add_argument("-o","--out")
	ap.add_argument("--prefs", default=None)
	a=ap.parse_args()
	pf=a.prefs or newest_prefs()
	if not pf: sys.exit("prefs not found")
	txt=open(pf,encoding='utf-8',errors='replace').read()
	if a.list:
		for m in re.findall(r'\["Expression Editor Theme \(v9\) - ([^"]+)"\]', txt): print(m)
		return
	name = current_theme(txt) if a.current else a.theme
	if not name: sys.exit("specify --theme NAME or --current")
	cols=theme_colors(txt, name)
	if not cols: sys.exit("theme not found: "+name)
	out={"_comment":"AE expression theme '%s' imported from prefs"%name, "colors":to_theme(cols)["colors"]}
	js=json.dumps(out, ensure_ascii=False, indent=1)
	if a.out:
		open(a.out,"w",encoding="utf-8").write(js); sys.stderr.write("wrote %s (theme: %s)\n"%(a.out,name))
	else:
		print("// theme:", name); print(js)

if __name__=="__main__":
	main()

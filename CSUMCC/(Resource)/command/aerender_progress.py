#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================
# Script Name : aerender_progress.py
# Version     : v0.6.3
# 仕様        : aerender をラップしてターミナルに TUI プログレス表示
#               3段組TUI + 詳細エリア・サブピクセルバー・COMPLETE アート
#               純 stdlib / Mac・Win 両対応（Winは VT有効化＋os.startfile）
# Copyright   : Over Ray Studio
# Author      : Takashi Aoki
# LastUpdate  : 2026-05-24
# ============================================
# 使い方:
#   python3 aerender_progress.py [--open /path ...] /path/to/aerender [options...]
# ============================================

import sys
import os
import subprocess
import re
import time

# ---- プラットフォーム差異吸収（Mac/Win/Linux）----
def _win_console_init():
    """Windows: ANSI(VT) 有効化＋stdout/stderr を UTF-8 化。Mac/Linux では何もしない。"""
    if sys.platform != 'win32':
        return
    try:
        import ctypes
        k = ctypes.windll.kernel32
        # ENABLE_PROCESSED_OUTPUT(1)|ENABLE_WRAP_AT_EOL_OUTPUT(2)|ENABLE_VIRTUAL_TERMINAL_PROCESSING(4)
        k.SetConsoleMode(k.GetStdHandle(-11), 7)
    except Exception:
        pass
    # 既定が cp932 だと █ 等の罫線/ブロック文字で UnicodeEncodeError → UTF-8 に強制
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def open_path(f):
    """出力ファイル/フォルダを OS 既定アプリで開く。"""
    if sys.platform == 'win32':
        os.startfile(f)
    elif sys.platform == 'darwin':
        subprocess.run(['open', f])
    else:
        subprocess.run(['xdg-open', f])

# aerender の stdout は OS/ロケールで符号化が異なる（Win日本語版は cp932、Mac/英語は UTF-8/ASCII）。
# 1行ずつ複数エンコーディングを順に試して安全にデコードする。
_DEC_ENCS = ['utf-8']
if sys.platform == 'win32':
    try:
        import ctypes
        _DEC_ENCS.append('cp%d' % ctypes.windll.kernel32.GetACP())   # 日本語環境=932
    except Exception:
        pass
    if 'cp932' not in _DEC_ENCS:
        _DEC_ENCS.append('cp932')
_DEC_ENCS.append('latin-1')  # 最後の砦（失敗しない）

def decode_line(b):
    for enc in _DEC_ENCS:
        try:
            return b.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    return b.decode('utf-8', 'replace')

# ---- ANSI（標準 16色 + dim/bold）----
C_GREEN = ''  # 標準テキスト色（バー・スピナー・COMPLETEアート）
C_EMPTY = '\033[90m'    # bright black / dark grey（空のバー）
C_DIM   = '\033[2m'     # dim（先頭ゼロ・補助テキスト）
C_BOLD  = '\033[1m'
C_RST   = '\033[0m'
C_CLR   = '\033[2J\033[H'   # 画面クリア + 左上へ
C_HOME  = '\033[H'          # 左上へ（クリアなし）
C_EOLN  = '\033[K'          # 行末までクリア
C_EOS   = '\033[0J'         # カーソル以降全クリア

SUBPIXEL = '▏▎▍▌▋▊▉'
SPINNER  = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
BAR_WIDTH = 40

# 詳細エリアのレイアウト定義（AE レンダーキューウィンドウ準拠）
# 各行は [key] (1項目) または [key1, key2] (2項目ペア)。key は英語の正準キー。
DETAIL_LAYOUT = [
    ['Render Settings'],
    ['Output Module'],
    ['Final Size', 'Frame Rate'],
    ['Format', 'Output Info'],
    ['Output Audio', 'Skip Existing Files'],
    ['Post-Render Action'],
    ['Output To'],
]

# 日本語版 aerender の詳細キー → 英語正準キー（DETAIL_LAYOUT に合わせて正規化）
KEY_ALIASES = {
    'レンダリング設定': 'Render Settings',
    '出力モジュール':   'Output Module',
    '最終サイズ':       'Final Size',
    'フレームレート':   'Frame Rate',
    '形式':             'Format',
    '出力情報':         'Output Info',
    'オーディオ出力':   'Output Audio',
    '同名ファイルをスキップ': 'Skip Existing Files',
    'レンダリング後の処理':   'Post-Render Action',
    '出力先':           'Output To',
}

COMPLETE_ART = [
    '  ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗████████╗███████╗',
    ' ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚══██╔══╝██╔════╝',
    ' ██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗     ██║   █████╗  ',
    ' ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝     ██║   ██╔══╝  ',
    ' ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗   ██║   ███████╗',
    '  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝',
]

# ---- ヘルパー ----

def term_cols():
    try:
        return os.get_terminal_size().columns
    except OSError:
        return 80

def fmt_tc(s):
    if s < 0:
        return '--:--'
    s = int(s)
    if s < 3600:
        return f'{s//60:02d}:{s%60:02d}'
    return f'{s//3600}:{(s%3600)//60:02d}:{s%60:02d}'

def draw_bar(done, total):
    if total == 0:
        return C_EMPTY + '░' * BAR_WIDTH + C_RST
    pos8    = done * BAR_WIDTH * 8 / total
    full    = int(pos8 // 8)
    partial = int(pos8 % 8)
    empty   = BAR_WIDTH - full - (1 if partial else 0)
    bar = C_GREEN + '█' * full
    if partial:
        bar += SUBPIXEL[partial - 1]
    bar += C_EMPTY + '░' * max(0, empty) + C_RST
    return bar

def dim_frame(n, digits):
    s  = str(n).zfill(digits)
    nz = len(s) - len(s.lstrip('0'))
    if nz == 0:
        return s
    if nz == len(s):
        return C_DIM + s + C_RST
    return C_DIM + s[:nz] + C_RST + s[nz:]

def _fmt_kv(k, v):
    """key: value を (visual_length, ansi_string) で返す。key 部分は dim。"""
    vis  = f'{k}: {v}'
    ansi = C_DIM + k + C_RST + ': ' + v
    return len(vis), ansi

def render_detail_rows(detail_dict, W):
    """DETAIL_LAYOUT に従い表示行リストを生成する"""
    usable = W - 5  # ' ▸ ' プレフィックス分を除いた幅
    rows = []
    for keys in DETAIL_LAYOUT:
        avail = [(k, detail_dict[k]) for k in keys if k in detail_dict]
        if not avail:
            continue
        if len(avail) == 1:
            k, v = avail[0]
            vis_len, ansi = _fmt_kv(k, v)
            # Output To はパスが長い場合に先頭を省略
            if vis_len > usable:
                path_avail = usable - len(k) - 2 - 1  # ': ' + '…'
                ansi = C_DIM + k + C_RST + ': …' + v[-path_avail:]
            rows.append(ansi)
        else:
            col = usable // 2
            k1, v1 = avail[0]
            k2, v2 = avail[1]
            vis1, ansi1 = _fmt_kv(k1, v1)
            vis2, ansi2 = _fmt_kv(k2, v2)
            if vis1 > col - 2:
                v1_cut = col - 3 - len(k1) - 2
                ansi1 = C_DIM + k1 + C_RST + ': ' + (v1[:v1_cut] + '…' if v1_cut > 0 else '…')
                vis1 = col - 1
            pad = col - vis1
            rows.append(ansi1 + ' ' * max(2, pad) + ansi2)
    return rows

def print_tui(label, done, total, avg_sec, wall_start, spin_idx, first, detail_dict):
    W       = term_cols()
    elapsed = time.time() - wall_start
    eta_sec = (total - done) * avg_sec if avg_sec > 0 else -1
    pct     = done / total * 100 if total else 0
    digits  = len(str(total)) if total else 5
    spinner = SPINNER[spin_idx % len(SPINNER)]

    # ---- Line 1: コンプ名（左）+ フレームカウンター（右寄せ、1文字マージン）----
    frame_vis = f'{done:0{digits}d}/{total:0{digits}d}'
    frame_col = dim_frame(done, digits) + C_DIM + '/' + C_RST + dim_frame(total, digits)
    max_label = max(8, W - len(frame_vis) - 3)
    label_str = (label[:max_label - 1] + '…') if len(label) > max_label else label
    pad   = W - len(label_str) - len(frame_vis) - 1   # 右端を1文字空ける
    line1 = C_BOLD + label_str + C_RST + ' ' * max(1, pad) + frame_col

    # ---- Line 2: バー + パーセント + ETA + スピナー ----
    bar     = draw_bar(done, total)
    pct_str = C_BOLD + f'{pct:5.1f}%' + C_RST
    eta_str = C_DIM + 'ETA ' + C_RST + fmt_tc(eta_sec)
    line2   = '[' + bar + ']  ' + pct_str + '  ' + eta_str + '  ' + C_GREEN + spinner + C_RST

    # ---- Line 3: avg + elapsed ----
    avg_str = f'{avg_sec:.2f}s/f' if avg_sec > 0 else '   ...  '
    line3   = f'  {C_DIM}avg{C_RST} {avg_str}  {C_DIM}+{C_RST}{fmt_tc(elapsed)}'

    out  = '\033[?25l'           # カーソル非表示（描画中のちらつき防止）
    out += C_CLR if first else C_HOME
    out += line1 + C_RST + C_EOLN + '\n'
    out += line2 + C_RST + C_EOLN + '\n'
    out += line3 + C_RST

    # ---- 詳細エリア ----
    if detail_dict:
        sep = C_DIM + '  ' + '─' * min(W - 4, 60) + C_RST
        out += C_EOLN + '\n' + sep + C_EOLN + '\n'
        for row in render_detail_rows(detail_dict, W):
            out += C_DIM + ' ▸ ' + C_RST + row + C_EOLN + '\n'

    out += C_EOS   # カーソル以降を全クリア（古い詳細行を消す）
    sys.stdout.write(out)
    sys.stdout.flush()

def print_complete(comp_count, total_elapsed):
    sys.stdout.write('\033[?25h')  # カーソル復元
    sys.stdout.write('\n\n')
    for art in COMPLETE_ART:
        sys.stdout.write(C_GREEN + art + C_RST + '\n')
    sys.stdout.write(C_GREEN + f'\n  {comp_count} comp(s)   total {fmt_tc(total_elapsed)}{C_RST}\n\n')
    sys.stdout.flush()

# ---- メイン ----

def main():
    _win_console_init()
    raw        = sys.argv[1:]
    open_files = []
    cmd        = []
    i = 0
    while i < len(raw):
        if raw[i] == '--open' and i + 1 < len(raw):
            open_files.append(raw[i + 1])
            i += 2
        else:
            cmd.append(raw[i])
            i += 1

    if not cmd:
        print('Usage: aerender_progress.py [--open path ...] <aerender> [opts...]', file=sys.stderr)
        sys.exit(1)

    # バイナリで受けて decode_line() で安全にデコード（cp932/utf-8 自動判別）
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    )

    total_frames = None
    done         = 0
    frame_ts     = []
    wall_start   = time.time()
    comp_label   = ''
    in_tui       = False
    tui_used     = False   # 一度でも TUI を表示したら True（以後の雑多な出力を抑制）
    first_draw   = True
    spin_idx     = 0
    comp_count   = 0
    detail_dict  = {}      # PROGRESS: から収集した key→value 辞書

    # 英語/日本語版 aerender 両対応（Win日本語版は「コンポジション“名”の開始/終了」「デュレーション : N」）
    frame_re  = re.compile(r'PROGRESS:\s+\d+\s+\((\d+)\):')
    dur_re    = re.compile(r'(?:Duration|デュレーション)\s*[:：]\s*(\d+)')
    # 開始: 英語 Starting composition "名" / 日本語 コンポジション“名”の開始（引用符は版で異なるため緩く捕捉）
    start_re  = re.compile(r'Starting composition\s+[“"](.+?)[”".]|コンポジション(.+?)の開始')
    finish_re = re.compile(r'Finished composition|の終了')

    for raw in proc.stdout:
        line    = decode_line(raw).rstrip()
        is_prog = line.startswith('PROGRESS:')

        # コンプ開始（PROGRESS: と非PROGRESS: 両方の可能性あり）
        m = start_re.search(line)
        if m:
            comp_label   = (m.group(1) or m.group(2) or '').strip('“”"\'「」『』 “”ﾞ　')
            total_frames = None
            done         = 0
            frame_ts     = []
            wall_start   = time.time()
            comp_count  += 1
            spin_idx     = 0
            first_draw   = True
            detail_dict.clear()
            if not is_prog and not tui_used:
                print(line); sys.stdout.flush()
            continue

        # Duration（PROGRESS: 行）
        m = dur_re.search(line)
        if m:
            total_frames = int(m.group(1))
            continue

        # フレーム進捗 → TUI 描画
        mf = frame_re.search(line)
        if mf and total_frames:
            done = int(mf.group(1))
            frame_ts.append(time.time())
            recent  = frame_ts[-31:]
            avg_sec = (recent[-1] - recent[0]) / (len(recent) - 1) if len(recent) >= 2 else 0
            print_tui(comp_label, done, total_frames, avg_sec, wall_start, spin_idx, first_draw, detail_dict)
            tui_used   = True
            in_tui     = True
            first_draw = False
            spin_idx  += 1
            continue

        # コンプ完了 → 100% 確定表示後に改行
        if finish_re.search(line):
            if in_tui and total_frames:
                avg_sec = (frame_ts[-1]-frame_ts[0])/(len(frame_ts)-1) if len(frame_ts) >= 2 else 0
                print_tui(comp_label, total_frames, total_frames, avg_sec, wall_start, spin_idx, False, detail_dict)
                sys.stdout.write('\n')   # Line 3 末尾から改行して後続出力を分離
                in_tui = False
            continue

        # PROGRESS: 行 → key: value をパースして辞書に蓄積（日本語キーは英語正準キーへ正規化）
        if is_prog:
            content = line[len('PROGRESS:'):].strip()
            if ':' in content:
                k, _, v = content.partition(':')
                k = k.strip()
                k = KEY_ALIASES.get(k, k)
                detail_dict[k] = v.strip()
            continue

        # 非PROGRESS 行: TUI 開始前のみ表示
        if not tui_used and line.strip():
            print(line); sys.stdout.flush()

    proc.wait()
    total_elapsed = time.time() - wall_start

    if proc.returncode == 0:
        print_complete(comp_count, total_elapsed)
        if open_files:
            try:
                ans = input('  Open output? [Y/n]: ')
            except (EOFError, KeyboardInterrupt):
                ans = 'n'
            if ans.strip().lower() != 'n':
                for f in open_files:
                    open_path(f)
        sys.stdout.write('\n')
    else:
        sys.stdout.write('\033[?25h')  # カーソル復元
        if in_tui:
            sys.stdout.write('\n')
        print(f'\n  ✗ aerender exited with code {proc.returncode}', file=sys.stderr)

    sys.exit(proc.returncode)

if __name__ == '__main__':
    main()

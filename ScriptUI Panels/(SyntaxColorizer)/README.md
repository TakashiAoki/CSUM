# SyntaxColorizer

After Effects のテキストレイヤーを **構文彩色（シンタックスハイライト）** するドッキング可能な ScriptUI パネル。
ログ／コード／FUI テキストを、AE のエクスプレッションエディタや macOS ターミナルと同じ配色で一発彩色できます。

A dockable After Effects ScriptUI panel that **syntax-highlights a text layer** — colorize log / code / FUI text with the same palettes as the AE expression editor or your macOS Terminal.

> 解析は Python(Pygments) に委譲し、AE は描画だけを担当します（ASH が Mac で動かない Python2 依存問題を回避した設計）。
> Heavy parsing runs in Python (Pygments); AE only draws. This avoids ASH's Python2-on-macOS problem.

---

## Install

1. `SyntaxColorizer.jsx` と `(SyntaxColorizer)/` フォルダを **AE の `Scripts/ScriptUI Panels/` に一式コピー**。
2. AE 環境設定 →「スクリプトとエクスプレッション」→ **「スクリプトによるファイルへの書き込みとネットワークへのアクセスを許可」を ON**（Python 呼び出しに必要）。
3. AE 再起動 → **Window メニュー > SyntaxColorizer** でドッキング。
4. Python 依存を導入：`pip install pygments`（PNG モードは `pillow` も）。`SyntaxColorizer.jsx` 先頭 `CFG.python` を環境に合わせる（既定 `python3`、見つからなければ `python3` にフォールバック）。

## Usage

彩色したい **テキストレイヤーを選択** → パネルで Mode / Theme を選び **Apply**。

| 機能 | 説明 |
| --- | --- |
| **Mode: Live Text** | 編集可能なテキストのまま彩色（kind ごとに Color Control エフェクト `SC_*` ＋ Index レンジセレクタ）。〜20-30 行向け |
| **Mode: PNG (scroll)** | 色付き画像を生成してスクロール（長尺ログ向け・軽量） |
| **Theme** | `(SyntaxColorizer)/themes/*.json` から選択。色見本グリッドでプレビュー（ABC 順・Background 末尾） |
| **Wipe-in** | 1 文字ずつ表示（任意） |
| **Background layer** | コンポサイズ追従の背景シェイプ `SC_BG` を下に追加（テーマの背景色） |
| **Apply（再）** | 彩色済みレイヤーへの再 Apply は **パレットの色だけ高速差し替え**（再トークン化なし） |
| **Reset** | 1 クリックで `SC_*` エフェクト・色アニメーター・`SC_BG` を除去し適用前へ。テキスト本体は不変 |

## テーマの取り込み / Importing themes

- **AE エクスプレッションエディタのテーマ**：`import_ae_theme.py --current`（現在使用中）/ `--theme "Monokai"` / `--list`。AE 設定（prefs）を直接読むため AE API は不要・安全。
- **macOS Terminal のプロファイル色**も `tokyo_night` のように変換可能（`com.apple.Terminal.plist` から）。

```sh
python3 import_ae_theme.py --theme "Solarized Dark" -o themes/ae_solarized_dark.json
```

## 実装メモ / Notes

- AE レンジセレクタは **改行を index に数えない** → `index = offset − 改行数` で補正。
- 色セレクタは **Smoothness=0**、Index 単位は `Range Advanced > Range Units = 2` を先に設定。
- 管理エフェクト接頭辞 `SC_`（SyntaxColorizer-managed）。

## Requirements

- After Effects 2025 / 2026（ScriptUI / Text Animators）
- Python 3 ＋ `pygments`（PNG モードは `pillow`）
- macOS（AE theme / Terminal theme 取り込みは macOS の prefs を読む）

Copyright © Over Ray Studio — MIT License（CSUM スイートに準拠）

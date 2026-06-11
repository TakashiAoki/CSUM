# CmdRender — Python 3 セットアップガイド / Python 3 Setup Guide

`CmdRender.jsx` は **Python 3** が入っていると、レンダリング進捗をターミナル上の
TUI（プログレスバー・フレームカウンタ・完了アート・出力フォルダOpen確認）で表示します。

- **Python 3 が無くてもCmdRenderは動作します**（エラーにはなりません）
- その場合は標準の aerender ログ表示にフォールバックします
- 追加のPythonパッケージは**不要**です（標準ライブラリのみで動作）

*CmdRender works without Python 3 (falls back to the plain aerender log).
Installing Python 3 enables the TUI progress display. No pip packages required.*

---

## 確認方法 / Check

ターミナル（Mac）/ コマンドプロンプト（Win）で:

```
python3 --version        # Mac
py --version             # Windows
```

`Python 3.x.x` が表示されればインストール済みです。次回のCmdRender実行からTUIが有効になります。

---

## インストール / Install

### macOS

いずれか1つでOK:

1. **Command Line Tools（推奨・Apple公式）**
   ```
   xcode-select --install
   ```
2. **公式インストーラ**: https://www.python.org/downloads/ からダウンロードして実行
3. **Homebrew**: `brew install python3`

### Windows

いずれか1つでOK:

1. **winget（推奨）** — コマンドプロンプトで:
   ```
   winget install -e --id Python.Python.3.12
   ```
2. **公式インストーラ**: https://www.python.org/downloads/ からダウンロードして実行
   （インストールオプションはデフォルトのままでOK）

> ⚠️ **Microsoft Store版の注意**: スタートメニューで `python` と打つと出てくる
> Store アプリのスタブは実体がないことがあります。CmdRender は実体インストール
> （winget / 公式インストーラ）を優先検出するため、上記いずれかでの導入を推奨します。

---

## 仕組み / How it works

- CmdRender が `(Resource)/command/aerender_progress.py` を呼び出して aerender の出力を解析・表示します
- 検出順（Win）: ユーザーインストール → システム → `py` ランチャー → PATH
- 検出（Mac）: `python3` コマンドの存在チェック
- Python 未検出時は aerender を直接実行（従来表示）

---

Over Ray Studio / Takashi Aoki — LastUpdate: 2026-06-11

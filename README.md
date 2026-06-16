# CSUM — After Effects Script Suite for Anime Compositing

アニメ撮影(コンポジット)・モニターグラフィックス制作のために開発した After Effects スクリプト群です。2006年からスタジオ実務で使い続けてきたツールセットを、AE 2025/2026・Mac/Windows 両対応に整備して公開します。

A suite of After Effects scripts developed for anime compositing ("satsuei") and monitor graphics work, refined through studio production use since 2006. Now maintained for AE 2025/2026 on both macOS and Windows.

![After Effects](https://img.shields.io/badge/After_Effects-2025%20%2F%202026-9999ff) ![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey) ![License](https://img.shields.io/badge/license-MIT-green)

> 🚧 **先行公開版 / Early Access** — 現在、現場の方々に使用感を伺っているベータ段階です。フィードバックは [Issues](../../issues) へお気軽にどうぞ。

---

## 構成 / Structure

```
Scripts/
├── CSUMCC/
│   ├── (Tools)/          内部共通モジュール(設定ロード・キャッシュ管理 等)
│   ├── (Utility)/
│   │   ├── 00_Setup/     環境設定・AEPフォルダを開く 等
│   │   ├── 10_Startup/   カット作業の初期セットアップ(StartSetUp 等)
│   │   ├── 20_Edit/      コンポ編集(EditCompSettings / KeyOptimizer 等)
│   │   ├── 40_Effects/   定番エフェクト適用ワンタッチ群
│   │   ├── 50_FFX/       FFXプリセット適用系
│   │   ├── 60_Assist/    作業補助(色替え・整列・ワイプ 等)
│   │   └── 90_ExportRender/  書き出し・レンダー(BatchRender / CmdRender 等)
│   ├── (Resource)/       RS/OMテンプレート(.ars/.aom)・アイコン・補助ツール
│   └── toFileMenu/       ファイルメニュー常駐系(CSUM_GotoTime)
├── Startup/CSUMCC_Startup.jsx     AE起動時の初期化(設定ロード)
├── Shutdown/CSUMCC_Shutdown.jsx   AE終了時の後始末
└── ScriptUI Panels/
    └── SyntaxColorizer.jsx        テキストレイヤーを構文彩色するドッキングパネル(要 Python + Pygments)
```

### SyntaxColorizer

テキストレイヤーを **構文彩色(シンタックスハイライト)** するドッキング可能な ScriptUI パネル。ログ・コード・FUI テキストを、AE のエクスプレッションエディタや macOS ターミナルと同じ配色で一発彩色できます(解析は Python/Pygments、描画は AE)。
A dockable ScriptUI panel that syntax-highlights a text layer — colorize log / code / FUI text with the same palettes as the AE expression editor or your Terminal. 詳細 / details → [`ScriptUI Panels/(SyntaxColorizer)/README.md`](ScriptUI%20Panels/(SyntaxColorizer)/README.md)

## インストール / Install

1. このリポジトリの内容を After Effects の Scripts フォルダへコピー:
   - **macOS**: `/Applications/Adobe After Effects [version]/Scripts/`
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects [version]\Support Files\Scripts\`
   - `CSUMCC/` フォルダと、`Startup/`・`Shutdown/` 内の `CSUMCC_*.jsx` を既存フォルダへ配置します
2. AE の環境設定で **「スクリプトによるファイルへの書き込みとネットワークアクセスを許可」を ON** にする(必須。起動時の設定ロードに使用します)
3. レンダー・書き出し系を使う場合は `CSUMCC/(Resource)/` の `.ars` / `.aom` をレンダーキュー設定・出力モジュールテンプレートとして読み込む
4. AE を再起動 → 「ファイル」→「スクリプト」から各スクリプトを実行
5. **SyntaxColorizer**(任意): `ScriptUI Panels/` の `SyntaxColorizer.jsx` と `(SyntaxColorizer)/` を AE の `Scripts/ScriptUI Panels/` へコピー → 「ウインドウ」メニューからドッキング。別途 `pip install pygments`(PNG モードは `pillow` も)が必要です

## 動作要件 / Requirements

- Adobe After Effects 2025 / 2026 (それ以前のバージョンは未検証)
- macOS / Windows
- 設定・キャッシュの書き込み先: Mac = Scripts フォルダ内 / Win = `%APPDATA%\CSUMCC`

### サードパーティプラグイン依存スクリプトについて

`40_Effects/` の一部はサードパーティプラグインの適用スクリプトです。**該当プラグインがない環境ではそのスクリプトだけ使えません**(他には影響しません)。

| スクリプト | 必要プラグイン |
|---|---|
| `FLDepthOfField.jsx` / `FLOutOfFocus.jsx` | Frischluft Lenscare |
| `OpticalFlares.jsx` | Video Copilot Optical Flares |
| `VcOrb.jsx` | Video Copilot Orb |
| `Shine.jsx` | Trapcode Shine (Red Giant / Maxon) |
| `Smooth.jsx` | OLM Smoother (OLM Digital) |

## フィードバック / Feedback

不具合報告・要望は [Issues](../../issues) へ。日本語でどうぞ(English is also welcome)。

## ライセンス / License

[MIT License](LICENSE)

## 作者 / Author

**青木 隆 (Takashi Aoki)** / Over Ray Studio
アニメ撮影・モニターグラフィックスデザイナー。XEBEC:CG部(2000–2016)で本スイートの原型を開発、独立後も劇場・TVアニメ作品で運用を継続。

[@voyager_vision](https://x.com/voyager_vision) / [GitHub](https://github.com/TakashiAoki)

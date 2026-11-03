---
title: "区切り線を枠線の上辺だけで描く hr"
description: "Bootstrap の Reboot は hr の枠線を消し、論理プロパティの border-block-start だけを残す。縦書きや右から左の書字方向でも正しい辺に線が出る、区切り線の書き方。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [519, 523]
function: "hr"
difficulty: 2
format: 2
tags: [移植性, 可読性]
---
## ひとことで

区切り線 `hr` の枠線を一度すべて消し、ブロックの始まりの側の上辺だけに線を引くルールです。上下の余白は CSS 変数で決められ、変数がなければ `--bs-spacer` が使われます。線の位置を「上」ではなく「ブロックの始まりの辺」で書いているのが特徴です。

## コード

```css:line-numbers=519
  hr {
    margin: var(--bs-hr-margin-y, var(--bs-spacer)) 0;
    border: 0;
    border-block-start: var(--bs-border-width) solid var(--bs-hr-border-color);
  }
```

## 前提知識

- **論理プロパティ**: 上下左右ではなく、文字が流れる方向を基準にした辺で書く指定です。`block-start` は、ブロックが始まる側（横書きなら上）を表します。
- **border-block-start**: ブロック方向の始まりの辺の枠線を指定する論理プロパティです。
- **var() のフォールバック**: `var(--a, 値)` は、変数 `--a` がなければ値を使う書き方です。
- **margin の省略形**: `margin: 上下 左右` の形で、上下の余白だけを変数にしています。

## 何をしているか

### 1. 余白は変数から取り、なければ既定の値

```css:line-numbers=520
    margin: var(--bs-hr-margin-y, var(--bs-spacer)) 0;
```

`margin` の上下は `--bs-hr-margin-y` から取ります。その変数がなければ `--bs-spacer` を使い、左右の余白は `0` です。利用者は変数を一つ書くだけで、区切り線の間隔を変えられます。

### 2. 線は始まりの辺だけに引く

```css:line-numbers=521
    border: 0;
    border-block-start: var(--bs-border-width) solid var(--bs-hr-border-color);
```

`border: 0` で全部の枠線を消し、`border-block-start` だけに線を戻します。線の太さも色も変数で決まります。`block-start` を使うので、縦書きでも線は文字の流れの始まる側に出ます。

## ここがすごい

- 枠線を一度ゼロにしてから、必要な辺だけ戻すという順番が、区切り線を確実に一本にします。ブラウザの既定の枠線が残って二重線になることを防いでいます。
- 辺を論理的に指定しているので、書字方向が変わっても、線の位置が正しく決まります。
- 素直に `border-top` と書くと、縦書きのページでは線が意図しない辺に出ます。論理プロパティなら、その心配がありません。
- 色と太さも変数なので、テーマの変更に合わせて線の見た目を変えられます。

## まとめ

- 区切り線の枠線は、いったん全部消してから必要な辺だけ戻すと確実です。
- `border-block-start` は、書字方向に沿った始まりの辺を表します。
- 余白や線の色を変数にすると、テーマごとに調整できます。

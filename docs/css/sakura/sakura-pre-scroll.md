---
title: "コードブロックは横にスクロールさせる"
description: "pre に overflow-x: auto を指定して、画面より長いコードの行を横スクロールで読めるようにする。背景色と余白を付けて、コードの範囲をはっきりさせる。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [127, 135]
function: "pre"
difficulty: 1
format: 2
tags: [可読性, 移植性]
---
## ひとことで

コードブロックの `pre` 要素の見た目を決めるルールです。背景色と余白を付け、さらに `overflow-x: auto` によって、枠より長い行は横にスクロールできるようにします。長いコードを折り返すと読みにくくなるので、横スクロールを選んでいます。

## コード

```css:line-numbers=127
pre {
  background-color: #f1f1f1;
  display: block;
  padding: 1em;
  overflow-x: auto;
  margin-top: 0px;
  margin-bottom: 2.5rem;
  font-size: 0.9em;
}
```

## 前提知識

- **pre 要素**: 改行や空白をそのまま表示する HTML 要素です。コードを書くのによく使われます。
- **overflow-x**: 横方向にはみ出した内容をどう扱うかを決めるプロパティです。`auto` は必要なときだけ横スクロールバーを出します。
- **padding**: 要素の内側の余白です。背景色の箱と文字の間を広げます。
- **font-size: 0.9em**: 親より少し小さい文字の大きさです。コードは本文より少し小さく見せるのが一般的です。

## 何をしているか

### 1. 背景と余白で範囲を示す

```css:line-numbers=128
  background-color: #f1f1f1;
  display: block;
  padding: 1em;
  overflow-x: auto;
  margin-top: 0px;
```

`background-color: #f1f1f1` で、コードの範囲を薄い灰色の箱で示します。`padding: 1em` は、文字と箱の端の間の余白です。`display: block` は、コードを段落と同じように一行全体で扱うという指定です。

### 2. はみ出した行は横スクロールさせる

```css:line-numbers=131
  overflow-x: auto;
```

`overflow-x: auto` は、箱の幅を超える行が出たときだけ横のスクロールバーを出します。読み手は、箱の中で左右に動かしながら、行の続きを読めます。

### 3. 文字の大きさを少し小さくする

```css:line-numbers=134
  font-size: 0.9em;
```

`font-size: 0.9em` で、コードを本文より少し小さくします。コードは情報量が多いので、同じ大きさだと窮屈に見えることがあるためです。

## ここがすごい

- 折り返さずに横スクロールにすることで、コードのインデントの見た目が崩れません。プログラムの読みやすさを優先した選択です。
- 一つのプロパティ `overflow-x: auto` で、必要なときだけ横スクロールバーが出ます。短いコードでは、何も出ません。
- 素直に `pre { white-space: pre-wrap; }` にすると、長い行が折り返され、インデントの位置がずれて見えます。
- 文字の大きさを `em` で書いているので、本文の大きさが変わっても、コードとの比率が保たれます。

## まとめ

- `pre` は改行と空白をそのまま表示するので、コードに向いています。
- `overflow-x: auto` で、長い行を横スクロールで読めます。
- 背景色と余白を付けると、コードの範囲がはっきりします。
- 文字を少し小さくすると、本文との違いが伝わります。

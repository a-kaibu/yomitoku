---
title: "長い文字を一行に収めて … で省略する"
description: "Bootstrap の .text-truncate は overflow: hidden、text-overflow: ellipsis、white-space: nowrap の三つを組み合わせ、はみ出した文字を … で省略する。一覧の表示で役立つ一行の省略。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [838, 842]
function: "\".text-truncate\""
difficulty: 1
format: 2
tags: [文字列処理, レイアウト]
---
## ひとことで

文字が箱の幅を超えたとき、一行に収めて、はみ出した部分を `…`（省略記号）で置き換えるユーティリティです。一覧のタイトルや長いファイル名のように、一行で表示したい場所に使います。

## コード

```css:line-numbers=838
  .text-truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
```

## 前提知識

- **white-space: nowrap**: 文字を折り返さず、一行に並べる指定です。
- **overflow: hidden**: 箱からはみ出した部分を隠す指定です。
- **text-overflow: ellipsis**: はみ出した部分を、省略記号 `…` で示す指定です。この指定は、`overflow` が隠す設定のときに効きます。
- **箱の幅**: 省略は、箱の幅が決まっているときにだけ起きます。幅の指定がない箱では、文字は広がるだけです。

## 何をしているか

### 1. 折り返さない

```css:line-numbers=840
    text-overflow: ellipsis;
```

`white-space: nowrap` は、文字を一行に保ちます。折り返さないので、はみ出しが一行の中で起きます。

### 2. はみ出しを隠して省略記号を出す

```css:line-numbers=839
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
```

`overflow: hidden` で、はみ出した部分を隠します。`text-overflow: ellipsis` で、隠した場所に `…` を表示します。この三つが揃うと、一行の省略が完成します。

## ここがすごい

- 三つの宣言だけで、省略の表示が作れます。JavaScript で文字を切る必要はありません。
- 文字の切れ目が、ブラウザの計算で正確に決まるので、文字の幅がさまざまな言語でも崩れません。
- 素直に文字数で切ると、フォントや文字の種類によって、見た目の幅が揃いません。ブラウザに任せると、見えている幅で正しく省略されます。
- 省略された文字は、HTML の中にそのまま残るので、検索や読み上げには全文が残ります。

## まとめ

- `nowrap`、`hidden`、`ellipsis` の三つで一行の省略ができます。
- 省略はブラウザの計算に任せると、見た目の幅で正確に切れます。
- 元の文字は HTML に残るので、読み上げや検索に影響しません。

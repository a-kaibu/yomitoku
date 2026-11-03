---
title: "隠した箱の中身もまとめて切り抜く"
description: "Bootstrap の .visually-hidden * は、隠された要素の子孫すべてに overflow: hidden を付ける。中の要素がはみ出して見えてしまうのを防ぐ、子孫セレクタの使い方。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [821, 824]
function: "\".visually-hidden *, .visually-hidden-focusable:not(:focus, :focus-within) *\""
difficulty: 3
format: 2
tags: [防御的プログラミング, アクセシビリティ]
---
## ひとことで

`.visually-hidden` の中にある、すべての子孫の要素に `overflow: hidden` を付けるルールです。親の箱は 1px に縮んで切り抜かれていますが、中の要素が大きいままだと、はみ出して見えてしまうことがあります。そのはみ出しを、子孫ごとに止めています。

## コード

```css:line-numbers=821
  .visually-hidden *,
  .visually-hidden-focusable:not(:focus, :focus-within) * {
    overflow: hidden !important;
  }
```

## 前提知識

- **子孫セレクタ `*`**: ある要素の中にあるすべての要素に一致する書き方です。`A *` は、A の中の全要素を表します。
- **overflow: hidden**: 箱からはみ出した中身を隠す指定です。
- **はみ出し**: 子要素が親の箱を超えて広がることです。親が小さくても、子は大きいままになることがあります。
- **!important**: 優先させる指定です。ここでも、部品の隠し方を確実にするために付いています。

## 何をしているか

### 1. 子孫の要素のはみ出しを止める

```css:line-numbers=821
  .visually-hidden *,
  .visually-hidden-focusable:not(:focus, :focus-within) * {
    overflow: hidden !important;
```

`.visually-hidden *` は、隠された箱の中にあるすべての要素に一致します。その要素に `overflow: hidden !important` を当てると、子の要素がはみ出して見えることがなくなります。

## ここがすごい

- 親だけを隠しても、子が見えてしまう問題を、子孫セレクタで一括して防いでいます。
- `*` を使うので、中にどんな要素が入っても、同じように隠れます。新しい構造にも対応できます。
- 素直に、親の `overflow` だけを指定すると、子の要素が親の外側に広がる場合があります。子にも同じ指定をすると、その問題を防げます。
- 子孫の数が多いと負担になりますが、この部品は見えない文字を入れるための小さな箱なので、実用上の問題はほとんどありません。

## まとめ

- `*` の子孫セレクタで、中のすべての要素に同じ指定を当てられます。
- 隠した箱の子要素がはみ出すと、見えてしまうことがあります。
- 子孫に同じ指定をすると、どんな中身でも隠れた状態が保てます。

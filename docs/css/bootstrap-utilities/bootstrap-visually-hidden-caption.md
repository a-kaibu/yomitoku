---
title: "表のキャプション以外を .visually-hidden で隠さない"
description: "Bootstrap の .visually-hidden:not(caption) は、表の caption には position: absolute を付けない。表の見出しを読み上げの対象として残すための除外条件。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [817, 820]
function: "\".visually-hidden:not(caption), .visually-hidden-focusable:not(caption)\""
difficulty: 3
format: 2
tags: [アクセシビリティ, 防御的プログラミング]
---
## ひとことで

`.visually-hidden` の中でも、表のキャプション（`caption`）にだけは、絶対配置の指定を付けないルールです。キャプションは表の見出しのような役割を持ち、隠し方によっては、読み上げの位置が正しく扱われなくなることがあります。そのため、この要素だけは除外しています。

## コード

```css:line-numbers=817
  .visually-hidden:not(caption),
  .visually-hidden-focusable:not(:focus, :focus-within):not(caption) {
    position: absolute !important;
  }
```

## 前提知識

- **caption 要素**: 表（table）の見出しを表す HTML 要素です。表の一番上に置かれます。
- **position: absolute**: 要素を、基準の箱からの相対位置で置く指定です。
- **:not()**: 条件に一致しない要素だけを選ぶ否定の疑似クラスです。
- **表と読み上げ**: 表の見出しは、読み上げで表の内容を理解するために重要です。

## 何をしているか

### 1. 絶対配置の対象から外す

```css:line-numbers=817
  .visually-hidden:not(caption),
  .visually-hidden-focusable:not(:focus, :focus-within):not(caption) {
    position: absolute !important;
```

`.visually-hidden:not(caption)` は、caption 以外の隠された要素だけに絶対配置を付けます。caption を含む場合は、この宣言が読まれないので、caption の位置は通常どおりになります。

## ここがすごい

- 一つの否定条件で、表の見出しという特別な役割を持つ要素を、隠し方の例外にしています。
- 隠す方法を統一したまま、表の構造に応じた例外を書けるので、ほかの部品にも同じ考え方が使えます。
- 素直に、すべての隠す要素を同じ方法で扱うと、表のキャプションが読み上げで崩れる場合があります。除外の条件を書くことで、その問題を防げます。
- 小さなセレクタの違いですが、アクセシビリティの仕様に沿った丁寧な扱いです。

## まとめ

- `:not(caption)` で、表の見出しを隠し方の例外にできます。
- 特別な役割を持つ要素は、一般のルールから外すと安全です。
- 読み上げの構造を守るために、セレクタの条件を丁寧に書きます。

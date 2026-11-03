---
title: "本文の最初と最後の要素の外側の余白をなくす"
description: ".markdown-body の直下の最初の子の margin-top と、最後の子の margin-bottom を 0 にする。本文の端で余白が二重に広がるのを、important 付きで防ぐ。"
language: css
project: undefined
repo: https://github.com/sindresorhus/github-markdown-css
license: MIT
copyright: "\"Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)\""
commit: "7f38dcb9054bc5d860fac65291f5c98fef47932c"
file: github-markdown.css
lines: [518, 524]
function: "\".markdown-body>*:first-child, .markdown-body>*:last-child\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 設計パターン]
---
## ひとことで

本文の一番上の要素の上の余白と、一番下の要素の下の余白をゼロにするルールです。段落や見出しは、それぞれ外側に余白を持っています。本文の端にある要素の余白が、外側の箱の余白と重なって、二重に広がるのを防ぎます。

## コード

```css:line-numbers=518
.markdown-body>*:first-child {
  margin-top: 0 !important;
}

.markdown-body>*:last-child {
  margin-bottom: 0 !important;
}
```

## 前提知識

- **外側の余白（margin）**: 要素の外に取られる空間です。ブロック要素の上と下に付くのが普通です。
- **:first-child と :last-child**: 親の中で最初と最後に置かれた子要素に一致する疑似クラスです。
- **>（子セレクタ）**: 直接の子要素だけを対象にする書き方です。`.markdown-body>*` は、本文の直下の要素だけに一致します。
- **!important**: ほかの指定より優先させる指定です。

## 何をしているか

### 1. 最初の要素の上の余白

```css:line-numbers=518
.markdown-body>*:first-child {
  margin-top: 0 !important;
}
```

本文の直下の最初の要素の `margin-top` をゼロにします。本文の上端に、段落の余白が残るのを防ぎます。

### 2. 最後の要素の下の余白

```css:line-numbers=522
.markdown-body>*:last-child {
  margin-bottom: 0 !important;
}
```

最後の要素の `margin-bottom` をゼロにします。本文の下端に余計な空白が残らないので、本文を囲む箱の高さが、中身にぴったり合います。

## ここがすごい

- 本文の直下の子だけを対象にするので、本文の中の入れ子の要素の余白には触れません。端だけを調整する、ピンポイントの指定です。
- `!important` を付けて、本文の中のどの要素の指定よりも優先させています。Markdown の書き方によって、どんな要素が最初や最後に来ても、同じ結果になります。
- 素直に `p:first-child { margin-top: 0; }` のように書くと、本文の直下でない要素まで対象になることがあります。`>` で直接の子に限ると、意図した範囲だけを変えられます。
- 上の余白と下の余白を別々の規則にして、役割をはっきり分けています。

## まとめ

- `:first-child` と `:last-child` で、本文の端の要素を選べます。
- `>` で直接の子に限ると、対象が意図した範囲に収まります。
- 端の余白をゼロにすると、本文を囲む箱と中身の高さが合います。

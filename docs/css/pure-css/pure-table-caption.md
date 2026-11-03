---
title: "表のキャプションを斜めの小さな文字で中央に置く"
description: "Pure CSS の .pure-table caption は、色、斜体、小さめの文字、上下の余白を決め、表の見出しを中央に置く。表の内容と見出しの役割を、見た目で分ける定義。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/tables/css/tables.css
lines: [9, 14]
function: "\".pure-table caption\""
difficulty: 1
format: 2
tags: [可読性, 移植性]
---
## ひとことで

表の `caption`（表の見出し）を、黒い文字の斜体で、少し小さく、中央に置くルールです。表の本体とは別の見た目にすることで、見出しの役割が一目で伝わります。

## コード

```css:line-numbers=9
.pure-table caption {
    color: #000;
    font: italic 85%/1 arial, sans-serif;
    padding: 1em 0;
    text-align: center;
}
```

## 前提知識

- **caption 要素**: 表の見出しを表す HTML 要素です。表の一番上に置かれます。
- **font の省略形**: `font: italic 85%/1 arial, sans-serif` は、斜体、文字の大きさ、行の高さ、フォントを一度に書く省略形です。`85%/1` の `/1` が行の高さです。
- **text-align: center**: 文字を中央にそろえる指定です。
- **padding**: 要素の内側の余白です。上下の `1em` で、表との間を空けます。

## 何をしているか

### 1. 色とフォント

```css:line-numbers=10
    color: #000;
    font: italic 85%/1 arial, sans-serif;
    padding: 1em 0;
```

文字の色は黒、フォントは斜体で、文字の大きさは親の 85%、行の高さは 1 です。`font` の省略形で、これらを一行にまとめています。

### 2. 位置と余白

```css:line-numbers=13
    text-align: center;
```

`text-align: center` で、見出しを中央に置きます。上下の余白 `1em` で、表の本体との間を空けます。

## ここがすごい

- 斜体と小さな文字という、控えめな組み合わせで、見出しを本体の情報から区別しています。
- `font` の省略形で、五つの値を一行にまとめています。読むときも、書くときも、全体の見た目が一目でわかります。
- 素直に、見出しを `div` で作って表の外に置く方法もあります。`caption` を使うと、表と見出しの関係が HTML に残り、読み上げの助けにもなります。
- 余白を `em` で決めているので、見出しの文字の大きさが変わると、余白も比例して変わります。

## まとめ

- `caption` は、表の見出しを表す要素です。
- `font` の省略形で、文字の見た目を一度に決められます。
- 見出しを表の一部として書くと、構造と見た目が両立します。

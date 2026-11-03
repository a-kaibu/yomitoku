---
title: "文字色を白に固定するクラス"
description: "Chota の .text-white は color を #fff に固定し、!important で上書きする。濃い背景の上に置く文字だけ白にしたいときの、一行のユーティリティ。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_util.css
lines: [74, 76]
function: "\".text-white\""
difficulty: 1
format: 2
tags: [配色]
---
## ひとことで

Chota の `.text-white` は、文字の色を白に固定するクラスです。濃い背景の上に文字を置くときに使います。

## コード

```css:line-numbers=74
.text-white {
  color: #fff !important;
}
```

## 前提知識

- **color**: 文字の色を決めるプロパティです。
- **#fff**: 白を表す十六進の色の書き方です。`#ffffff` と同じ意味です。
- **!important**: 他のルールより優先させる指定です。

## 何をしているか

### 1. 文字色を白にする

```css:line-numbers=75
  color: #fff !important;
```

`color` に白を入れています。背景が暗い箇所で文字が読めるようにするための指定です。

### 2. 強制する

```css:line-numbers=74
.text-white {
  color: #fff !important;
}
```

`!important` を付けているため、`.text-primary` などの色が同じ要素に付いていても、白が勝ちます。

## ここがすごい

色の値を一か所に書くだけで、用途が一目でわかります。テーマ変数を使わず白を固定しているので、どのテーマでも白い文字が必要な場面に使えます。

白い文字は、暗い背景や濃い色のボタンの上で目立ちます。このクラスを使うと、テーマの色を変えても、この部分の文字だけは白のまま残せます。色の名前ではなく具体的な値を書いているため、どこで白が使われているかが、コードを読めばわかります。

白い文字のクラスは、色の名前より用途を示す形で使うと、後から読んだ人にも意図が伝わります。ただし白を固定すると、明るい背景では読めなくなるため、使う場所は濃い背景に限るのが基本です。この一行は、その使い方を HTML 側で明示するための道具です。

## まとめ

`.text-white` は、白い文字を強制するための、最も小さな部品です。

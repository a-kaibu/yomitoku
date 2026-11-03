---
title: "背景色を !important で強制する小さな部品"
description: "Chota の .bg-primary は、背景色にテーマの色変数を入れ、!important で他のルールより優先させる。色だけを一時的に差し替える、ユーティリティ・クラスの考え方。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_util.css
lines: [2, 4]
function: "\".bg-primary\""
difficulty: 1
format: 2
tags: [配色, 設計パターン]
---
## ひとことで

Chota の `.bg-primary` は、要素の背景色をテーマの主色にするためのクラスです。HTML に class を付けるだけで、色を変えられます。

## コード

```css:line-numbers=2
.bg-primary {
  background-color: var(--color-primary) !important;
}
```

## 前提知識

- **CSS 変数**: `var(--color-primary)` のように、名前を付けた値を後から読み出す仕組みです。テーマの色を一か所で決められます。
- **ユーティリティ・クラス**: 「この色を付ける」「余白をなくす」のように、一つの役割だけを持つクラスです。
- **!important**: 同じ要素に当たる他のルールより、この宣言を優先させる指定です。

## 何をしているか

### 1. 背景色を変数で指定する

```css:line-numbers=3
  background-color: var(--color-primary) !important;
```

背景色に直接色を書かず、`--color-primary` という変数を読みます。テーマの主色を変えると、このクラスも同時に変わります。

### 2. 他の指定より優先させる

```css:line-numbers=2
.bg-primary {
  background-color: var(--color-primary) !important;
}
```

`!important` を付けることで、要素に直接書かれた色や、他のクラスの色より優先されます。ユーティリティは「最後にひと押しする」ための道具なので、この強さが役立ちます。

## ここがすごい

色の名前ではなく役割の変数を読むので、同じクラスを `.bg-error` や `.bg-success` と並べて使えます。HTML 側は色の値を知らなくてよくなります。

ユーティリティ・クラスは、一度だけ使う装飾を、HTML 側で素早く付けるための道具です。背景色をテーマの変数で決めておくと、デザインを変えたときに、このクラスを使う場所を書き換えずに済みます。!important を使うのは、他の指定に負けないように、最後の一押しをするためです。

## まとめ

`.bg-primary` は、変数で色を決めて、`!important` で確実に当てる、軽い部品です。

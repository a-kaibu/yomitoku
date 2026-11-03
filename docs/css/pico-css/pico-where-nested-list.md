---
title: ":where() でリストの中のリストの余白を詰める"
description: "ol と ul の li の下の余白を 0.25 倍にし、入れ子のリストの上の余白だけを残す。:where() を使って、詳細度を増やさずに入れ子の余白を整える書き方。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [853, 855]
function: "\":where(ol, ul) li\""
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

`ol` と `ul` の中にある `li` の下の余白を、本文の上下の余白の 4 分の 1 に減らすルールです。`:where()` で囲んでいるので、このルールの詳細度はゼロになります。利用者が後から書いた指定が、必ずこのルールより優先されます。

## コード

```css:line-numbers=853
:where(ol, ul) li {
  margin-bottom: calc(var(--pico-typography-spacing-vertical) * 0.25);
}
```

## 前提知識

- **ol と ul**: 番号付きのリスト（ol）と、記号付きのリスト（ul）を表す HTML 要素です。
- **li 要素**: リストの一つ一つの項目を表す要素です。
- **詳細度**: CSS の指定がどれだけ優先されるかを表す指標です。`:where()` の中の条件は、詳細度に数えられません。
- **calc()**: 数式を CSS の中で計算する関数です。`var()` と混ぜて書けます。

## 何をしているか

### 1. 項目の下の余白を計算する

```css:line-numbers=853
:where(ol, ul) li {
  margin-bottom: calc(var(--pico-typography-spacing-vertical) * 0.25);
}
```

`margin-bottom` は、`--pico-typography-spacing-vertical` という文字の上下余白の変数に `0.25` を掛けた値です。本文の余白に比べると、リストの項目の間は、ずっと詰まって見えます。変数を使っているので、本文の余白を変えると、リストの余白も一緒に変わります。

## ここがすごい

- `:where()` を使うことで、詳細度がゼロになっています。読み手が `li { margin-bottom: 1rem; }` と書けば、それが優先されます。
- 掛け算の係数だけを書いて、基準の値は変数から取っています。デザインの基準が変わっても、比率は保たれます。
- 素直に `li { margin-bottom: 0.25rem; }` と書くと、基準の余白と無関係に固定の値になります。変数を使うと、全体の調子が揃います。
- ol と ul をまとめて対象にしているので、番号付きでも記号付きでも同じ見た目になります。

## まとめ

- `:where()` で囲むと、詳細度を増やさずに対象を指定できます。
- 余白は基準の変数に係数を掛けると、デザイン全体と調子が揃います。
- 利用者が後から上書きしやすい書き方は、部品のライブラリの基本です。

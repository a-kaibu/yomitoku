---
title: "表の見出し行を灰色の背景でそろえる"
description: "Pure CSS の .pure-table thead は、灰色の背景、黒い文字、左寄せ、下寄せを一度に指定する。表の見出し行を、本体の行と見分けやすくする定義。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/tables/css/tables.css
lines: [26, 31]
function: "\".pure-table thead\""
difficulty: 1
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

表の見出し部分（`thead`）に、背景色、文字色、文字の揃え方、縦の揃え方をまとめて付けるルールです。見出しの行が本体と違う色になり、どの列が何を表すかが一目でわかります。

## コード

```css:line-numbers=26
.pure-table thead {
    background-color: #e0e0e0;
    color: #000;
    text-align: left;
    vertical-align: bottom;
}
```

## 前提知識

- **thead 要素**: 表の見出しの行をまとめる HTML 要素です。
- **vertical-align: bottom**: 行の中で、要素を下端に揃える指定です。見出しの文字が、列の下にそろいます。
- **text-align: left**: 文字を左にそろえる指定です。
- **表の構造**: 表は `thead`（見出し）、`tbody`（本体）のように、役割ごとに分けて書きます。

## 何をしているか

### 1. 背景色と文字色

```css:line-numbers=27
    background-color: #e0e0e0;
    color: #000;
```

`background-color: #e0e0e0` で、見出し全体を薄い灰色にします。`color: #000` は、文字を黒にします。背景の灰色の上で、文字が読めるように選ばれています。

### 2. 文字の揃え方

```css:line-numbers=29
    text-align: left;
    vertical-align: bottom;
```

`text-align: left` で、見出しの文字を左にそろえます。`vertical-align: bottom` で、列の下端に寄せます。見出しと本体の数字の位置が、違和感なく並びます。

## ここがすごい

- 見出し行をまとめて指定するので、列を増やしても、見出しの見た目は自動で揃います。
- 見出しの背景を灰色にするだけで、本体との区別が生まれます。線を引かなくても、構造が伝わります。
- 素直に、見出しの各セルに個別のクラスを付けると、列が増えるたびに書き足す必要があります。`thead` にまとめると、その手間が要りません。
- 下寄せは、見出しの文字が一行でも複数行でも、本体の上端と揃いにくくなる問題を避けるための選択です。

## まとめ

- `thead` に見出しの見た目をまとめると、列が増えても揃います。
- 背景色と文字色で、見出しを本体と区別できます。
- 見出しの揃え方を決めておくと、表全体の見た目が安定します。

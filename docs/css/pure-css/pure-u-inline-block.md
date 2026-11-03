---
title: "並べる列を inline-block で作る .pure-u"
description: "Pure CSS の .pure-u は inline-block と vertical-align: top だけで列を作る。flex を使わず、文字と同じ行の流れに乗せて並べる、軽量なグリッドの列の定義。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/grids/css/grids-core.css
lines: [11, 14]
function: "\".pure-u\""
difficulty: 2
format: 2
tags: [レイアウト, 移植性]
---
## ひとことで

Pure CSS のグリッドで、一つ一つの列を表す `.pure-u` の定義です。`display: inline-block` で、列を文字と同じ行の流れに乗せて横に並べます。`vertical-align: top` は、高さの違う列を上にそろえる指定です。

## コード

```css:line-numbers=11
.pure-u {
    display: inline-block;
    vertical-align: top;
}
```

## 前提知識

- **inline-block**: 文字と同じ行に並びながら、幅と高さを持てる箱にする指定です。横に並べるのに使えますが、隙間が入りやすいという癖があります。
- **vertical-align**: 行の中で要素を上下にどう揃えるかを決めるプロパティです。`top` は、行の上端に揃えます。
- **グリッド**: 画面を格子に分けて、部品を並べる考え方です。Pure では、親の `.pure-g` の中に `.pure-u` を並べます。
- **幅の指定**: 列の幅は、`.pure-u-1-2` のようなクラスで別に決められます。この定義は、並べる役割だけを持ちます。

## 何をしているか

### 1. 文字と同じ行に並べる

```css:line-numbers=12
    display: inline-block;
```

`display: inline-block` によって、列は前後の列と同じ行に並びます。幅が足りなくなると、次の行に回ります。

### 2. 上端にそろえる

```css:line-numbers=13
    vertical-align: top;
```

`vertical-align: top` は、列の中身の高さが違っても、上端をそろえます。カードのような列を横に並べたときに、見出しの位置が揃います。

## ここがすごい

- `flex` を使わずに横並びを作るので、古いブラウザでも動きやすい設計です。Pure は、なるべく古い環境で動くことを重視しています。
- 役割を「並べる」と「幅を決める」に分けているので、列の幅のクラスを変えるだけで、レイアウトを組み替えられます。
- 素直に `float: left` で並べると、高さの違う列の後片付けが必要になります。inline-block なら、行の流れに任せて並べられます。
- inline-block の列の間には、文字の空白の分だけ隙間が入ります。Pure は、その隙間を親の文字間隔の指定で打ち消しています。

## まとめ

- `inline-block` で、列を文字と同じ行の流れに並べられます。
- `vertical-align: top` で、列の上端をそろえられます。
- 並べる役割と幅の役割を分けると、組み替えが簡単になります。

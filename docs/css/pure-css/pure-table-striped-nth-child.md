---
title: "奇数番目の行を色付きにする tr:nth-child(2n-1)"
description: "Pure CSS の .pure-table-striped は tr:nth-child(2n-1) の td に背景色を付け、奇数番目の行を縞模様にする。クラスを付けなくても、行の番号だけで縞が決まる書き方。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/tables/css/tables.css
lines: [46, 48]
function: "\".pure-table-striped tr:nth-child(2n-1) td\""
difficulty: 2
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

`pure-table-striped` のクラスを付けた表で、奇数番目の行のセルに背景色を付けるルールです。表の行が交互に色分けされ、目で追いやすくなります。`nth-child` を使うので、行の数が変わっても、縞は自動で続きます。

## コード

```css:line-numbers=46
.pure-table-striped tr:nth-child(2n-1) td {
    background-color: #f2f2f2;
}
```

## 前提知識

- **nth-child(2n-1)**: 親の中で、`2n-1` という式に当てはまる番号の子要素を選ぶ疑似クラスです。`n` が 0 から増えるので、1、3、5 番目の要素が選ばれます。
- **tr と td**: 表の行と、セルです。
- **縞模様（ストライプ）**: 行を交互に色分けして、読みやすくする表のデザインです。
- **背景色をセルに付ける**: 行全体ではなく、セルに色を付けることで、表の枠線との関係が安定します。

## 何をしているか

### 1. 対象を奇数番目の行に絞る

```css:line-numbers=46
.pure-table-striped tr:nth-child(2n-1) td {
```

`tr:nth-child(2n-1)` は、行の番号が 1、3、5…のものに一致します。`.pure-table-striped` の表だけが対象です。

### 2. 行の中のセルに背景色を付ける

```css:line-numbers=47
    background-color: #f2f2f2;
```

行の中の `td` に、薄い灰色の背景を付けます。行全体ではなくセルに付けるので、表の枠線やボーダーの描き方と喧嘩しにくくなります。

## ここがすごい

- 行にクラスを付けなくても、番号の式だけで縞模様が決まります。行の追加や削除にも自動で対応します。
- `2n-1` という式は、奇数番目を一度に表す、短くて正確な書き方です。
- 素直に、行ごとにクラスを付けると、データを作るたびに手作業が必要になります。`nth-child` にすると、データの数に関係なく縞が続きます。
- 古いブラウザでは `nth-child` が効かないことがあります。コメントにあるとおり、この指定は「モダンなブラウザ向け」として分けられています。

## まとめ

- `nth-child(2n-1)` で、奇数番目の行を選べます。
- セルに背景色を付けると、表の枠線と揃いやすくなります。
- 番号の式で縞を作ると、行の数が変わっても崩れません。

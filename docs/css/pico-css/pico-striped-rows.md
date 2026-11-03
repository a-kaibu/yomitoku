---
title: "偶数行ではなく奇数行の背景色を変える"
description: "table.striped の tbody の tr のうち、nth-child(odd) の td だけに背景色を付けるルール。表の行の縞模様を、変数の色で作る書き方。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [1149, 1151]
function: "\"table.striped tbody tr:nth-child(odd) td\""
difficulty: 2
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

`striped` というクラスを付けた表で、奇数番目の行のセルだけに背景色を付けるルールです。表の行が縞模様になり、目で行を追いやすくなります。色は変数で決められているので、テーマに合わせて変えられます。

## コード

```css:line-numbers=1149
table.striped tbody tr:nth-child(odd) td {
  background-color: var(--pico-table-row-stripped-background-color);
}
```

## 前提知識

- **table と tbody と tr**: 表の要素です。`tbody` が本体部分、`tr` が行、`td` がセルです。
- **nth-child(odd)**: 親の中で、奇数番目の子要素に一致する疑似クラスです。最初、三番目、五番目…の行が対象になります。
- **子孫セレクタ**: `A B C D` のように、空白でつないで階層の深さを指定する書き方です。
- **縞模様（ストライプ）**: 行を交互に色分けして、読みやすくする表のデザインです。

## 何をしているか

### 1. 対象を選ぶ

```css:line-numbers=1149
table.striped tbody tr:nth-child(odd) td {
```

`table.striped` の中の `tbody` の `tr` のうち、奇数番目のものにあるセルを選びます。`striped` クラスを付けた表だけが対象で、ほかの表には影響しません。

### 2. 背景色を変数で付ける

```css:line-numbers=1150
  background-color: var(--pico-table-row-stripped-background-color);
```

背景色は `--pico-table-row-stripped-background-color` という変数から取ります。この変数はテーマごとに定義されているので、ライトとダークで縞の色が自然に変わります。

## ここがすごい

- 偶数行ではなく奇数行を選んでいるのは、最初の行を色付きにして、表の頭から縞がはじまるようにするためです。
- 行ではなくセルに背景色を付けているので、`tr` に背景を付けるよりも、表の枠線との関係が安定します。
- 素直に、行ごとにクラスを付けると、行を追加するたびに手作業が必要になります。`nth-child` にすると、行が増えても自動で縞になります。
- 色の値を変数にしているので、テーマの変更が縞の色にも自然に反映されます。

## まとめ

- `nth-child(odd)` で、奇数番目の行だけを選べます。
- `striped` のようなクラスを付けた表だけに限定すると、他の表に影響しません。
- 縞の色を変数にすると、テーマに合わせて自然に変わります。

---
title: "並び順を逆にして、同じ HTML で左右を入れ替える"
description: "row に reverse を付けると flex-direction が row-reverse になり、列の並びが右から左へ変わる。HTML の順番を変えずに見た目だけを入れ替える。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_grid.css
lines: [16, 18]
function: "\".row.reverse\""
difficulty: 1
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

`row` に `reverse` を付けたとき、中の列の並びを右から左へ逆にするルールです。`flex-direction: row-reverse` によって、横方向の並ぶ順番が反転します。HTML の書く順番は変えずに、見た目だけを入れ替えられます。

## コード

```css:line-numbers=16
.row.reverse {
  flex-direction: row-reverse;
}
```

## 前提知識

- **flex-direction**: flex の子要素をどの向きに並べるかを決めるプロパティです。`row` は左から右、`row-reverse` は右から左です。
- **主軸**: flex の並ぶ方向のことです。`row` や `row-reverse` のときは横方向になります。
- **HTML の順番**: 画面に読み上げやキーボードで移動するときの順番を決めるものです。見た目の並びとは別に考える必要があります。
- **クラスの組み合わせ**: `row reverse` のように、複数のクラスを同じ要素に付けて、性質を重ねる書き方です。

## 何をしているか

### 1. 並ぶ向きを反転させる

```css:line-numbers=16
.row.reverse {
  flex-direction: row-reverse;
}
```

`.row.reverse` は、`row` と `reverse` の両方のクラスを持つ要素にだけ一致します。一致した要素は `flex-direction: row-reverse` になり、子要素が右端から並びます。

HTML の列の順番は変わりません。たとえば「本文」「サイドバー」の順で書いておけば、見た目ではサイドバーが左に来ます。

## ここがすごい

- 見た目の入れ替えを、クラスを一つ付けるだけで行えます。HTML を組み替える必要がありません。
- ただし、このクラスは見た目だけを変えるものなので、読み上げの順番は元の HTML のままです。コードを読む人には、その違いを意識させるつくりです。
- 素直に、左右の列を別々に書いて入れ替えると、同じ内容を二度書くことになります。クラスで向きを切り替えるほうが、内容の変更にも強くなります。
- `.row.reverse` とセレクタを二つつなげるので、`reverse` だけを単独で使うことはなく、行の意味が明確です。

## まとめ

- `flex-direction: row-reverse` で、並ぶ向きを反転できます。
- HTML の順番を変えずに、見た目だけを入れ替えられます。
- 読み上げの順番は元のままになるので、順番の意味は別に考えます。
- クラスを重ねると、既存の行の性質を部分的に変えられます。

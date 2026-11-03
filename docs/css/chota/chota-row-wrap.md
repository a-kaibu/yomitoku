---
title: "flex-wrap で折り返す行を作る"
description: "row クラスで display: flex と flex-wrap: wrap を使い、列が入りきらなくなったら次の行へ回す。列の左右の余白を負の値で打ち消す仕組み。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_grid.css
lines: [8, 14]
function: "\".row\""
difficulty: 2
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

列を並べる `.row` の定義です。`display: flex` で中の列を横に並べ、`flex-wrap: wrap` で入りきらなくなった列を次の行へ回します。左右の `margin` を負の値にすることで、列の間の余白がコンテナの端から飛び出さないようにしています。

## コード

```css:line-numbers=8
.row {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  margin-left: calc(var(--grid-gutter) / -2);
  margin-right: calc(var(--grid-gutter) / -2);
}
```

## 前提知識

- **flexbox**: 子要素を横か縦に並べ、余った空間の配分などを指定できるレイアウトの仕組みです。`display: flex` で有効になります。
- **flex-flow**: `flex-direction` と `flex-wrap` を一度に書くための省略形です。`row wrap` は、横方向に並べ、折り返すという意味です。
- **justify-content**: 主軸（横）方向の揃え方を決めます。`flex-start` は左寄せです。
- **負の margin**: 値が負の `margin` は、要素を外側へ広げる働きをします。

## 何をしているか

### 1. 横に並べて、折り返す

```css:line-numbers=9
  display: flex;
  flex-flow: row wrap;
```

`display: flex` で子要素を横に並べます。`flex-flow: row wrap` は、横方向に並べ、幅が足りなくなったら次の行に回すという指定です。列の数が増えても、折り返しで自然に積み重なります。

### 2. 左右の余白を打ち消す

```css:line-numbers=12
  margin-left: calc(var(--grid-gutter) / -2);
  margin-right: calc(var(--grid-gutter) / -2);
```

列には、後で見るように左右に余白が付きます。その分、行そのものを左右に `gutter / 2` ずつ広げて、外側の見た目を揃えています。`margin-left` と `margin-right` を負の値にするのが、この打ち消しの仕組みです。

## ここがすごい

- 列の余白を `margin` で入れておき、行の側でその分を負の値で戻す、という対になった設計です。外から見ると、列の端がコンテナの端にぴったり揃います。
- `justify-content: flex-start` を明示しているので、列が少ないときも左から並びます。空いた場所を右側に残す、という予想外の動きを防いでいます。
- 素直に `float` で列を並べると、高さの違う列が崩れやすくなります。flex と `wrap` を使うと、折り返しの位置を自動で決められます。
- 行の余白の計算がすべて変数なので、ガターを変えても、行と列の関係が保たれます。

## まとめ

- `display: flex` と `flex-wrap: wrap` で、折り返す行を作れます。
- 列の余白を負の margin で打ち消すと、外側の端が揃います。
- `justify-content` で、列が少ないときの配置も決められます。
- 古い `float` の方法より、列の高さのずれに強くなります。

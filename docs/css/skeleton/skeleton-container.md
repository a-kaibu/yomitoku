---
title: "float のグリッドで最大幅を決めるコンテナ"
description: "Skeleton の container は、最大幅 960px と左右のゆとりを持ち、画面が広がるにつれて幅の割合を変える。float で列を並べる古典的なグリッドの土台。"
language: css
project: undefined
repo: https://github.com/dhg/Skeleton
license: MIT
copyright: "\"Copyright (c) 2011-2014 Dave Gamache\""
commit: "88f03612b05f093e3f235ced77cf89d3a8fcf846"
file: css/skeleton.css
lines: [31, 37]
function: "\".container\""
difficulty: 1
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

ページの本文を囲む `.container` の定義です。最大幅を 960px に決め、左右の `margin` を `auto` にして中央に置きます。`padding` で左右にゆとりを持たせ、`box-sizing: border-box` で、その余白を幅の中に含めています。

## コード

```css:line-numbers=31
.container {
  position: relative;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box; }
```

## 前提知識

- **position: relative**: 要素を通常の位置に置いたまま、子要素の配置の基準にする指定です。ここでは、中の列の位置の基準になります。
- **max-width**: 幅の上限です。画面が広くても、960px より広がりません。
- **margin: 0 auto**: 上下の余白をゼロにして、左右をブラウザに任せます。左右が自動だと、余った幅が二等分されて中央に寄ります。
- **box-sizing**: 幅に余白や枠線を含めるかどうかを決めるプロパティです。`border-box` は、含めます。

## 何をしているか

### 1. 幅と最大幅

```css:line-numbers=32
  position: relative;
  width: 100%;
  max-width: 960px;
```

`width: 100%` で、まず親の幅いっぱいに広がります。`max-width: 960px` で、大きな画面でも 960px までに抑えます。`position: relative` は、中の列の基準を作るための指定です。

### 2. 中央にそろえて余白を取る

```css:line-numbers=35
  margin: 0 auto;
  padding: 0 20px;
  box-sizing: border-box; }
```

`margin: 0 auto` で中央にそろえ、`padding: 0 20px` で左右に 20px の余白を取ります。`box-sizing: border-box` により、この余白は幅の 960px の中に含まれます。

## ここがすごい

- 最大幅、中央そろえ、余白を四つの宣言で揃えていて、読んですぐに意図がわかります。
- `box-sizing: border-box` を付けているので、`padding` を足しても、幅が勝手に広がりません。
- 素直に `width: 960px` と書くと、小さな画面で横スクロールが出ます。`width: 100%` と `max-width` の組み合わせなら、画面に合わせて縮みます。
- 960px という値は、当時の画面の標準的な幅を意識して選ばれたものです。最大の幅を決めておくと、広い画面で文章が読みにくくなるのを防げます。

## まとめ

- `width: 100%` と `max-width` で、画面に合わせて縮み、上限を持つ箱になります。
- `margin: 0 auto` で中央に置けます。
- `box-sizing: border-box` を付けると、余白が幅を押し広げません。

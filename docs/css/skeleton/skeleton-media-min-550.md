---
title: "550px からは列の左に 4% の余白を入れる"
description: "min-width 550px の media query で、列の左側に 4% の余白を入れ、最初の列だけは余白をゼロにする。列と列の間に隙間を作るための、割合の余白の仕組み。"
language: css
project: undefined
repo: https://github.com/dhg/Skeleton
license: MIT
copyright: "\"Copyright (c) 2011-2014 Dave Gamache\""
commit: "88f03612b05f093e3f235ced77cf89d3a8fcf846"
file: css/skeleton.css
lines: [52, 60]
function: "\"@media (min-width: 550px)\""
difficulty: 2
format: 2
tags: [移植性, 数値計算]
---
## ひとことで

画面の幅が 550px 以上のときに、列と列の間に `4%` の余白を入れるルールです。コンテナの幅を 80% にし、列の左側に余白を付けます。行の先頭の列だけは、余白をゼロに戻して、左端にそろえています。

## コード

```css:line-numbers=52
@media (min-width: 550px) {
  .container {
    width: 80%; }
  .column,
  .columns {
    margin-left: 4%; }
  .column:first-child,
  .columns:first-child {
    margin-left: 0; }
```

## 前提知識

- **margin-left**: 要素の左側の外の余白です。列同士の隙間を作るのに使います。
- **:first-child**: 親の中で最初に置かれた子要素に一致する疑似クラスです。
- **割合の余白**: 親の幅に対する割合で決まる余白です。画面が広がると、余白も比例して広がります。
- **列の幅の割合**: 後の規則で、列の幅を割合で決めています。余白も割合にすると、全体の比率が崩れません。

## 何をしているか

### 1. コンテナを 80% にする

```css:line-numbers=53
  .container {
    width: 80%; }
```

550px 以上では、コンテナの幅が `80%` になります。左右に少し余裕を持たせながら、列を並べるための幅を確保します。

### 2. 列の左に余白を入れる

```css:line-numbers=55
  .column,
  .columns {
    margin-left: 4%; }
```

`.column` と `.columns` の左側に `4%` の余白を入れます。この余白が列の間の隙間になります。

### 3. 最初の列だけ余白をなくす

```css:line-numbers=58
  .column:first-child,
  .columns:first-child {
    margin-left: 0; }
```

`:first-child` の列は `margin-left: 0` にして、行の左端にそろえます。左端の列に隙間が入るのを防ぐための例外です。

## ここがすごい

- 列の間の隙間が、割合の余白で作られているので、画面が広がっても隙間の比率は変わりません。
- 最初の列だけ余白をゼロにするという一つの例外で、行の端を正確にそろえています。
- 素直に、すべての列に余白を付けると、行の左端に余計な隙間ができます。`:first-child` で例外を作るのが、この書き方のポイントです。
- 割合の幅と割合の余白を組み合わせると、全体の計算が一つの数式で表せます。

## まとめ

- 列の間の隙間は、列の左の余白で作ります。
- `:first-child` で、行の先頭だけ余白を消せます。
- 割合で余白を決めると、画面の大きさに合わせて比率が保たれます。

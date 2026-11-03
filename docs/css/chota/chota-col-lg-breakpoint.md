---
title: "1200px 以上では列を十二分割の細かい幅で指定する"
description: "min-width 1200px の media query の中で col-1-lg の幅を定義する。広い画面で、中くらいの画面とは別の列幅を使うための、三段階のブレークポイントの最後の一つ。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_grid.css
lines: [166, 169]
function: "\".col-1-lg\""
difficulty: 2
format: 2
tags: [設計パターン, 移植性]
---
## ひとことで

画面の幅が 1200px 以上のとき、`col-1-lg` の列の幅を決めるルールです。小さな画面、中くらいの画面、大きな画面と、三つの段階ごとに列の幅を変えられるようにしています。このルールは、その最後の段階を担当します。

## コード

```css:line-numbers=166
  .col-1-lg {
    flex: 0 0 calc((100% / (12/1)) - var(--grid-gutter));
    max-width: calc((100% / (12/1)) - var(--grid-gutter));
  }
```

## 前提知識

- **ブレークポイント**: 画面の幅によって CSS を切り替える境目のことです。このファイルでは 599px、900px、1200px の三つが使われています。
- **lg と md**: `lg` は large（大きい）、`md` は medium（中くらい）を表す接尾辞です。
- **min-width**: 画面の幅がこの値以上のときに一致する条件です。
- **flex-basis と max-width**: 列の基準の幅と上限です。どちらにも同じ値を入れています。

## 何をしているか

### 1. 大きな画面の列の幅

```css:line-numbers=166
  .col-1-lg {
    flex: 0 0 calc((100% / (12/1)) - var(--grid-gutter));
    max-width: calc((100% / (12/1)) - var(--grid-gutter));
  }
```

`.col-1-lg` は、1200px 以上で有効になります。宣言の中身は `.col-1-md` と同じ計算式です。画面が 1200px を超えると、`lg` の規則が `md` の規則より後で効くので、列の幅がここで決まります。

## ここがすごい

- 三つの段階が同じ形で並んでいるので、規則の書き方を一度覚えれば、ほかの段階も読めます。
- 小さな画面から大きな画面へ、段階的に幅を変えるので、画面が広がるにつれて列が細かく分かれます。
- 素直に、JavaScript で画面の幅を測って列の幅を変えると、読み込みの遅れや点滅が起きがちです。CSS の media query なら、そうした問題がありません。
- 計算式が同じなので、ガターを変えても三つの段階が同じように揃います。

## まとめ

- 三つの media query で、画面の幅に応じて列の幅を切り替えられます。
- 接尾辞の `lg` は、大きな画面で効くことを示します。
- 同じ計算式を使うと、段階ごとの違いが画面の幅だけになります。
- JavaScript を使わずに、画面の変化に応じた列の幅を作れます。

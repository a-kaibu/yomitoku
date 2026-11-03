---
title: "最大幅を決めて中央にそろえるコンテナ"
description: "container クラスで最大幅を決め、左右の余白を auto にして中央に置く。幅 96% にしておき、狭い画面では 100% に広げる、小さな CSS フレームワークの土台。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_grid.css
lines: [1, 6]
function: "\".container\""
difficulty: 1
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

ページの本文を囲む `.container` クラスの定義です。最大幅を変数で決め、左右の `margin` を `auto` にして、箱をページの中央に置きます。幅は 96% にして、画面の左右に少しだけ余白を残しています。

## コード

```css:line-numbers=1
.container {
  max-width: var(--grid-maxWidth);
  margin: 0 auto;
  width: 96%;
  padding: 0 calc(var(--grid-gutter) / 2);
}
```

## 前提知識

- **max-width**: 要素の幅の上限です。画面がどれだけ広くても、この値より広がりません。
- **margin: auto**: 左右の外側の余白を `auto` にすると、ブラウザが余った幅を左右に等分します。その結果、箱が中央に並びます。
- **CSS 変数**: `var(--grid-maxWidth)` のように、値を名前で読み出す仕組みです。値はテーマごとに変えられます。
- **calc()**: 数式を CSS の中で計算する関数です。`calc(var(--grid-gutter) / 2)` は、変数の値を半分にした長さになります。

## 何をしているか

### 1. 最大幅と中央そろえ

```css:line-numbers=2
  max-width: var(--grid-maxWidth);
  margin: 0 auto;
```

`max-width` で、コンテナが広がりすぎないように上限を決めます。`margin: 0 auto` は、上と下の余白をゼロにし、左右をブラウザに任せます。左右が auto だと、余った幅が二等分されるので、中央に寄ります。

### 2. 幅と余白

```css:line-numbers=4
  width: 96%;
  padding: 0 calc(var(--grid-gutter) / 2);
```

`width: 96%` は、画面の幅に比例して箱を広げます。左右に 2% ずつ、ぼんやりした余白が残ります。`padding` は `--grid-gutter` の半分で、中身の文字が端に張り付くのを防ぎます。

## ここがすごい

- 固定の幅ではなく、`max-width` と `%` の組み合わせにしているので、スマートフォンから大きな画面まで同じ CSS で動きます。
- 中央にそろえる方法が `margin: 0 auto` の一行だけで、特別な配置の仕組みが要りません。
- 素直に `width: 1200px` と書くと、小さな画面で横スクロールが出ます。最大幅で上限を決めると、この問題を防げます。
- 余白を変数の半分として計算しているので、ガター（列の間隔）を変えても、左右の余白が自動で合います。

## まとめ

- `max-width` で最大の幅を決めると、広い画面でも読みやすい幅に収まります。
- `margin: 0 auto` は、箱を中央に置くための定番の書き方です。
- `%` と `max-width` の組み合わせは、画面の幅に合わせて自然に縮みます。
- 余白は変数から計算すると、グリッドの間隔と揃います。

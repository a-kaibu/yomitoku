---
title: "擬似要素の :after で float を閉じる"
description: ".container、.row、.u-cf の :after に display: table と clear: both を付けて、float で並べた列の高さを親が含むようにする。float の後片付けを一か所で行うクリアフィックス。"
language: css
project: undefined
repo: https://github.com/dhg/Skeleton
license: MIT
copyright: "\"Copyright (c) 2011-2014 Dave Gamache\""
commit: "88f03612b05f093e3f235ced77cf89d3a8fcf846"
file: css/skeleton.css
lines: [387, 393]
function: "\".container:after, .row:after, .u-cf\""
difficulty: 3
format: 2
tags: [ハック, イディオム]
---
## ひとことで

`float` で並べた列は、親の高さに含まれなくなります。その問題を直すため、親の要素の最後に空の箱を付けて、`clear: both` で float を閉じるルールです。`.container`、`.row`、`.u-cf` の三つのクラスに、同じ後処理を付けています。

## コード

```css:line-numbers=387
.container:after,
.row:after,
.u-cf {
  content: "";
  display: table;
  clear: both; }

```

## 前提知識

- **float と高さ**: `float` の要素は、通常の流れから外れるので、親の高さの計算に含まれないことがあります。
- **clear: both**: 左右の float を、その下に回り込まないようにする指定です。
- **:after**: 要素の最後に、仮想的な箱を作る疑似要素です。HTML に要素を増やさずに使えます。
- **display: table**: 要素を表の箱として扱う指定です。`:after` に使うと、余白を生まずに clear の効果を得られます。

## 何をしているか

### 1. 空の箱を親の最後に作る

```css:line-numbers=387
.container:after,
.row:after,
.u-cf {
```

`.container:after`、`.row:after`、`.u-cf` の三つのセレクタに、同じ宣言を当てています。`:after` は、親の最後に置かれる仮想の箱です。`content: ""` は、中身が空のまま存在させる指定です。

### 2. float を閉じる

```css:line-numbers=390
  content: "";
  display: table;
  clear: both; }
```

`display: table` で箱を表として扱い、`clear: both` で左右の float の下に回り込むのを止めます。こうすると、この箱が、float で並んだ列のすぐ下に置かれます。親はその箱を含むので、列の高さを含めて広がります。

## ここがすごい

- 親の要素に `overflow: hidden` を付けて高さを確保する方法もあります。ここでは、空の箱で float を閉じるので、はみ出した表示を隠さずに済みます。
- 三つのセレクタで同じ後処理を共有しているので、新しい行を作るときにも、同じクラスを付けるだけで高さが揃います。
- 素直に、列の後ろに空の `div` を書く方法もあります。HTML を汚すことになるので、CSS の疑似要素で済ませるほうが、構造が保たれます。
- コメントの「Self Clearing Goodness」が示すとおり、この書き方は「自分で閉じる」クリアフィックスとして広く使われた定番です。

## まとめ

- float で並べた要素は、親の高さに含まれないことがあります。
- `:after` と `clear: both` で、親が列の高さを含むようになります。
- HTML を増やさず、CSS だけで後片付けできます。

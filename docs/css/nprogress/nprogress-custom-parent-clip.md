---
title: "進捗バーを親要素の中に閉じ込める"
description: "NProgress の .nprogress-custom-parent は、親要素を overflow: hidden と position: relative にして、中で動く進捗バーが外にはみ出さないようにする。枠の中だけで表示する場合の指定。"
language: css
project: undefined
repo: https://github.com/rstacruz/nprogress
license: MIT
copyright: "\"Copyright (c) 2013, 2014 Rico Sta. Cruz\""
commit: "e1a8b7fb6e059085df5f83c45d3c2308a147ca18"
file: nprogress.css
lines: [56, 59]
function: "\".nprogress-custom-parent\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

NProgress の `.nprogress-custom-parent` は、進捗バーを画面全体ではなく、一つの枠の中に出したいときに使う指定です。親の外へはみ出さないように切り取ります。

## コード

```css:line-numbers=56
.nprogress-custom-parent {
  overflow: hidden;
  position: relative;
}
```

## 前提知識

- **position: relative**: 要素を自分の元の位置を基準に置く指定です。この中の position: absolute や fixed の子が、その要素を基準にできます。
- **overflow: hidden**: 箱の外にはみ出した部分を見えなくする指定です。
- **基準の箱**: 位置の指定は、一番近い position が付いた親を基準にします。

## 何をしているか

### 1. 親を基準の箱にする

```css:line-numbers=57
  overflow: hidden;
  position: relative;
```

親に `position: relative` を付けると、中のバーは、この親の範囲を基準に配置されます。

### 2. はみ出しを切る

```css:line-numbers=57
  overflow: hidden;
```

`overflow: hidden` によって、親の箱の外側にはみ出した部分は描かれません。バーの先端の光も、枠の外には出ません。

## ここがすごい

NProgress 本体のルールを変えずに、この一つのクラスを付けるだけで、表示の範囲を絞れます。ページ全体ではなく、カードや表の中に進捗を出すような使い方に向いています。

親の箱の大きさは、中に置かれた要素の大きさで決まります。バーを置く親がカードのように小さければ、進捗もその幅の中で伸びます。外にはみ出さない性質があるため、画面の他の部品を押しのけることもありません。この指定は、表示の範囲を親に任せる、控えめで確実な方法です。

## まとめ

position: relative と overflow: hidden の組み合わせは、進捗表示を一つの枠の中に閉じ込める定番の手法です。

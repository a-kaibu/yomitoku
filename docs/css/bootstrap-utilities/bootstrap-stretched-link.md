---
title: "カード全体をクリックできるリンクにする .stretched-link"
description: "Bootstrap の .stretched-link は、リンクの ::after を親いっぱいに広げて透明に重ねる。カードのどこを押してもリンクが開くようにする、位置の仕組み。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [827, 835]
function: "\".stretched-link, .stretched-link::after\""
difficulty: 3
format: 2
tags: [レイアウト, 設計パターン]
---
## ひとことで

リンクに `stretched-link` クラスを付けると、そのリンクの `::after` が、基準になる箱（通常はカード）いっぱいに広がって重なります。すると、カードのどこをクリックしても、そのリンクが開きます。リンクの文字を一つだけ書けば、カード全体を押せるようになります。

## コード

```css:line-numbers=827
  .stretched-link {
    --bs-stretched-link-z-index: 1;
  }
  .stretched-link::after {
    position: absolute;
    inset: 0;
    z-index: var(--bs-stretched-link-z-index);
    content: "";
  }
```

## 前提知識

- **疑似要素 ::after**: 要素の後ろに仮想的な箱を作る仕組みです。HTML の要素を増やさずに、重ねる箱として使えます。
- **position: absolute と inset: 0**: 絶対配置の箱を、基準の箱の四辺いっぱいに広げる指定です。`inset: 0` は、上下左右をすべてゼロにする省略形です。
- **z-index**: 重なりの順番を決める値です。大きいほど前に出ます。
- **基準の箱（position: relative）**: 絶対配置の基準になる、外側の箱の指定です。

## 何をしているか

### 1. リンクの重なり順を決める

```css:line-numbers=828
    --bs-stretched-link-z-index: 1;
  }
```

`--bs-stretched-link-z-index: 1` で、リンクの疑似要素が前に出る順番を変数として決めます。

### 2. 基準の箱いっぱいに広がる透明な箱

```css:line-numbers=830
  .stretched-link::after {
    position: absolute;
    inset: 0;
    z-index: var(--bs-stretched-link-z-index);
    content: "";
```

`::after` を絶対配置にし、`inset: 0` で親の四辺いっぱいに広げます。`z-index` で、ほかの要素より前に置きます。`content: ""` は、中身の空の箱として存在させる指定です。見た目は何もありませんが、クリックを受け止めます。

## ここがすごい

- HTML の構造を変えずに、カード全体をリンクにできます。カードの中に別のリンクがあると、それは重なりの影響を受けるので、設計の注意点もあります。
- `inset: 0` の一行で、上下左右を同時に決めています。古い書き方より、意図が読み取りやすくなっています。
- 素直に、カードの全体を `a` で囲むと、中に別のリンクを置けなくなります。疑似要素を使うと、その制限を避けられます。
- 見た目が変わらず、クリックの範囲だけが広がるので、利用者には自然な動きに感じられます。

## まとめ

- `::after` を親いっぱいに広げると、カード全体を押せるようになります。
- `inset: 0` は、四辺をまとめてゼロにする省略形です。
- 基準の箱（relative）と重なりの順番を決めておくと、意図どおりに動きます。

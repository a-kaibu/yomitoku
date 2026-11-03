---
title: "読み込みの進捗バーを画面の最上部に固定する"
description: "NProgress の #nprogress .bar は position: fixed で画面の上端に 2px の帯を置き、幅 100% で全体の進み具合を示す。ページ遷移の進捗を、本文に触れずに見せる仕組み。"
language: css
project: undefined
repo: https://github.com/rstacruz/nprogress
license: MIT
copyright: "\"Copyright (c) 2013, 2014 Rico Sta. Cruz\""
commit: "e1a8b7fb6e059085df5f83c45d3c2308a147ca18"
file: nprogress.css
lines: [6, 16]
function: "\"#nprogress .bar\""
difficulty: 2
format: 2
tags: [レイアウト, アニメーション]
---
## ひとことで

NProgress は、ページの読み込みを示す細い進捗バーです。画面の最上部に固定された帯が、読み込みの進み具合に合わせて伸びます。

## コード

```css:line-numbers=6
#nprogress .bar {
  background: #29d;

  position: fixed;
  z-index: 1031;
  top: 0;
  left: 0;

  width: 100%;
  height: 2px;
}
```

## 前提知識

- **position: fixed**: 要素を画面の決まった位置に置く指定です。ページをスクロールしても、同じ場所に残ります。
- **z-index**: 重なる要素の前後を決める数値です。1031 は、本文より前に出すための大きな値です。
- **幅 100%**: 親の幅いっぱいに広げる指定です。ここでは画面の幅に相当します。
- **進捗バー**: 進み具合を、帯の長さで示す部品です。JavaScript が幅を変えることで、進み具合を伝えます。

## 何をしているか

### 1. 背景と配置を決める

```css:line-numbers=7
  background: #29d;
```

バーの色を青に指定しています。読み込み中であることが、ひと目で伝わります。

```css:line-numbers=9
  position: fixed;
  z-index: 1031;
  top: 0;
  left: 0;
```

画面の左上の角に固定し、z-index で本文より前に出します。

### 2. 帯の大きさを決める

```css:line-numbers=14
  width: 100%;
  height: 2px;
```

幅を 100% に、高さを 2px にしています。細い帯なので、本文の邪魔になりません。

## ここがすごい

バーの幅だけを JavaScript が変えれば、CSS は見た目を全部引き受けます。進み具合の表示と、見た目の決まりが分かれているため、差し替えや調整がしやすくなっています。固定位置に置いても、クリックを通すための指定が別にあるため、操作の邪魔になりません。

## まとめ

fixed と z-index を組み合わせた細い帯は、読み込み中を伝える最小限の部品です。

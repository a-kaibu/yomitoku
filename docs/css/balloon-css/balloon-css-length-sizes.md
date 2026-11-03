---
title: "吹き出しの幅を段階の名前で指定する"
description: "data-balloon-length の値 small・medium・large・xlarge に、幅を 80px から 380px まで割り当てる。属性の名前で大きさを選べる仕組み。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [120, 129]
function: "\"[data-balloon-length]:after\""
difficulty: 2
format: 2
tags: [設計パターン, 可読性]
---
## ひとことで

吹き出しの幅を、`data-balloon-length` という属性の値で選べるようにするルールです。`small`、`medium`、`large`、`xlarge` の 4 段階に、それぞれ決まった幅が割り当てられています。使う側は、数字を覚えなくても、大きさの名前だけで吹き出しの幅を決められます。

## コード

```css:line-numbers=120
  [aria-label][data-balloon-pos][data-balloon-length]:after {
    white-space: normal; }
  [aria-label][data-balloon-pos][data-balloon-length="small"]:after {
    width: 80px; }
  [aria-label][data-balloon-pos][data-balloon-length="medium"]:after {
    width: 150px; }
  [aria-label][data-balloon-pos][data-balloon-length="large"]:after {
    width: 260px; }
  [aria-label][data-balloon-pos][data-balloon-length="xlarge"]:after {
    width: 380px; }
```

## 前提知識

- **属性セレクタ（値あり）**: `[data-balloon-length="small"]` のように、属性の値まで条件にするセレクタです。
- **width**: 要素の幅を決めるプロパティです。ここでは吹き出しの本体（`:after`）の幅を決めています。
- **px**: 画面上のピクセル数を表す単位です。`80px` は 80 ピクセル幅です。
- **white-space: normal**: 文字を普通に折り返す値です。幅があるときに、文字が幅の中で折り返されます。

## 何をしているか

### 1. 幅のない状態では折り返しを許す

```css:line-numbers=120
  [aria-label][data-balloon-pos][data-balloon-length]:after {
    white-space: normal; }
```

`data-balloon-length` が付いていれば、`white-space: normal` で、吹き出しの中の文字が幅に合わせて折り返されます。既定の `nowrap`（一行）は、この属性があるときに上書きされます。

### 2. 段階ごとに幅を決める

```css:line-numbers=122
  [aria-label][data-balloon-pos][data-balloon-length="small"]:after {
    width: 80px; }
  [aria-label][data-balloon-pos][data-balloon-length="medium"]:after {
    width: 150px; }
  [aria-label][data-balloon-pos][data-balloon-length="large"]:after {
    width: 260px; }
  [aria-label][data-balloon-pos][data-balloon-length="xlarge"]:after {
    width: 380px; }
```

`small` は 80px、`medium` は 150px、`large` は 260px、`xlarge` は 380px です。それぞれの段階が、属性セレクタで一つずつ分かれています。使う側は `data-balloon-length="medium"` と書くだけで、150px の吹き出しが得られます。

## ここがすごい

- 数字を覚えなくても、大きさを言葉で選べます。説明文の長さに合わせて「small」「large」を選ぶ、という直感的な使い方ができます。
- 段階ごとの幅が、同じ形の三つのセレクタで書かれているので、追加や変更がとても簡単です。
- 素直に `style="width: 150px"` のように、要素ごとに幅を書くと、同じ幅の数字が散らばります。段階の名前にすると、同じ大きさの吹き出しをそろえやすくなります。
- 幅の指定が属性の値で決まるので、JavaScript を使わずに、HTML だけで大きさを切り替えられます。

## まとめ

- `data-balloon-length` の値で、吹き出しの幅を選べます。
- 段階を名前で表すと、数字を覚えずに使えます。
- 段階の数字をそろえておくと、同じ大きさの吹き出しが揃います。
- 属性の値をセレクタにする書き方は、部品の選択肢を作るときの定番です。

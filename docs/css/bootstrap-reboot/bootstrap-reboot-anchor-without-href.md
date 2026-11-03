---
title: "名前だけの a 要素を本文の色に溶け込ませる"
description: "Bootstrap の Reboot は、href も class もない a 要素と、その上にあるリンクの見た目を、継承した色と下線なしにする。ページ内の目印として使われる a を、本文から目立たせない。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [653, 656]
function: "\"b, a:not([href], [class])\""
difficulty: 2
format: 2
tags: [防御的プログラミング, 可読性]
---
## ひとことで

`href` も `class` もない `a` 要素に、リンクらしい見た目を付けないルールです。`class` を持たない `a` は、ページ内の目印（アンカー）として使われることが多いので、色や下線を付けずに本文に溶け込ませます。`b` も同じ宣言を受け取っています。

## コード

```css:line-numbers=653
  a:not([href], [class]), a:not([href], [class]):hover {
    color: inherit;
    text-decoration: none;
  }
```

## 前提知識

- **a 要素**: リンクを表す HTML 要素です。`href` があるとリンクになります。
- **:not([href], [class])**: `href` と `class` の両方がない要素に一致する否定の条件です。`:not()` の中で二つの属性を並べると、どちらも持たない要素だけが選ばれます。
- **アンカー**: ページの中の場所に名前を付けるための `a` の使い方です。
- **color: inherit**: 親の文字色をそのまま使う指定です。

## 何をしているか

### 1. 文字色と下線を親に合わせる

```css:line-numbers=654
    color: inherit;
    text-decoration: none;
```

`color: inherit` で、ブラウザの既定のリンクの色を消して、周りの文字色を使います。`text-decoration: none` で、下線を消します。ホバーの状態も、同じ規則で消されています。

### 2. 対象を絞る

```css:line-numbers=653
  a:not([href], [class]), a:not([href], [class]):hover {
```

`:not([href], [class])` の条件で、`href` も `class` もない要素だけが対象になります。クラスを付けた `a` は、ボタンや特別なリンクとして扱われることが多いので、対象から外しています。

## ここがすごい

- `href` と `class` の両方がないことを条件にして、目印として使われる要素だけを取り出しています。見た目の上でリンクらしく見えるのは、本物のリンクだけになります。
- ホバーの状態も同じ規則に含めているので、マウスを乗せても青い色が出ません。
- 素直に `a { color: inherit; }` と書くと、クラス付きのリンクまで色が消えてしまいます。否定の条件で範囲を絞るのが、この書き方の要点です。
- `b` と同じ宣言を並べていますが、`b` は太字の要素であり、ここでは本文と色を揃えるために入っています。

## まとめ

- `:not([href], [class])` は、どちらも持たない要素だけに一致させる条件です。
- 目印として使う `a` は、色と下線を消すと本文に溶け込みます。
- 否定の条件で範囲を絞ると、本物のリンクの見た目を守れます。

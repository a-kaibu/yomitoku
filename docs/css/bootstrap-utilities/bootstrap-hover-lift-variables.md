---
title: "浮き上がりの動きを四つの変数にまとめる"
description: "Bootstrap の .hover-lift は、移動量・影・アニメーションの時間と速さの四つを CSS 変数として持つ。ホバーの動きを、クラスを付けるだけで統一した見た目にできる。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [489, 494]
function: "\".hover-lift\""
difficulty: 2
format: 2
tags: [アニメーション, 設計パターン]
---
## ひとことで

`hover-lift` クラスを付けた要素が、マウスを乗せたときに少し上に浮き上がるユーティリティです。その動きに必要な値（時間、速さ、移動量、影）を、四つの CSS 変数として最初に宣言しています。値を変えれば、動きの強さを部品ごとに調整できます。

## コード

```css:line-numbers=489
  .hover-lift {
    --bs-hover-lift-transition-duration: 0.2s;
    --bs-hover-lift-transition-timing: ease;
    --bs-hover-lift-transform: translateY(-0.25rem);
    --bs-hover-lift-box-shadow: var(--bs-box-shadow-lg);
  }
```

## 前提知識

- **CSS 変数**: `--name: 値;` で宣言し、`var(--name)` で読み出す仕組みです。
- **transition の時間と速さ**: 変化にかかる時間（duration）と、加速の付け方（timing function）です。`ease` は、始まりと終わりがなめらかな速さです。
- **translateY**: 要素を縦方向にずらす変形です。`-0.25rem` は、上へ少し持ち上がる量です。
- **box-shadow**: 要素の周りに影を描くプロパティです。

## 何をしているか

### 1. 動きを変数で決める

```css:line-numbers=490
    --bs-hover-lift-transition-duration: 0.2s;
    --bs-hover-lift-transition-timing: ease;
    --bs-hover-lift-transform: translateY(-0.25rem);
    --bs-hover-lift-box-shadow: var(--bs-box-shadow-lg);
```

`--bs-hover-lift-transition-duration` は 0.2 秒、`--bs-hover-lift-transition-timing` は `ease`、`--bs-hover-lift-transform` は上へ 0.25rem 持ち上げる値です。`--bs-hover-lift-box-shadow` は、大きめの影の変数を参照しています。

## ここがすごい

- 動きの要素を名前付きの変数に分けておくと、部品ごとに、時間や移動量だけを上書きできます。
- 影の値を、Bootstrap の全体の影の変数から取っているので、テーマの影の強さと揃います。
- 素直に `transform: translateY(-4px)` のような数字を直接書くと、テーマ全体の大きさの基準と合わなくなります。rem を使うと、文字の大きさに合わせて動きも変わります。
- 宣言を一か所にまとめているので、ホバーの動きの仕様が、読んだだけでわかります。

## まとめ

- 動きの値を変数にすると、部品ごとに上書きできます。
- 影も全体の影の変数を使うと、テーマと揃います。
- 数字を `rem` で書くと、文字の大きさに合わせて動きも比例します。

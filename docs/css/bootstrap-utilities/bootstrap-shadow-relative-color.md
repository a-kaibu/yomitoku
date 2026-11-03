---
title: "影の色を相対色の構文で作る .shadow"
description: "Bootstrap の .shadow は、影の色を oklch(from ...) の相対色の構文で作り、テーマの影の色の変数から明るさだけを調整する。色を変えると影の色も連動する。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [1042, 1044]
function: "\".shadow\""
difficulty: 3
format: 2
tags: [配色, 設計パターン]
---
## ひとことで

`shadow` クラスを付けた要素の影を描くルールです。影の色は、テーマの変数から取った色を、新しい色の書き方（`oklch(from …)`）で少し変えて作られています。影の色を変えると、影の濃さや色合いも自動で変わります。

## コード

```css:line-numbers=1042
  .shadow {
    box-shadow: 0 .125rem .25rem -.0625rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.04 * var(--bs-shadow-strength) * var(--bs-so, 1))), 0 .375rem .75rem -.125rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.05 * var(--bs-shadow-strength) * var(--bs-so, 1))), 0 .75rem 1.5rem -.25rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.06 * var(--bs-shadow-strength) * var(--bs-so, 1)));
  }
```

## 前提知識

- **box-shadow**: 要素の周りに影を描くプロパティです。`x` と `y` のずれ、ぼかし、広がり、色を指定します。
- **oklch**: 明るさ（l）、彩度（c）、色相（h）で色を表す、新しい色の表し方です。
- **相対色の構文（relative color）**: `oklch(from 色 l c h / 不透明度)` のように、ほかの色を元に、一部の成分だけを変える書き方です。
- **CSS 変数の読み出し**: `var(--bs-sc, var(--bs-shadow-color))` は、影の色の変数がなければ既定の変数を使う、二段のフォールバックです。

## 何をしているか

### 1. 影の位置とぼかし

```css:line-numbers=1043
    box-shadow: 0 .125rem .25rem -.0625rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.04 * var(--bs-shadow-strength) * var(--bs-so, 1))), 0 .375rem .75rem -.125rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.05 * var(--bs-shadow-strength) * var(--bs-so, 1))), 0 .75rem 1.5rem -.25rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.06 * var(--bs-shadow-strength) * var(--bs-so, 1)));
```

`box-shadow` の前半で、影の位置（わずかに下にずらす）、ぼかしの大きさ、広がりを決めています。`.125rem` は下方向のずれ、`.25rem` はぼかしの範囲です。

### 2. 元の色から透明度を決める

```css:line-numbers=1043
    box-shadow: 0 .125rem .25rem -.0625rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.04 * var(--bs-shadow-strength) * var(--bs-so, 1))), 0 .375rem .75rem -.125rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.05 * var(--bs-shadow-strength) * var(--bs-so, 1))), 0 .75rem 1.5rem -.25rem oklch(from var(--bs-sc, var(--bs-shadow-color)) l c h / calc(.06 * var(--bs-shadow-strength) * var(--bs-so, 1)));
```

`oklch(from var(...) l c h / calc(...))` は、影の色の変数を元に、明るさ、彩度、色相はそのまま使い、不透明度だけを計算で決めます。色のテーマが変わっても、影は同じ仕組みで追従します。

## ここがすごい

- 影の色を、別の色の値として書かず、変数の色を元に作っています。テーマの色を変えると、影の色も同じ系統で変わります。
- 透明度を計算式で決めているので、影の濃さを一つの値で調整できます。
- 素直に、影の色を `rgba(0,0,0,0.1)` のように固定すると、ダークモードなどで影が浮いて見えることがあります。変数から作ると、その問題を防げます。
- 新しい色の書き方は、対応していないブラウザでは読まれないので、この規則の前に既定の影を用意する配慮が必要になることもあります。

## まとめ

- `box-shadow` で、要素の周りに影を描けます。
- `oklch(from …)` の相対色で、既存の色の一部だけを変えられます。
- 影の色を変数から作ると、テーマの変更に自然に従います。

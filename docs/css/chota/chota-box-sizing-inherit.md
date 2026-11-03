---
title: "box-sizing は html に一度だけ書いて子孫に継承させる"
description: "Chota は html に box-sizing: border-box を書き、すべての要素と疑似要素は inherit で同じ値を受け継ぐ。全要素に直接書く方法と比べて、変更が一か所で済む書き方。"
language: css
project: undefined
repo: https://github.com/jenil/chota
license: MIT
copyright: "\"Copyright (c) 2017 Jenil Gogari\""
commit: "7d780731421fc987d8f7a1c8f66c730d8573684c"
file: src/_base.css
lines: [20, 31]
function: "\"html, *, ::before, ::after\""
difficulty: 2
format: 2
tags: [イディオム, 設計パターン]
---
## ひとことで

ページ全体の幅の計算方法を、`html` 要素の `box-sizing: border-box` 一つで決め、ほかのすべての要素と疑似要素は `inherit` でその値を受け取るルールです。`box-sizing` は、既定では継承されないので、わざわざ `inherit` と書いて引き継がせています。

## コード

```css:line-numbers=20
html {
  box-sizing: border-box;
  font-size: 62.5%;
  line-height: 1.15;
  text-size-adjust: 100%;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}
```

## 前提知識

- **box-sizing**: 要素の幅や高さに、余白と枠線を含めるかどうかを決めるプロパティです。`border-box` は含めます。
- **継承**: 親の値が子に伝わる仕組みです。多くのプロパティは継承されますが、`box-sizing` は標準では継承されません。
- **inherit**: 親の値をそのまま受け継ぐキーワードです。
- **疑似要素**: `::before` や `::after` のように、HTML にない仮想の箱です。

## 何をしているか

### 1. html で基準を決める

```css:line-numbers=20
html {
  box-sizing: border-box;
  font-size: 62.5%;
  line-height: 1.15;
  text-size-adjust: 100%;
}
```

`html` に `box-sizing: border-box` を書きます。また、`font-size: 62.5%` を指定して、既定の 16px を 10px に変えています。`line-height` と `text-size-adjust` は、文字の見え方の基準です。

### 2. すべての要素が受け取る

```css:line-numbers=27
*,
*::before,
*::after {
  box-sizing: inherit;
}
```

`*` と疑似要素は、`box-sizing: inherit` で `html` の値を受け取ります。こうすると、途中のどこかで値を変えれば、その下の要素にも影響が伝わります。

## ここがすごい

- 基準の値を `html` に一つだけ書いて、全体は継承で揃えています。ライブラリを使う側が、ある部分だけ `content-box` に戻したいときも、その要素に書けば済みます。
- `*` に直接 `border-box` と書く方法と比べて、結果は同じでも、基準がどこにあるかがはっきりします。
- 素直に全要素へ直接書くと、部分的に変えたいときに、どの値が効いているかを探す必要が出ます。継承にすると、基準が一か所に集まります。
- 継承を使う場合、途中の要素が値を変えると、その子孫だけ別の計算になります。そのため、ライブラリの側で値を書き換えない約束が大切です。

## まとめ

- `box-sizing` は標準では継承されないので、`inherit` で明示します。
- `html` に基準を書くと、一か所の変更で全体が変わります。
- 継承の仕組みは、部分的な上書きの範囲を理解しておくと安全です。

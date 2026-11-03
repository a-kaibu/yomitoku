---
title: "文字の間隔を三つの名前で切り替える"
description: "Tachyons の .tracked・.tracked-tight・.tracked-mega は、letter-spacing を .1em、-.05em、.25em に決める。見出しの字間を、数値を覚えずに名前で選ぶための決まり。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_letter-spacing.css
lines: [13, 15]
function: "\".tracked, .tracked-tight, .tracked-mega\""
difficulty: 1
format: 2
tags: [可読性]
---
## ひとことで

Tachyons の `.tracked` 系のクラスは、文字と文字の間隔を三段階の名前で選べるようにしています。見出しを広げたり、大きな文字を詰めたりするときに使います。

## コード

```css:line-numbers=13
.tracked       { letter-spacing:  .1em; }
.tracked-tight { letter-spacing: -.05em; }
.tracked-mega  { letter-spacing:  .25em; }
```

## 前提知識

- **letter-spacing**: 文字と文字の間隔を決めるプロパティです。正の値で広がり、負の値で詰まります。
- **em**: 文字の大きさを 1 とする単位です。.1em は、文字の大きさの 10% 分の間隔を加えます。
- **字間の役割**: 大きい見出しは字間を詰めると引き締まり、小さな大文字の見出しは字間を広げると読みやすくなります。

## 何をしているか

### 1. 標準の広さ

```css:line-numbers=13
.tracked       { letter-spacing:  .1em; }
```

`.tracked` は、文字の間隔を 0.1em 広げます。少し余裕のある字間になります。

### 2. 詰める

```css:line-numbers=14
.tracked-tight { letter-spacing: -.05em; }
```

`.tracked-tight` は、-0.05em で字間を詰めます。大きい見出しを、引き締めて見せられます。

### 3. 大きく広げる

```css:line-numbers=15
.tracked-mega  { letter-spacing:  .25em; }
```

`.tracked-mega` は、0.25em で字間を大きく広げます。大文字のラベルや、装飾的な見出しに向いています。

## ここがすごい

字間の値を名前で表すため、デザインの指示と HTML の書き方が、そのまま対応します。数値を覚えなくても、役割で選べます。

字間は、文字の大きさや書体によって、同じ値でも印象が変わります。そのため、名前で段階を決めておくと、見出しごとの調整がしやすくなります。tight の負の値は、大きい文字の隙間を詰め、mega の大きな値は、小さな大文字の読みやすさを上げます。役割に合わせて選べる点が、この三つの名前の良さです。

## まとめ

字間を三つの名前で決めると、見出しの性格に合わせた文字の組み方を、クラスで選べます。

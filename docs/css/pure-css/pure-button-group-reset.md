---
title: "ボタンの群れの中で文字間隔の影響を打ち消す"
description: "Pure CSS の .pure-button-group 内の .pure-button は、letter-spacing と word-spacing を normal に戻し、vertical-align を top にそろえる。親の隙間詰めを子で打ち消す。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/buttons/css/buttons-core.css
lines: [31, 36]
function: "\".pure-button-group .pure-button\""
difficulty: 3
format: 2
tags: [設計パターン, ハック]
---
## ひとことで

ボタンを並べた `.pure-button-group` の中にあるボタンの、文字の間隔と位置を、通常の状態に戻すルールです。親の `.pure-button-group` は、ボタンの間の隙間をなくすために、文字間隔を大きく詰めています。その影響を、子のボタンだけ打ち消しています。

## コード

```css:line-numbers=31
.pure-button-group .pure-button {
    letter-spacing: normal;
    word-spacing: normal;
    vertical-align: top;
    text-rendering: auto;
}
```

## 前提知識

- **letter-spacing / word-spacing**: 文字と文字の間、単語と単語の間の隙間を決めるプロパティです。
- **inline-block の隙間**: inline-block の要素を並べると、間に文字の空白が入るため、隙間が生まれることがあります。
- **子孫セレクタ**: 親の中にある要素を、階層の関係で選ぶ書き方です。
- **vertical-align: top**: 行の中で、上端をそろえる指定です。

## 何をしているか

### 1. 文字間隔と単語間隔を戻す

```css:line-numbers=32
    letter-spacing: normal;
    word-spacing: normal;
```

`letter-spacing: normal` と `word-spacing: normal` で、親が詰めた文字間隔を、標準の値に戻します。ボタンの文字が、ボタン本来の間隔で表示されます。

### 2. 位置と描画を戻す

```css:line-numbers=34
    vertical-align: top;
    text-rendering: auto;
```

`vertical-align: top` で、ボタンの上端をそろえます。`text-rendering: auto` は、親が指定した描画の方法を取り消し、ブラウザの既定に戻します。

## ここがすごい

- 親で一括して詰めた指定を、子で打ち消すという、対になった設計です。隙間を詰める指定が、ボタンの文字まで影響するのを防いでいます。
- `.pure-button-group .pure-button` は、親の中のボタンだけを対象にするので、グループの外のボタンには影響しません。
- 素直に、グループの文字間隔を変えずに、ボタンの文字だけ別のクラスで直す方法もあります。ここでは、親子の関係だけで打ち消すので、HTML を変えずに済みます。
- 親の指定が、ほかのブラウザや OS で意図しない値になる場合でも、子で既定に戻すことで安定します。

## まとめ

- inline-block の隙間を詰めるために、親の文字間隔を大きく詰めることがあります。
- 子のボタンで `normal` に戻すと、ボタンの文字は本来の間隔になります。
- 親子の対で指定すると、一括の調整と個別の例外を両立できます。

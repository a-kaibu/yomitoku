---
title: "Firefox のボタン内側の枠線を消す"
description: "Pure CSS の .pure-button::-moz-focus-inner は padding と border を 0 にして、Firefox がボタンの内側に描くフォーカス用の枠を消す。ボタンの見た目を、ほかのブラウザと同じにそろえる。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/buttons/css/buttons-core.css
lines: [15, 18]
function: "\".pure-button::-moz-focus-inner\""
difficulty: 3
format: 2
tags: [移植性, ハック]
---
## ひとことで

Firefox が、ボタンの内側に描く点線の枠（フォーカス用の内側の枠）を消すルールです。`::-moz-focus-inner` は Firefox 独自の疑似要素で、ボタンの中にある見えない箱を指します。その箱の余白と枠線をゼロにして、見た目をほかのブラウザと揃えます。

## コード

```css:line-numbers=15
.pure-button::-moz-focus-inner {
    padding: 0;
    border: 0;
}
```

## 前提知識

- **::-moz-focus-inner**: Firefox で、ボタンの内側にあるフォーカス用の箱を表す疑似要素です。
- **フォーカス枠**: キーボードでボタンを選んだときに、ブラウザが描く枠のことです。
- **padding と border**: 要素の内側の余白と枠線です。ここでは、どちらもゼロにします。
- **ブラウザ独自の部品**: 標準の仕様にない、特定のブラウザだけが持つ内側の箱のことです。

## 何をしているか

### 1. 内側の余白をゼロにする

```css:line-numbers=16
    padding: 0;
```

`padding: 0` で、Firefox の内側の箱の余白を取り除きます。これで、ボタンの文字の位置が、ほかのブラウザと同じになります。

### 2. 内側の枠線をゼロにする

```css:line-numbers=17
    border: 0;
```

`border: 0` で、Firefox がフォーカス用に描く点線の枠を消します。外側のボタンの見た目は、このルールには触れられていません。

## ここがすごい

- Firefox だけの内部の箱を、疑似要素で直接狙っています。ブラウザ間の差を、HTML を変えずに解消しています。
- コメントが、Firefox 向けの対策だと明記しています。どの環境のための指定かが、読み手にもわかります。
- 素直に `button { border: none; }` と書くと、ボタン全体の枠が消えます。内側の箱だけを狙うと、ボタンの外側の見た目は残ります。
- 内側の枠を消しても、キーボードのフォーカスの表示は別の仕組みで残せます。アクセシビリティの配慮は、別のルールで担保する必要があります。

## まとめ

- `::-moz-focus-inner` は、Firefox のボタン内部の箱を表す独自の疑似要素です。
- 内側の余白と枠線をゼロにすると、ボタンの文字の位置が揃います。
- ブラウザ独自の部品は、外側の見た目を変えずに狙うのが安全です。

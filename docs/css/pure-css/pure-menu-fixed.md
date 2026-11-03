---
title: "メニューを画面の上端に固定する"
description: "Pure CSS の .pure-menu-fixed は position: fixed で左上に張り付き、z-index: 3 で他の要素より前に出す。スクロールしても消えないメニューの作り方。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/menus/css/menus-core.css
lines: [6, 11]
function: "\".pure-menu-fixed\""
difficulty: 2
format: 2
tags: [レイアウト]
---
## ひとことで

Pure CSS の `.pure-menu-fixed` は、メニューを画面の左上に固定して、スクロールしても見えるようにするクラスです。

## コード

```css:line-numbers=6
.pure-menu-fixed {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 3;
}
```

## 前提知識

- **position: fixed**: 要素を画面の決まった位置に置く指定です。ページをスクロールしても動きません。
- **z-index**: 重なる要素の前後を決める数値です。大きいほど前に出ます。
- **left と top**: 要素の左と上の位置を決める値です。`0` は画面の左上の角を表します。

## 何をしているか

### 1. 画面に固定する

```css:line-numbers=6
.pure-menu-fixed {
    position: fixed;
```

`position: fixed` によって、要素は文書の流れから外れて、画面の基準の位置に置かれます。

### 2. 左上の角に置く

```css:line-numbers=8
    left: 0;
    top: 0;
```

left と top を 0 にして、画面の左上の角に張り付けます。

### 3. 前に出す

```css:line-numbers=10
    z-index: 3;
```

`z-index: 3` で、本文の上に重ねて表示します。

## ここがすごい

固定の位置とクラス名だけで、ヘッダーのようなメニューを簡単に作れます。JavaScript を使わずに済みます。

固定されたメニューは、スクロールしても常に見えるので、移動の手がかりになります。ただし画面の一部を常に覆うため、本文の上に重ならないように余白を取る必要があります。z-index の値は、ほかの重なる要素より前に出すための、控えめな数字にとどめるのが一般的です。このクラスは、その土台を一行で作るための指定です。

## まとめ

fixed と z-index を組み合わせると、スクロールしても見えるメニューになります。

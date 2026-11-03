---
title: "マウスを乗せたとき文字に下線を引く"
description: "Tachyons の .underline-hover は、hover と focus のときだけ text-decoration を underline にし、普段は下線を出さない。リンクの見た目を、操作に応じて変えるための小さな指定。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_hovers.css
lines: [74, 77]
function: "\".underline-hover:hover, .underline-hover:focus\""
difficulty: 1
format: 2
tags: [疑似要素, アクセシビリティ]
---
## ひとことで

Tachyons の `.underline-hover` は、マウスを乗せたときや、キーボードで選んだときに、文字へ下線を引くクラスです。普段は静かな文字が、操作の対象として見えるようになります。

## コード

```css:line-numbers=74
.underline-hover:hover,
.underline-hover:focus {
  text-decoration: underline;
}
```

## 前提知識

- **text-decoration**: 文字の装飾を決めるプロパティです。underline は下線を、none は下線なしを表します。
- **:hover と :focus**: マウスを乗せた状態と、キーボードで選んだ状態を表す疑似クラスです。
- **リンクの下線**: ブラウザは、リンクに既定で下線を引きます。このクラスは、普段は下線を消し、必要なときだけ引く使い方に向いています。

## 何をしているか

### 1. 操作の状態で下線を引く

```css:line-numbers=74
.underline-hover:hover,
.underline-hover:focus {
  text-decoration: underline;
}
```

hover と focus の状態になると、文字に下線を引きます。マウスとキーボードの両方で、同じ合図が出ます。

## ここがすごい

下線の有無だけを切り替えるため、文字の大きさや位置は変わりません。周りの文章の流れを崩さずに、操作の対象であることを伝えられます。

リンクの下線は、常に出すと文章がうるさく見えますが、消すと操作の手がかりがなくなります。hover と focus のときだけ下線を出すと、普段は静かで、操作のときに明確になります。キーボードで選んだときも同じ下線が出るため、マウスを使わない人にも、リンクの位置が伝わります。

## まとめ

hover と focus に同じ下線を引くと、マウスでもキーボードでも、リンクらしさを一貫して示せます。

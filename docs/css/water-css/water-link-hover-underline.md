---
title: "リンクは下線なしで、乗せたときだけ下線を引く"
description: "Water.css は a の下線を消し、文字色を #0076d1 の青にする。hover のときだけ下線を引き、普段は静かな、しかし押せるリンクの見た目を作る。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [172, 179]
function: "\"a, a:hover\""
difficulty: 2
format: 2
tags: [配色, 疑似要素]
---
## ひとことで

Water.css のリンクは、普段は下線を消して青い文字で表示します。マウスを乗せたときだけ下線を出して、操作の対象であることを伝えます。

## コード

```css:line-numbers=172
a {
  text-decoration: none;
  color: #0076d1;
}

a:hover {
  text-decoration: underline;
}
```

## 前提知識

- **a 要素**: リンクを表す HTML の要素です。既定では、ブラウザが下線を付けます。
- **text-decoration**: 文字の装飾を決めるプロパティです。none は下線を消し、underline は下線を引きます。
- **:hover**: マウスを乗せた状態を表す疑似クラスです。

## 何をしているか

### 1. 普段の見た目

```css:line-numbers=173
  text-decoration: none;
  color: #0076d1;
```

下線を消して、文字色を青にします。本文の中でも、青い文字がリンクだと分かります。

### 2. 乗せたときの反応

```css:line-numbers=177
a:hover {
  text-decoration: underline;
```

hover のときだけ、下線を引きます。マウスの位置がリンクの上にあることが、はっきり示されます。

## ここがすごい

普段は静かで、操作の時だけ目立つという、強弱の使い分けをしています。本文の流れを乱さず、必要なときだけリンクの存在を伝えます。

リンクの下線は、常に出すと本文がうるさくなり、消すと押せる場所が分かりにくくなります。普段は色だけで示し、乗せたときに下線を加えるのは、その間をとった工夫です。青い文字の色は、本文の黒い文字との差がはっきりしていて、リンクだとすぐに気づけます。

リンクの見た目が普段と操作時で変わることは、画面の中で操作の段階を伝える仕組みになります。色と下線の二段階で示すと、リンクの存在と、いま操作の対象であることの両方が伝わります。文字の大きさは変えないため、乗せたときに周りの文章がずれることもありません。

## まとめ

リンクの下線を hover のときだけ出すと、本文の読みやすさを保ちながら、操作の対象を示せます。

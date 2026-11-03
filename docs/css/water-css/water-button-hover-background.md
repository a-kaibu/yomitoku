---
title: "ボタンにマウスを乗せると背景を濃くする"
description: "Water.css は button と submit・button の input を hover したときだけ背景色を #dddddd に変え、押せる部品であることを色の変化で示す。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [127, 131]
function: "\"button:hover, input[type='submit']:hover, input[type='button']:hover\""
difficulty: 1
format: 2
tags: [配色, フォーム]
---
## ひとことで

Water.css は、ボタンにマウスを乗せると、背景を少し濃い灰色にします。普段と違う色が出ることで、操作の対象になったことが伝わります。

## コード

```css:line-numbers=127
button:hover,
input[type='submit']:hover,
input[type='button']:hover {
  background: #dddddd;
}
```

## 前提知識

- **:hover**: マウスカーソルが要素の上にあるときに当たる疑似クラスです。
- **背景色の変化**: 普段の #efefef から #dddddd へ、わずかに濃くします。大きく変えないことで、落ち着いた操作感になります。
- **フォーカスとの違い**: hover はマウス、focus はキーボードの選択です。このルールは、マウスだけに反応します。

## 何をしているか

### 1. 対象のボタン

```css:line-numbers=127
button:hover,
input[type='submit']:hover,
input[type='button']:hover {
```

ボタンと、submit と button の input を選びます。乗せたときに、同じ反応が出ます。

### 2. 濃くする

```css:line-numbers=130
  background: #dddddd;
```

背景を #dddddd にします。薄い灰色が一段濃くなり、ボタンの面が浮かび上がります。

## ここがすごい

色の変化だけで、大きさや位置を変えずに反応を示しています。レイアウトはそのままなので、周りの文字が動きません。

マウスを乗せたときの色の変化は、押せることを示す最も手軽な手がかりです。ただし、変化が大きすぎると、ボタンの本来の色が分からなくなります。#dddddd は、元の #efefef から一段だけ濃くした色で、落ち着いた変化にとどめています。この小さな違いが、画面の静かさを保ちながら、操作の対象を示すための工夫です。

## まとめ

hover で背景をわずかに濃くすると、ボタンは静かに、しかし確実に応答します。

---
title: "乗せると薄い部品をはっきり見せる"
description: "Tachyons の .glow は、普段の透明度の変化を 0.15 秒で行い、hover と focus で不透明度を 1 にする。薄く置いた部品を、操作したときだけ強く見せる書き方。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_hovers.css
lines: [39, 46]
function: "\".glow\""
difficulty: 1
format: 2
tags: [配色, アニメーション]
---
## ひとことで

Tachyons の `.glow` は、普段は少し透明な要素を、マウスを乗せたときに完全に不透明にします。薄い装飾を、操作に応じて浮かび上がらせるクラスです。

## コード

```css:line-numbers=39
.glow {
  transition: opacity .15s ease-in;
}
.glow:hover,
.glow:focus {
  opacity: 1;
  transition: opacity .15s ease-in;
}
```

## 前提知識

- **opacity**: 要素の透明度です。1 は完全に見え、0 は透明です。`.glow` では、普段の値を指定せず、既定の 1 から変化させます。
- **transition**: 透明度が変わるときの時間と動きです。ここでは 0.15 秒で、ease-in の曲線で変わります。
- **hover と focus**: マウスを乗せた状態と、キーボードで選んだ状態です。二つを同じ反応にそろえています。

## 何をしているか

### 1. 変化の時間を決める

```css:line-numbers=39
.glow {
  transition: opacity .15s ease-in;
```

普段の透明度に対して、変化の時間を 0.15 秒にします。短い時間で変わるため、反応が素早く感じられます。

### 2. 操作で不透明にする

```css:line-numbers=42
.glow:hover,
.glow:focus {
  opacity: 1;
  transition: opacity .15s ease-in;
```

hover と focus のとき、不透明度を 1 にします。薄かった要素が、はっきりと現れます。

## ここがすごい

`.dim` と対になる書き方で、同じ変化の時間を使っています。薄くするクラスと、濃くするクラスを組み合わせると、画面の強弱を一貫して作れます。

普段は薄い部品は、画面の背景として静かに置かれます。マウスを乗せた瞬間だけ、その要素が前に出てくるので、操作の対象が自然に見つかります。透明度の変化は、色の変化よりも目に優しく、周りの配色を崩しにくいという利点があります。このクラスは、薄い装飾を強調するための、最も小さな動きです。

## まとめ

透明度を操作で変えるクラスは、通常は薄い装飾を、必要なときだけ前に出すための道具です。

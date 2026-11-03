---
title: "マウスを乗せた要素だけ薄くする"
description: "Tachyons の .dim は、通常の不透明度を 1 にし、hover と focus で .5、active で .8 に変える。ボタンや画像に、操作できることを示す定番の書き方。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_hovers.css
lines: [21, 32]
function: "\".dim\""
difficulty: 1
format: 2
tags: [アニメーション, 疑似要素]
---
## ひとことで

Tachyons の `.dim` は、要素にマウスを乗せたときに、薄く見せるための一行のクラスです。押せる部品であることを、色の変化で伝えます。

## コード

```css:line-numbers=21
.dim {
  opacity: 1;
  transition: opacity .15s ease-in;
}
.dim:hover,
.dim:focus {
  opacity: .5;
  transition: opacity .15s ease-in;
}
.dim:active {
  opacity: .8; transition: opacity .15s ease-out;
}
```

## 前提知識

- **:hover**: マウスカーソルが要素の上にあるときに当たる疑似クラスです。
- **:focus**: キーボードなどで選ばれているときに当たります。マウスを使わない人にも同じ変化を届けるために、hover と並べて書いています。
- **:active**: 押している最中に当たる疑似クラスです。
- **opacity**: 要素の透明度です。1 が不透明、0 が完全に透明です。
- **transition**: 値が変わるときの速さや動き方を決めるプロパティです。

## 何をしているか

### 1. 通常の状態

```css:line-numbers=21
.dim {
  opacity: 1;
  transition: opacity .15s ease-in;
}
```

`.dim` は、普段は不透明度 1 で、変化にかける時間を 0.15 秒にしています。

### 2. 乗せたときと選んだとき

```css:line-numbers=25
.dim:hover,
.dim:focus {
  opacity: .5;
  transition: opacity .15s ease-in;
}
```

hover と focus のときは不透明度を 0.5 にします。マウスでもキーボードでも、同じ薄さで反応します。

### 3. 押している最中

```css:line-numbers=30
.dim:active {
  opacity: .8; transition: opacity .15s ease-out;
}
```

active のときは 0.8 にします。hover より少しだけ濃く、押した手応えを残します。

## ここがすごい

状態ごとに透明度を三段階に分けているので、操作の段階が見た目から分かります。HTML にはクラスを一つ付けるだけで、動きが付きます。

## まとめ

hover・focus・active を並べて書くと、マウスでもキーボードでも、同じ反応を返す部品になります。

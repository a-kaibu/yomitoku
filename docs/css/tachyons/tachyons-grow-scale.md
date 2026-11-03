---
title: "乗せると少し大きくなり、押すと縮む"
description: "Tachyons の .grow は、transform の scale を hover・focus で 1.05、active で 0.90 にする。ボタンや画像に、拡大と押し込みの二段階の反応を与える。"
language: css
project: undefined
repo: https://github.com/tachyons-css/tachyons
license: MIT
copyright: "\"Copyright © 2020 Adam Morse & John Otander\""
commit: "2cb90e90f934e405cc51f9a49ba3e1a2c74bda0c"
file: src/_hovers.css
lines: [82, 96]
function: "\".grow\""
difficulty: 2
format: 2
tags: [アニメーション, 配色]
---
## ひとことで

Tachyons の `.grow` は、要素にマウスを乗せると少し大きくなり、押している間は少し小さくなります。拡大と縮小で、操作に反応している手応えを出すクラスです。

## コード

```css:line-numbers=82
.grow {
  -moz-osx-font-smoothing: grayscale;
  backface-visibility: hidden;
  transform: translateZ(0);
  transition: transform 0.25s ease-out;
}

.grow:hover,
.grow:focus {
  transform: scale(1.05);
}

.grow:active {
  transform: scale(.90);
}
```

## 前提知識

- **transform: scale**: 要素の大きさを、倍率で拡大・縮小する指定です。1.05 は 5% 大きく、0.90 は 10% 小さくなります。
- **transform: translateZ(0)**: 描画を GPU に任せる、ちらつき防止のための指定です。拡大のときの滑らかさを保ちます。
- **backface-visibility**: 要素の裏側を見せるかどうかを決めます。hidden は、裏面を描かないことで、ちらつきを減らします。
- **transition**: 値が変わるときの速さを決めます。0.25 秒で、拡大と縮小が滑らかに続きます。

## 何をしているか

### 1. 描画を安定させる

```css:line-numbers=83
  -moz-osx-font-smoothing: grayscale;
  backface-visibility: hidden;
  transform: translateZ(0);
  transition: transform 0.25s ease-out;
```

描画の補助と、変化の時間を決めています。拡大の途中で、文字がぼやけたり、ちらついたりしにくくなります。

### 2. 乗せたときに大きくする

```css:line-numbers=89
.grow:hover,
.grow:focus {
  transform: scale(1.05);
}
```

hover と focus のとき、1.05 倍に拡大します。カーソルを乗せた部品が、少し前に出て見えます。

### 3. 押したときに縮める

```css:line-numbers=94
.grow:active {
  transform: scale(.90);
}
```

active のときは 0.90 倍に縮みます。押し込まれた感触が、拡大とは逆向きの動きで伝わります。

## ここがすごい

拡大と縮小を、同じクラスの中の三つの状態として書いています。HTML は変えず、状態だけで操作の段階を示せます。

## まとめ

transform と transition を組み合わせると、乗せると大きくなり、押すと縮む、二段階の反応を作れます。

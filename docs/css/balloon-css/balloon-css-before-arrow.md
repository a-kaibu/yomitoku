---
title: "枠線だけで作る三角の矢印"
description: "幅と高さを 0 にした要素に太い border を付け、一辺だけ色を付けて三角形を作る。吹き出しの矢印を画像なしで描くテクニック。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [33, 43]
function: "\"[aria-label][data-balloon-pos]:before\""
difficulty: 3
format: 2
tags: [ハック, イディオム]
---
## ひとことで

`:before` の疑似要素で、吹き出しの矢印を作るルールです。幅と高さを 0 にしたうえで、太い枠線を四方に付けます。そして一辺だけ色を付けると、その辺の向きを向いた三角形が現れます。画像もアイコンも使わず、CSS だけで矢印を描いています。

## コード

```css:line-numbers=33
  [aria-label][data-balloon-pos]:before {
    width: 0;
    height: 0;
    border: 5px solid transparent;
    border-top-color: var(--balloon-color);
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s ease-out 0.18s;
    content: "";
    position: absolute;
    z-index: 10; }
```

## 前提知識

- **border**: 要素の枠線です。太さ、線の種類、色を指定できます。
- **border-top-color**: 上側の枠線の色だけを変えるプロパティです。
- **transparent**: 完全に透明な色を表すキーワードです。
- **ボックスの角の境目**: 枠線の四辺は、角で斜めに区切られて見えます。幅と高さがゼロの箱では、四辺の枠線が三角形のように見えます。

## 何をしているか

### 1. 幅と高さをゼロにして、枠線だけにする

```css:line-numbers=34
    width: 0;
    height: 0;
    border: 5px solid transparent;
```

`width: 0` と `height: 0` で箱の中身の大きさをゼロにします。そのうえで `border: 5px solid transparent` で、四辺すべての枠線を 5px、透明にします。枠線は透明なので、まだ何も見えません。

### 2. 上側の枠線だけを色付きにする

```css:line-numbers=37
    border-top-color: var(--balloon-color);
```

`border-top-color` で上側の枠線だけに色を付けます。ほかの三辺は透明のままなので、上側の枠線が三角形の形になります。この三角形が、吹き出しの下向きの矢印として見えます。

### 3. 表示と位置を決める

```css:line-numbers=38
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s ease-out 0.18s;
    content: "";
    position: absolute;
    z-index: 10; }
```

`opacity: 0` と `pointer-events: none` で、最初は見えず、操作も通します。`content: ""` は、疑似要素を空の箱として存在させるための指定です。`position: absolute` と `z-index` で、要素の上に重ねて配置します。

## ここがすごい

- 矢印を画像で作らないので、色を変えるときも CSS の変数を書き換えるだけで済みます。`--balloon-color` の値が、そのまま矢印の色になります。
- 三角形は、幅と高さを 0 にした箱と枠線の重なりで描かれています。特別な図形の命令はないのに、三角形が現れる仕組みが面白いところです。
- 素直に SVG の画像を使うと、吹き出しの方向ごとに画像を用意する必要が出てきます。CSS の枠線を使うと、方向を変えるのは枠線の辺を変えるだけになります。
- 矢印の見た目を、本体と同じ色の変数で揃えているので、テーマを変えたときにずれません。

## まとめ

- 幅と高さがゼロの箱に太い枠線を付けると、三角形が描けます。
- 一辺だけ色を付けると、その向きの矢印になります。
- 画像を使わず、色の変数でほかの部分と揃えられます。
- 三角形を作る仕組みを知っていると、ほかの図形にも応用できます。

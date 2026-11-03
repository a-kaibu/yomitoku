---
title: "白い矢印のアイコンをフィルターで作る"
description: "details の dropdown の summary の矢印に、filter: brightness(0) invert(1) を当てる。画像を一度黒にしてから反転し、暗い背景でも白い矢印を出すテクニック。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [221, 223]
function: "\"details summary[role=button]:not(.outline)::after\""
difficulty: 2
format: 2
tags: [ハック, イディオム]
---
## ひとことで

`details` の中の `summary` が `role="button"` で、かつ `outline` クラスを持たないボタンの場合、その矢印の画像を白く見せるルールです。矢印は画像として描かれているため、色を変えるには別の画像が必要になります。このルールは、`filter` で画像の色を変えることで、画像を作り直さずに白にしています。

## コード

```css:line-numbers=221
details summary[role=button]:not(.outline)::after {
  filter: brightness(0) invert(1);
}
```

## 前提知識

- **details と summary**: 開閉できる部分を作る HTML 要素です。`summary` が開閉の見出しになります。
- **::after**: 要素の後ろに仮想的な箱を作る疑似要素です。ここでは、矢印の画像を入れる場所として使われています。
- **filter**: 要素の見た目に、明るさや色の効果をかけるプロパティです。
- **brightness(0) と invert(1)**: `brightness(0)` は、すべての色を真っ黒にします。`invert(1)` は、色を反転させます。黒を反転させると白になります。

## 何をしているか

### 1. 画像の色を白に変える

```css:line-numbers=221
details summary[role=button]:not(.outline)::after {
  filter: brightness(0) invert(1);
}
```

`brightness(0)` で、矢印の画像を真っ黒にします。続く `invert(1)` で、黒を白に反転させます。元の画像の形は保たれ、色だけが白になります。

ボタンが暗い背景のときに、矢印が見えるように、この指定で色を調整しています。

## ここがすごい

- 画像の色を変えるのに、別の白い画像を用意しなくて済みます。一つの画像の CSS で、色のバリエーションが作れます。
- 二つの関数を組み合わせて、黒にしてから反転させるという手順で、どんな元の色でも確実に白になります。
- 素直に白い矢印の画像を別に作ると、画像ファイルが増え、ボタンの色が変わるたびに画像を作り直す必要があります。フィルターなら、その手間がありません。
- 対象を `outline` のないボタンに絞っているので、枠線だけのボタンは元の色のままです。

## まとめ

- `filter` で、画像の色を変えられます。
- `brightness(0)` と `invert(1)` の組み合わせで、どんな色の画像も白にできます。
- 画像を増やさずに、ボタンの配色に合わせた矢印を作れます。

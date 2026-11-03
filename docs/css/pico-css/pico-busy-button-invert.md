---
title: "読み込み中のボタンの印を白く反転する"
description: "Pico CSS は aria-busy=true のボタンの ::before に filter で色を反転し、塗りの濃いボタンでもくるくる回る印を白く見せる。読み込み中の表示の色合わせ。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [225, 227]
function: "\"[aria-busy=true] button::before\""
difficulty: 2
format: 2
tags: [配色, 疑似要素, アクセシビリティ]
---
## ひとことで

Pico CSS は、読み込み中を示す `aria-busy="true"` のボタンに付く印の色を、白に反転します。濃い背景のボタンでも、印が見えるようにするためです。

## コード

```css:line-numbers=225
[aria-busy=true]:not(input, select, textarea):is(button, [type=submit], [type=button], [type=reset], [role=button]):not(.outline)::before {
  filter: brightness(0) invert(1);
}
```

## 前提知識

- **aria-busy**: 支援技術に「この部分は更新中です」と伝える属性です。見た目と読み上げの両方に使えます。
- **::before**: 要素の前に、仮想の箱を一つ追加する疑似要素です。ここに回る印を置いています。
- **filter**: 要素の色や明るさを変える効果です。`brightness(0)` で黒にして、`invert(1)` で白にします。

## 何をしているか

### 1. 対象のボタンを選ぶ

```css:line-numbers=225
[aria-busy=true]:not(input, select, textarea):is(button, [type=submit], [type=button], [type=reset], [role=button]):not(.outline)::before {
```

input・select・textarea を除き、button や submit、reset などの役割を持つ要素だけを選びます。`.outline` のボタンは除きます。

### 2. 色を反転する

```css:line-numbers=226
  filter: brightness(0) invert(1);
```

まず `brightness(0)` で黒にし、`invert(1)` で白に反転します。元の色に関係なく、白い印になります。

## ここがすごい

読み込み中の印を、画像を差し替えずに、色だけで切り替えています。`aria-busy` の状態を変えるだけで、見た目と意味が一緒に変わります。

読み込み中の印は、ボタンの色によっては背景に溶けて見えなくなります。反転させることで、濃い色のボタンでも、回る印がはっきり見えます。色を書き換えるのではなく filter で処理しているため、画像を別に用意する必要がありません。aria-busy を外せば、通常の表示に戻ります。

## まとめ

aria-busy の属性と filter を組み合わせると、濃いボタンでも読み込み中の印を見せられます。

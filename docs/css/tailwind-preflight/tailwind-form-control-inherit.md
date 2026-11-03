---
title: "フォーム部品の文字と色を親からそのまま受け継ぐ"
description: "Tailwind の preflight は button・input・select・textarea などのフォーム部品に、font・letter-spacing・color を inherit で受け継がせ、角丸と背景と透明度を既定から外す。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "\"Copyright (c) Tailwind Labs, Inc.\""
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [243, 257]
function: "\"button, input, select, optgroup, textarea, ::file-selector-button\""
difficulty: 2
format: 2
tags: [フォーム, 移植性]
---
## ひとことで

Tailwind の preflight は、フォームの部品が持つ既定の文字や色を消して、周りの本文と同じ見た目を受け継がせます。ブラウザごとに違うフォームの見た目を、出発点でそろえるための指定です。

## コード

```css:line-numbers=243
button,
input,
select,
optgroup,
textarea,
::file-selector-button {
  font: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
  color: inherit; /* 1 */
  border-radius: 0; /* 2 */
  background-color: transparent; /* 3 */
  opacity: 1; /* 4 */
}
```

## 前提知識

- **フォーム部品**: ボタン、入力欄、選択、複数行の入力などを指す要素です。ブラウザが独自の文字や枠を持ちます。
- **inherit**: 親の要素の値をそのまま使う指定です。親が変われば、この部品も同じ値に従います。
- **font と letter-spacing**: 書体の太さや大きさ、文字の間隔をまとめて決める指定です。
- **::file-selector-button**: ファイル選択ボタンを表す疑似要素です。他の部品と同じ扱いにするため、一覧に含めています。

## 何をしているか

### 1. 文字を親から受け継ぐ

```css:line-numbers=249
  font: inherit; /* 1 */
  font-feature-settings: inherit; /* 1 */
  font-variation-settings: inherit; /* 1 */
  letter-spacing: inherit; /* 1 */
```

フォントと文字の間隔、色を inherit にします。周りの本文と同じ書体と色で、部品の文字が表示されます。

### 2. 角と背景と透明度を戻す

```css:line-numbers=254
  border-radius: 0; /* 2 */
  background-color: transparent; /* 3 */
  opacity: 1; /* 4 */
```

角丸を 0 にし、背景を透明にし、不透明度を 1 にします。ブラウザの既定の角や色、無効時の薄さを、取り除きます。

## ここがすごい

一つのセレクタに部品をまとめることで、フォーム全体の文字と色の扱いが同じになります。個別のクラスを付けずに、統一された出発点を作れます。

## まとめ

inherit と既定値の打ち消しを組み合わせると、フォーム部品を本文と同じ見た目から始められます。

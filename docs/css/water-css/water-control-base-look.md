---
title: "入力欄とボタンの基本の見た目をそろえる"
description: "Water.css は input・select・button・textarea に、薄い灰色の背景、角丸 6px、余白 10px、枠なしを与え、フォントは親から受け継ぐ。フォーム部品の見た目を一つにまとめる土台。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [97, 108]
function: "\"input, select, button, textarea\""
difficulty: 2
format: 2
tags: [フォーム, 配色]
---
## ひとことで

Water.css は、入力欄、選択、ボタン、複数行の入力に、同じ基本の見た目を与えます。薄い灰色の背景と、丸い角と、程よい余白で、フォームの部品がそろって見えます。

## コード

```css:line-numbers=97
input, select, button, textarea {
  color: #000000;
  background-color: #efefef;
  font-family: inherit;
  font-size: inherit;
  margin-right: 6px;
  margin-bottom: 6px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  outline: none;
}
```

## 前提知識

- **background-color**: 要素の背景色です。#efefef は、白に近い薄い灰色です。
- **border-radius**: 角の丸みです。6px は、ボタンや入力欄に柔らかさを与えます。
- **outline: none**: フォーカス時の既定の輪郭線を消す指定です。後の部分で、別の印で代わりに示されます。
- **font-family: inherit**: 親の書体をそのまま受け継ぐ指定です。周りの本文と同じ字体になります。

## 何をしているか

### 1. 文字と背景

```css:line-numbers=97
input, select, button, textarea {
  color: #000000;
  background-color: #efefef;
  font-family: inherit;
  font-size: inherit;
```

文字色は黒、背景は薄い灰色にします。書体と大きさは、親から受け継ぎます。

### 2. 余白と形

```css:line-numbers=102
  margin-right: 6px;
  margin-bottom: 6px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  outline: none;
```

右と下に 6px の間隔を取り、内側に 10px の余白を入れます。枠を消して、角を 6px で丸めます。

## ここがすごい

フォームの部品を一つのセレクタにまとめているため、新しい部品を足しても、見た目が自然に揃います。

フォームの部品がそれぞれ別の見た目だと、画面全体がまとまりを欠きます。背景、角、余白をそろえると、入力欄とボタンが一つの家族のように見えます。書体を親から受け継ぐのは、本文と同じ字体で入力できるようにするためです。枠を消して背景の色で境界を示す方法は、軽やかさを保ちながら、部品の範囲をはっきり示します。

## まとめ

基本の色と形を共有させると、入力欄とボタンが一つの家族として見えるフォームになります。

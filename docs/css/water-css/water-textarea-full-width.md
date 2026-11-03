---
title: "複数行の入力欄を幅いっぱいに広げて縦だけ伸ばす"
description: "Water.css の textarea は幅を 100% と box-sizing: border-box にし、resize を vertical にして、縦の大きさだけを利用者が変えられるようにする。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [115, 120]
function: "\"textarea\""
difficulty: 2
format: 2
tags: [フォーム, レイアウト]
---
## ひとことで

Water.css は、複数行の入力欄を、親の幅いっぱいに広げます。利用者が変えられるのは縦の大きさだけで、横に飛び出すことはありません。

## コード

```css:line-numbers=115
textarea {
  margin-right: 0;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
}
```

## 前提知識

- **textarea**: 複数行の文章を入力する欄です。既定では、利用者が右下の角をドラッグして大きさを変えられます。
- **resize**: 利用者が大きさを変えられる方向を決めるプロパティです。vertical は縦だけ、none は変えられないことを表します。
- **box-sizing: border-box**: 幅に余白と枠線を含めて計算する指定です。100% の幅に、余白を足してもはみ出しません。

## 何をしているか

### 1. 余白を消して広げる

```css:line-numbers=115
textarea {
  margin-right: 0;
  width: 100%;
```

右の余白を 0 にし、幅を 100% にします。親の幅いっぱいに、入力欄が広がります。

### 2. 枠を含めて計算する

```css:line-numbers=118
  box-sizing: border-box;
```

box-sizing を border-box にして、枠と余白を含めた幅にします。はみ出しを防げます。

### 3. 縦だけ変えられる

```css:line-numbers=119
  resize: vertical;
```

resize を vertical にして、利用者が縦の大きさだけ変えられるようにします。横に広げると、レイアウトが崩れるのを防げます。

## ここがすごい

幅を固定し、縦だけ可変にすることで、利用者が自由に大きさを変えても、フォームの形が保たれます。

複数行の入力欄は、長い文章を書くための部品です。幅を親の大きさに合わせると、フォームの他の欄と左右の端がそろい、画面の中で整って見えます。縦だけ変えられるようにすると、利用者は必要な分だけ入力欄を伸ばせます。横にも伸びると、画面からはみ出すおそれがあるため、この指定はその点を防いでいます。

## まとめ

textarea の幅と resize を組み合わせると、縦に伸びる入力欄が、フォームの幅に収まります。

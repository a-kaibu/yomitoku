---
title: "入力欄の見本の文字を薄い灰色にする"
description: "Water.css は ::placeholder の文字色を #949494 にし、入力前の見本の文字を、入力した文字より薄く見せる。ブラウザごとの接頭辞も並べて、同じ色にそろえる。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [168, 170]
function: "\"::placeholder\""
difficulty: 2
format: 2
tags: [フォーム, 配色]
---
## ひとことで

Water.css は、入力欄に先に表示される見本の文字を、薄い灰色にします。まだ入力していない文字と、実際に入力した文字を、色の差で区別できます。

## コード

```css:line-numbers=168
::placeholder {
  color: #949494;
}
```

## 前提知識

- **placeholder**: 入力欄が空のときに、何を書けばよいかを示す見本の文字です。値として送られるものではありません。
- **::placeholder**: 見本の文字を表す疑似要素です。色や不透明度を変えられます。
- **接頭辞**: 古いブラウザでは、同じ機能に別の名前が使われていました。-webkit- や -ms- の付いた形を並べて、それぞれに対応しています。

## 何をしているか

### 1. 見本の色

```css:line-numbers=168
::placeholder {
  color: #949494;
```

見本の文字の色を #949494 にします。本文の黒い文字より明らかに薄く、入力前であることが分かります。

### 2. 接頭辞の扱い

```css:line-numbers=156
::-webkit-input-placeholder {
  color: #949494;
}

:-ms-input-placeholder {
  color: #949494;
}

::-ms-input-placeholder {
  color: #949494;
}
```

古いブラウザ向けの接頭辞の付いた疑似要素にも、同じ色を与えます。どの環境でも、見本の色が統一されます。

## ここがすごい

見本の文字を、入力された文字より薄くすることで、利用者は入力済みかどうかを視覚で判断できます。

見本の文字が本文と同じ濃さだと、入力済みの内容と取り違えるおそれがあります。薄い灰色にすると、見本は手がかりであり、本当の入力ではないことが分かります。接頭辞をそろえて書くのは、古いブラウザでも同じ色になるようにするためで、見た目の統一を保つ工夫です。

## まとめ

見本の文字を薄い灰色にすると、入力の状態が色の差で分かる、読みやすい入力欄になります。

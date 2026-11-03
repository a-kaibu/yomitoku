---
title: "使えない入力欄を薄く表示し、禁止のカーソルにする"
description: "Water.css は disabled の input・select・button・textarea の不透明度を 0.5 にし、カーソルを not-allowed にする。操作できない部品を、見た目と手の形の両方で伝える。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [148, 154]
function: "\"input:disabled, select:disabled, button:disabled, textarea:disabled\""
difficulty: 2
format: 2
tags: [フォーム, アクセシビリティ]
---
## ひとことで

Water.css は、使えない状態になった入力欄やボタンを、半分の濃さで表示し、カーソルを禁止の形にします。操作できないことを、色と形の両方で伝えるための指定です。

## コード

```css:line-numbers=148
input:disabled,
select:disabled,
button:disabled,
textarea:disabled {
  cursor: not-allowed;
  opacity: .5;
}
```

## 前提知識

- **:disabled**: 無効にされた部品を表す疑似クラスです。HTML の disabled 属性が付いていると当たります。
- **not-allowed**: 操作できないことを示すカーソルの形です。斜線の付いた丸などで表示されます。
- **opacity**: 要素の透明度です。0.5 は、半分の濃さで表示することを表します。

## 何をしているか

### 1. 禁止のカーソル

```css:line-numbers=152
  cursor: not-allowed;
```

マウスを乗せたときのカーソルを、操作できないことを示す形にします。利用者は、クリックしても反応がないことを事前に知れます。

### 2. 薄く見せる

```css:line-numbers=153
  opacity: .5;
```

不透明度を 0.5 にして、全体を薄く見せます。使えない部品が、使える部品と区別されます。

## ここがすごい

見た目の変化と、カーソルの変化を一つのルールにまとめています。色覚の違いや、画面の明るさに左右されても、無効の状態は伝わりやすくなっています。

使えない部品を見ても、理由が分からないと利用者は戸惑います。薄く表示すると、その部品が今は操作の対象でないことが伝わります。カーソルの形も、クリックできないと分かる合図になるため、二つの手がかりが揃います。どちらか一方だけでは伝わりにくい状態を、両方で補い合っています。

## まとめ

disabled の部品を薄く、禁止の形のカーソルで示すと、操作の可否を迷わず判断できます。

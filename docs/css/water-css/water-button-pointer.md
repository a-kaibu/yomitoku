---
title: "押せる部品にだけ手の形のカーソルを出す"
description: "Water.css は button と submit・button・checkbox の input に cursor: pointer を与え、マウスを乗せたときに操作できることを手の形で示す。ボタン類の反応の出し方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [85, 90]
function: "\"button, input[type='submit'], input[type='button'], input[type='checkbox']\""
difficulty: 1
format: 2
tags: [フォーム, アクセシビリティ]
---
## ひとことで

Water.css は、ボタンやチェックボックスの上にマウスを乗せると、カーソルを手の形に変えます。押せる部品であることを、カーソルの形で伝えるための指定です。

## コード

```css:line-numbers=85
button,
input[type='submit'],
input[type='button'],
input[type='checkbox'] {
  cursor: pointer;
}
```

## 前提知識

- **cursor**: マウスカーソルの形を決めるプロパティです。pointer は、リンクやボタンで使われる手の形です。
- **input の種類**: type の属性によって、ボタン、チェックボックス、文字入力などに分かれます。
- **押せる部品**: 利用者は、カーソルの形を見て、その場所が操作できるかどうかを判断します。

## 何をしているか

### 1. 対象の部品

```css:line-numbers=85
button,
input[type='submit'],
input[type='button'],
input[type='checkbox'] {
```

button と、submit・button・checkbox の input を選びます。どれも、押すかチェックを入れる操作の部品です。

### 2. 手の形にする

```css:line-numbers=89
  cursor: pointer;
```

カーソルを pointer にします。マウスを乗せたときに、操作できる場所であることが伝わります。

## ここがすごい

文字入力欄は、カーソルの形を I の形のまま残しています。文字を入力できる場所と、押せる場所が、カーソルの形で区別されます。

マウスカーソルの形は、利用者が画面の上で「ここは押せる」と判断する、最初の手がかりです。手の形を出すことで、押せる部品とそうでない部品が、動かさずに分かれます。文字入力欄の上ではカーソルを I の形のままにすると、文字を打てる場所だと伝わります。部品の種類ごとに、カーソルの役割を分けて考えることが大切です。

## まとめ

押せる部品にだけ pointer を与えると、操作の手がかりが、カーソルの形でも伝わります。

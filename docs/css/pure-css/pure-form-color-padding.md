---
title: "色の入力欄だけ余白を広げる"
description: "Pure CSS は input[type=color] だけ padding を 0.2em 0.5em に変える。Chrome で色の見本が欠けて見えないように、ブラウザごとの差を一つの欄だけで調整する例。"
language: css
project: undefined
repo: https://github.com/pure-css/pure
license: BSD-3-Clause
copyright: "\"Copyright 2013 Yahoo! Inc.\""
commit: "7a2b0b708fd219e2d456e932a9256c288efce575"
file: src/forms/css/forms.css
lines: [50, 52]
function: "\".pure-form input[type=\\\"color\\\"]\""
difficulty: 2
format: 2
tags: [フォーム, 移植性]
---
## ひとことで

Pure CSS は、色を選ぶ入力欄だけ、余白を少し変えています。ブラウザによって色の見本が欠けて見えるため、その差をこの一行で埋めています。

## コード

```css:line-numbers=50
.pure-form input[type="color"] {
    padding: 0.2em 0.5em;
}
```

## 前提知識

- **input の type**: `type="color"` は、色を選ぶ欄を表します。テキスト欄とは別の部品として描かれます。
- **padding**: 要素の内側の余白です。ここを変えると、見本の周りの空間が変わります。
- **ブラウザの差**: 同じ HTML でも、ブラウザが部品をどう描くかは異なります。そのため、既定の余白だけでは、見本が切れることがあります。

## 何をしているか

### 1. 色の欄だけを選ぶ

```css:line-numbers=50
.pure-form input[type="color"] {
```

`type="color"` の input を選びます。テキスト欄とは別に扱うため、ここだけ余白を変えられます。

### 2. 余白を変える

```css:line-numbers=51
    padding: 0.2em 0.5em;
```

上下を 0.2em、左右を 0.5em にします。上の宣言より小さい余白にして、見本が枠の中に収まるようにしています。

## ここがすごい

ブラウザの不具合を、対象を絞った一つのルールで直しています。他の入力欄の見た目には影響しません。

色の欄は、見本の四角が枠の内側に描かれます。余白が大きすぎると、中の見本が小さくなり、クリックできる範囲も狭くなります。逆に余白が足りないと、見本の端が枠で欠けて見えます。このルールは、その中間の値を選んで、見た目と操作のしやすさの両方を保っています。他の入力欄と高さを揃える役割も、同時に果たしています。

## まとめ

ブラウザごとの描き方の差は、対象を限定した短いルールで補えます。コメントに書かれた事情が、そのまま理由になっています。

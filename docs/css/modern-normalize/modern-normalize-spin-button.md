---
title: "数値入力の増減ボタンの高さを整える"
description: "Chrome と Safari の数値入力欄にある増減ボタンの高さを auto にして、入力欄の高さと揃える。ブラウザ固有の擬似要素を使ったリセット。"
language: css
project: undefined
repo: https://github.com/sindresorhus/modern-normalize
license: MIT
copyright: "Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com); Copyright (c) Jonathan Neal"
commit: "076c61bd806ba4770a8d766d8e63903e4fb0dfa6"
file: modern-normalize.css
lines: [179, 182]
function: "\"::-webkit-inner-spin-button, ::-webkit-outer-spin-button\""
difficulty: 2
format: 2
tags: [移植性, ハック]
---
## ひとことで

`input type="number"` の右側に出る増減ボタン（スピンボタン）の高さを `auto` にするルールです。Chrome と Safari では、この増減ボタンだけが不自然に高く描かれることがあります。このルールで、ボタンの高さを入力欄の高さに合わせます。

## コード

```css:line-numbers=179
::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
	height: auto;
}
```

## 前提知識

- **input type="number"**: 数値だけを入力する欄です。右側に上下の増減ボタンが付くのが既定です。
- **疑似要素**: HTML にはない、ブラウザの内部の部品に CSS でスタイルを当てるための名前です。`::-webkit-inner-spin-button` のように、接頭辞付きの名前はブラウザ独自のものです。
- **height: auto**: 高さを、中身に合わせて自動で決めるという指定です。
- **inner と outer**: `inner` は増減ボタンの内側、`outer` は外側の部品を指します。どちらも同じ見た目の調整が必要なので、まとめて指定しています。

## 何をしているか

### 1. 増減ボタンの高さを自動にする

```css:line-numbers=179
::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
	height: auto;
}
```

セレクタに 2 つの疑似要素を並べて、同じ宣言を当てています。`height: auto` は、高さを既定の値から、中身に合わせた値へと変えます。これにより、入力欄の内側で増減ボタンが不自然に伸びないようになります。

## ここがすごい

- 対象が HTML の要素ではなく、ブラウザの内部の部品です。通常の CSS の知識だけでは気づきにくい、細かい調整になっています。
- 2 つの疑似要素を並べて書いているので、片方だけが効いて見た目が崩れることを防げます。
- 素直に書くと、入力欄全体の高さや余白を変えて、増減ボタンの高さを間接的に合わせることになります。そうすると、他の入力欄の見た目にまで影響が出ます。
- 対象をピンポイントに絞り、見た目の問題だけを解決しているので、副作用が少ないです。

## まとめ

- `input type="number"` の増減ボタンは、ブラウザの内部の部品として描かれます。
- 接頭辞付きの疑似要素を使うと、その部品に直接スタイルを当てられます。
- `height: auto` で、ボタンの高さを入力欄に合わせます。
- 必要な部品だけを狙って直すと、ほかの見た目に影響を与えずに済みます。

---
title: "ファイル選択ボタンの後ろに 4px の隙間を入れる"
description: "::file-selector-button の margin-inline-end を 4px にして、ファイル名の表示との間を少し空ける。ブラウザ既定のボタンの隣が詰まって見えるのを防ぐ、小さな余白の調整。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [279, 281]
function: "\"::file-selector-button\""
difficulty: 1
format: 2
tags: [移植性, 可読性]
---
## ひとことで

`input type="file"` のファイル選択ボタンの、後ろ側（書字方向の終わり側）に 4px の余白を入れるルールです。ボタンの右に表示されるファイル名が、ボタンにくっついて見えるのを防ぎます。`margin-inline-end` を使うので、縦書きや右から左へ書く言語でも、正しい側に余白が入ります。

## コード

```css:line-numbers=279
::file-selector-button {
  margin-inline-end: 4px;
}
```

## 前提知識

- **::file-selector-button**: ファイル選択ボタンの部分を表す疑似要素です。ブラウザによって、既定の見た目が違います。
- **margin**: 要素の外側の余白です。
- **inline（論理プロパティ）**: 文字が流れる方向を基準にした指定です。横書きでは左右、縦書きでは上下になります。
- **end（終わりの側）**: 文字が流れていく先の側のことです。横書きの英語では右側になります。

## 何をしているか

### 1. 論理の余白で右側を空ける

```css:line-numbers=280
  margin-inline-end: 4px;
```

`margin-inline-end: 4px` は、文字の流れる方向の終わり側に 4px の余白を入れます。横書きのページでは、ボタンの右側に隙間ができます。ボタンの後ろに続く「ファイルが選択されていません」などの文字との距離が、この 4px で取れます。

## ここがすごい

- `margin-right` ではなく `margin-inline-end` と書いているので、横書きでも縦書きでも、文字の流れに沿った正しい側に余白が入ります。
- ボタンの見た目を変えず、余白だけを足しているので、ボタンの大きさや色は、ブラウザの既定のまま残ります。
- 素直に `margin-right: 4px` と書くと、右から左へ書く言語では、余白が反対側に入ってしまいます。論理的な指定なら、この問題を避けられます。
- 4px という小さな値で、見た目の調子だけを整えています。大きな変更はしていません。

## まとめ

- `::file-selector-button` は、ファイル選択の部分を表す疑似要素です。
- `margin-inline-end` は、文字の流れに沿った終わり側の余白を指定します。
- 論理的な指定にすると、書字方向が変わっても余白が正しい側に入ります。

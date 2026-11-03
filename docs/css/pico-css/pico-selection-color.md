---
title: "文字を選んだときの色を変数で決める"
description: "::selection と ::-moz-selection の背景色を、テキスト選択用の変数に結びつける。ブラウザの既定の青い選択色を、テーマに合った色に置き換える。"
language: css
project: undefined
repo: https://github.com/picocss/pico
license: MIT
copyright: "\"Copyright (c) 2019-2024 Pico\""
commit: "a07563ddc856e6ed31a740e33b0397814227d469"
file: css/pico.css
lines: [906, 908]
function: "\"::selection\""
difficulty: 1
format: 2
tags: [移植性, 設計パターン]
---
## ひとことで

ページの文字をマウスやキーボードで選んだときに、その部分の背景色を決めるルールです。ブラウザは既定で青い色を使いますが、このルールはそれを変数の色に置き換えます。Firefox 向けの `::-moz-selection` とあわせて、どのブラウザでも同じ色になります。

## コード

```css:line-numbers=906
::selection {
  background-color: var(--pico-text-selection-color);
}
```

## 前提知識

- **::selection**: ユーザーが選択した文字の範囲を表す疑似要素です。背景色や文字色を変えられます。
- **::-moz-selection**: Firefox で使われていた、接頭辞付きの選択の疑似要素です。古い環境のために残されています。
- **変数（カスタムプロパティ）**: `var(--name)` で読み出す値です。テーマ用の色を一か所にまとめるために使われます。
- **既定の選択色**: ブラウザが最初から持つ、文字を選んだときの色です。

## 何をしているか

### 1. Firefox 向けの指定

```css:line-numbers=906
::selection {
  background-color: var(--pico-text-selection-color);
}
```

このファイルでは、`::-moz-selection` を先に書き、続けて標準の `::selection` を書いています。同じ宣言を両方に当てることで、古い Firefox と新しいブラウザの両方で、同じ選択色になります。

## ここがすごい

- 選択色が変数から来るので、ダークモードなどで色を変えると、選択の色も一緒に変わります。
- 標準の `::selection` と接頭辞付きの指定を並べ、古い環境と新しい環境の両方を一つの書き方で扱っています。
- 素直に色の値を直接書くと、テーマを変えたときに別の場所を直す必要があります。変数にすれば、一か所の変更で済みます。
- 選択色はユーザーの目に直接入る部分なので、テーマの色と揃えることで、ページの印象がちぐはぐになりにくくなります。

## まとめ

- `::selection` で、文字を選んだときの色を決められます。
- 接頭辞付きの `::-moz-selection` を並べると、古いブラウザにも対応できます。
- 色を変数にすると、テーマを変えても選択色が揃います。

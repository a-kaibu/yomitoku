---
title: "箇条書きの記号を消して、見た目を白紙にする"
description: "ol、ul、menu の list-style を none にして、リストの記号と字下げを消す。ナビゲーションなどで、リストを見た目のない箱として使うための土台のリセット。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [202, 206]
function: "\"ol, ul, menu\""
difficulty: 1
format: 2
tags: [イディオム, 設計パターン]
---
## ひとことで

`ol`、`ul`、`menu` のリストの記号を消すルールです。ブラウザは既定で、番号や丸印を付けて字下げをしますが、このルールはそれを取り除きます。リストは、構造を示すための箱として使い、見た目は利用者が決める、という考えに沿っています。

## コード

```css:line-numbers=202
ol,
ul,
menu {
  list-style: none;
}
```

## 前提知識

- **ol と ul と menu**: 番号付きのリスト、記号付きのリスト、メニューのリストを表す HTML 要素です。
- **list-style**: リストの項目の前に付く記号を決めるプロパティです。`none` は記号を付けません。
- **字下げ**: ブラウザが既定で付けている左の余白です。記号の分の幅を確保しています。
- **意味のある構造**: リストは、ページの中の項目のまとまりを、機械にも伝える HTML 要素です。

## 何をしているか

### 1. 記号をなくす

```css:line-numbers=204
menu {
  list-style: none;
```

`list-style: none` は、リストの項目の前の記号を消します。この指定だけで、番号や丸印が見えなくなります。

### 2. 対象を三種類に広げる

```css:line-numbers=202
ol,
ul,
```

`ol`、`ul`、`menu` の三つに同じ指定を当てています。`menu` は、ナビゲーションのようなリストに使われることがあるので、対象に入れています。

## ここがすごい

- リストの構造は残したまま、見た目だけを消せます。読み上げや検索にとっての意味は、HTML のまま保たれます。
- 記号を消すだけで、字下げの余白は残るかどうかは別の話です。この宣言は記号だけを扱うので、余白は利用者が自分で決められます。
- 素直に `ul { list-style: none; padding: 0; }` と書くと、余白も一緒に消えます。Tailwind はまず記号だけを消して、余白の扱いは別に判断させています。
- ナビゲーションのように、リストを見た目のない箱として使う場合の土台になります。

## まとめ

- `list-style: none` で、リストの記号を消せます。
- リストの構造は、HTML に残したまま見た目を変えられます。
- 記号と余白は別の指定なので、必要なものだけを消せます。

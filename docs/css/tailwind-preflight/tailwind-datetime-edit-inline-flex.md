---
title: "日付入力の中身を inline-flex で表示する"
description: "::-webkit-datetime-edit に display: inline-flex を指定し、macOS Safari で入力欄を display: block にしたときに高さが変わるのを防ぐ。WebKit 独自の内部部品へのスタイル。"
language: css
project: undefined
repo: https://github.com/tailwindlabs/tailwindcss
license: MIT
copyright: "Copyright (c) Tailwind Labs, Inc."
commit: "2626ae6ceddf36069ab6d55c53a5857c1e2e360a"
file: packages/tailwindcss/preflight.css
lines: [333, 335]
function: "\"::-webkit-datetime-edit\""
difficulty: 3
format: 2
tags: [日時, ハック]
---
## ひとことで

日付や時刻の入力欄の中身の部分（`::-webkit-datetime-edit`）を `inline-flex` にするルールです。入力欄を `display: block` にしたときに、macOS の Safari で高さが変わってしまう問題を防ぎます。内部の部品の表示を、横に並ぶ箱に決めています。

## コード

```css:line-numbers=333
::-webkit-datetime-edit {
  display: inline-flex;
}
```

## 前提知識

- **::-webkit-datetime-edit**: 日付や時刻の入力欄の中の編集部分を表す、WebKit 独自の疑似要素です。年、月、日などの並びを表します。
- **display: inline-flex**: 要素を文字と同じ行に並べ、中身を flex で並べる箱にする指定です。
- **display: block**: 要素を独立した行の箱にする指定です。入力欄を block にすると、横幅いっぱいに広がります。
- **内部の部品**: ブラウザが入力欄の中に作る、目に見えない箱や部品のことです。

## 何をしているか

### 1. 編集部分を横に並ぶ箱にする

```css:line-numbers=334
  display: inline-flex;
```

`display: inline-flex` は、年・月・日の並びを、文字と同じ行に並ぶ flex の箱として描かせます。コメントにあるように、入力欄を `block` にしたときに、macOS Safari で高さが変わる問題を、この指定で防ぎます。

## ここがすごい

- ブラウザの内部の部品に直接スタイルを当てる、珍しいタイプの調整です。通常の CSS では届かない場所を、疑似要素で扱っています。
- 入力欄の見た目を `block` にしても、中身の高さが揃うので、フォームの高さがそろって見えます。
- 素直に入力欄全体の高さを固定すると、中身の部品が溢れることがあります。中身を flex にして、その大きさに合わせるほうが自然です。
- 「block にすると高さが変わる」という問題は、見つけにくいバグです。その原因を一行で防いでいます。

## まとめ

- `::-webkit-datetime-edit` は、日付入力の編集部分を表す WebKit 独自の疑似要素です。
- `inline-flex` にすると、入力欄を block にしても高さが変わりにくくなります。
- ブラウザの内部部品への調整は、特定の環境に限った問題を解決するためのものです。

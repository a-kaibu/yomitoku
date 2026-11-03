---
title: "行の長さを em で決めて、本文を中央に置く"
description: "body の max-width を 38em にし、margin を auto で中央にそろえる。文字の大きさに連動する幅にして、読みやすい行の長さを保つ、本文のレイアウト。"
language: css
project: undefined
repo: https://github.com/oxalorg/sakura
license: MIT
copyright: "\"Copyright (c) 2016 Mitesh Shah\""
commit: "1eab9fd871abc74ec74d1a6f18ee56148f5a4b8f"
file: css/sakura.css
lines: [12, 20]
function: "body"
difficulty: 2
format: 2
tags: [可読性, 設計パターン]
---
## ひとことで

ページの本文を入れる `body` の定義です。文字の大きさを `1.8rem` に決め、行の高さを `1.618` とし、最大の幅を `38em` にして中央に置いています。幅を文字の大きさの単位で決めているので、文字を大きくすると、本文の幅も一緒に広がります。

## コード

```css:line-numbers=12
body {
  font-size: 1.8rem;
  line-height: 1.618;
  max-width: 38em;
  margin: auto;
  color: #4a4a4a;
  background-color: #f9f9f9;
  padding: 13px;
}
```

## 前提知識

- **em 単位の幅**: `38em` は、body の文字サイズの 38 倍の長さです。文字が大きくなれば、幅も同じ割合で広がります。
- **行の長さ（measure）**: 一行に入る文字数のことです。読みやすさのためには、一行あたりの文字数がおおむね決まった範囲に入るのが望ましいとされています。
- **line-height**: 行の高さを、文字サイズの倍率で表すプロパティです。`1.618` は黄金比に由来する値です。
- **背景色と文字色**: `color` が文字色、`background-color` が背景色です。ここでは、真っ白ではない色を使い、目の負担を減らしています。

## 何をしているか

### 1. 文字の大きさと行の高さ

```css:line-numbers=13
  font-size: 1.8rem;
  line-height: 1.618;
```

`font-size: 1.8rem` は、10px を基準にした 18px の文字です。`line-height: 1.618` は、その 1.618 倍の行の高さです。行間が広めなので、長い文章でも行が追いやすくなります。

### 2. 幅と中央そろえ

```css:line-numbers=15
  max-width: 38em;
  margin: auto;
```

`max-width: 38em` は、文字の大きさの 38 倍を上限にします。`margin: auto` で左右の余白を均等にして、箱を中央に置きます。文字を大きくすると、上限も同じ割合で広がるので、一行の文字数が保たれます。

### 3. 色と余白

```css:line-numbers=17
  color: #4a4a4a;
  background-color: #f9f9f9;
  padding: 13px;
```

`color: #4a4a4a` は真っ黒より少し柔らかい文字色、`background-color: #f9f9f9` はわずかに白を抑えた背景色です。`padding: 13px` は、画面の端から本文を少し離します。

## ここがすごい

- 幅を `px` ではなく `em` で決めているので、文字を大きくしても、一行の文字数が変わりません。読みやすさを、文字の大きさと一緒に保てます。
- 本文の大きさ、行の高さ、幅がすべて文字サイズを基準にしているので、一か所の `font-size` を変えれば全体が連動します。
- 素直に `width: 800px` と書くと、文字を大きくしたときに、一行の文字数が減ってしまいます。em で決めると、この問題を防げます。
- 黄金比に由来する `1.618` の行の高さは、読む人の目が疲れにくい、とよく言われる値です。根拠を示すコメントはありませんが、この数字を選んだ意図が名前から伝わります。

## まとめ

- `max-width` を em で書くと、文字の大きさに合わせて幅が広がります。
- `margin: auto` の一行で、本文を中央に置けます。
- 行の高さを 1.6 前後にすると、長い文章が追いやすくなります。
- 色は真っ黒を避けると、画面の印象が柔らかくなります。
